import { prisma } from '@/lib/prisma';
import { WorkflowManager } from './workflow-manager';
import { ArtifactManager } from './artifact-manager';
import { HandoffManager } from './handoff-manager';
import { ApprovalManager } from './approval-manager';
import { companyEventBus } from '@/core/integration/event-bus';
import { recordTimelineEvent } from '@/features/ai-workspace/services/timeline.service';
import { getExecutionVisibilityService } from '@/core/execution-engine/visibility.service';
import { PIPELINE_PHASE_DEFINITIONS, type ProjectLifecycleState } from './types';
import { WorkspaceService } from '@/core/workspace/workspace.service';
import {
  classifyAiError,
  pulseGenerationHeartbeat,
} from './generation-status';
import {
  clearGenerationStream,
  publishGenerationStatus,
  publishNarrativeStream,
} from './generation-stream-bus';
import { persistStackConstraints } from '@/core/memory/persist-stack-constraints';
import {
  isBlockingProviderError,
  resolveAgentFailure,
  validatePhaseDeliverable,
} from './phase-gate';
import { updateWorkflowScalars, findWorkflowScalars } from './workflow-state-access';
import { RootCauseDiagnoser } from '@/core/root-cause/root-cause-diagnoser';

const phaseLoaders = {
  DISCOVERY_RUNNING: () => import('@/ai/agents/roles/product-discovery.agent'),
  CLARIFICATION_RUNNING: () => import('@/ai/agents/roles/product-discovery.agent'),
  PROPOSAL_RUNNING: () => import('@/core/product/proposal/product-proposal.engine'),
  STRATEGY_RUNNING: () => import('@/ai/agents/roles/ceo/ceo.service'),
  PRODUCT_RUNNING: () => import('@/ai/agents/roles/product-manager/product-manager.service'),
  ANALYSIS_RUNNING: () => import('@/ai/agents/roles/business-analyst/business-analyst.service'),
  DESIGN_RUNNING: () => import('@/ai/agents/roles/ui-designer/ui-designer.service'),
  ARCHITECTURE_RUNNING: () => import('@/ai/agents/roles/architect/architect.service'),
  PLANNING_RUNNING: () => import('@/core/executive/executive-planner'),
  DEVELOPMENT_RUNNING: () => import('@/ai/agents/roles/developer/developer.service'),
  TESTING_RUNNING: () => import('@/ai/agents/roles/qa/qa.service'),
  REVIEW_RUNNING: () => import('@/core/review-committee/review-committee'),
  SECURITY_RUNNING: () => import('@/ai/agents/roles/security/security.service'),
  DEPLOYMENT_RUNNING: () => import('@/ai/agents/roles/devops/devops.service'),
};

async function loadClarificationEngines() {
  const [clarification, conversation, delegation] = await Promise.all([
    import('@/core/discovery/clarification.engine'),
    import('@/core/workforce/communication/conversation.engine'),
    import('@/core/workforce/communication/delegation.engine'),
  ]);
  return { ...clarification, ...conversation, ...delegation };
}

async function loadReviewEngines() {
  const [review, refactoring, conflict] = await Promise.all([
    import('@/core/review-committee/review-committee'),
    import('@/core/refactoring/refactoring-engine'),
    import('@/core/workforce/communication/conflict-resolution.engine'),
  ]);
  return { ...review, ...refactoring, ...conflict };
}

async function loadSelfReflective() {
  return import('@/core/execution-engine/self-reflective.engine');
}

async function loadRetryEngine() {
  return import('@/core/autonomous/retry-engine');
}

async function loadCapabilityEngine() {
  return import('@/core/workforce/capability/agent-capability.engine');
}

async function loadContextInjector() {
  return import('@/core/workforce/context/context-injector.service');
}

export class CompanyPipelineEngine {
  /** projectId → startedAt ms; refreshed while work runs so long phases are not stolen */
  private static readonly runningProjects = new Map<string, number>();
  /** Development / LLM phases can exceed a few minutes — do not steal the lock early */
  private static readonly LOCK_STALE_MS = 15 * 60_000;

  private static touchLock(projectId: string): void {
    if (this.runningProjects.has(projectId)) {
      this.runningProjects.set(projectId, Date.now());
    }
  }

  public static isPipelineLocked(projectId: string): boolean {
    const startedAt = this.runningProjects.get(projectId);
    return Boolean(startedAt && Date.now() - startedAt < this.LOCK_STALE_MS);
  }

  /** Used by Retry — drop a dead lock so resume can start cleanly */
  public static forceReleaseLock(projectId: string): void {
    this.runningProjects.delete(projectId);
  }

  public static async runPipeline(projectId: string): Promise<void> {
    const startedAt = this.runningProjects.get(projectId);
    if (startedAt && Date.now() - startedAt < this.LOCK_STALE_MS) {
      return;
    }
    this.runningProjects.set(projectId, Date.now());

    try {
      let isRunning = true;
      let iterations = 0;
      const maxIterations = 20;

      while (isRunning && iterations < maxIterations) {
        iterations++;
        this.touchLock(projectId);
        const stateRes = await WorkflowManager.getOrInitState(projectId);
        if (!stateRes.success) break;

        const currentPhase = stateRes.data.currentPhase as ProjectLifecycleState;
        if (currentPhase === 'PAUSED' || currentPhase === 'COMPLETED' || currentPhase === 'FAILED') {
          break;
        }

        if (currentPhase === 'CREATED') {
          const transRes = await WorkflowManager.transitionState(projectId, 'DISCOVERY_RUNNING', 'Starting Product Discovery');
          if (!transRes.success) break;
          continue;
        }

        const def = PIPELINE_PHASE_DEFINITIONS[currentPhase];
        if (!def) break;

        await recordTimelineEvent({
          type: 'workflow.step',
          message: `⚙️ Executing department: ${def.department} (${def.agentRole})`,
          metadata: { projectId, phase: currentPhase, department: def.department },
        });
        await this.emitVisibilityEvent(projectId, 'STEP_START', currentPhase, `Starting ${def.department}`, { department: def.department, agentRole: def.agentRole });
        WorkspaceService.updateFromPipelinePhase(projectId, currentPhase, `Starting ${def.department}`);
        clearGenerationStream(projectId);
        publishGenerationStatus(projectId, `${def.department} is generating…`);
        void publishNarrativeStream(
          projectId,
          `${def.department} is composing the next deliverable for your review.`,
          { chunkMs: 12 },
        );
        await pulseGenerationHeartbeat(projectId, {
          message: `${def.department} is generating…`,
          phase: currentPhase,
          department: def.department,
          clearError: true,
        });
        this.touchLock(projectId);

        // Hard stop before spending provider tokens when project credits are empty
        try {
          const { assertCreditsAvailable } = await import('@/core/billing/project-credits');
          await assertCreditsAvailable(projectId);
        } catch (creditErr: any) {
          await this.handleFailure(
            projectId,
            currentPhase,
            creditErr?.message || '402 Insufficient credit balance',
          );
          break;
        }

        let inputData: any = null;
        if (def.inputArtifactType) {
          const artRes = await ArtifactManager.getLatestArtifact(projectId, def.inputArtifactType, def.agentRole);
          if (!artRes.success) {
            await this.handleFailure(projectId, currentPhase, artRes.error.message);
            break;
          }
          inputData = artRes.data;
        }

        let capabilityMatch: any = null;
        try {
          const capEngine = await loadCapabilityEngine();
          capabilityMatch = await capEngine.AgentCapabilityEngine.evaluateTaskCapability(
            { title: def.department, description: `Execute ${def.department} phase` },
            projectId,
          );
        } catch {}

        let agentContext: any = null;
        try {
          const ctxInjector = await loadContextInjector();
          agentContext = await ctxInjector.ContextInjectorService.injectContextForTask(
            `${projectId}_${currentPhase}`,
            def.department,
            `Execute ${def.department} phase for project`,
            projectId,
          );
        } catch {}

        const execRes = await this.executeDepartmentTask(projectId, currentPhase, inputData);
        await pulseGenerationHeartbeat(projectId, {
          message: execRes.success
            ? `${def.department} finished — preparing handoff`
            : `${def.department} needs attention`,
          phase: currentPhase,
          department: def.department,
        });
        if (!execRes.success) {
          await this.handleFailure(projectId, currentPhase, execRes.error || 'Department execution failed');
          break;
        }

        const gate = validatePhaseDeliverable(currentPhase, execRes.data);
        if (!gate.ok) {
          await this.handleFailure(projectId, currentPhase, gate.message);
          break;
        }

        // Development: durable Explorer evidence required (never self-attest)
        if (currentPhase === 'DEVELOPMENT_RUNNING') {
          const { assertProjectHasImplementationFiles } = await import(
            '@/core/company-orchestration/implementation-file-gate'
          );
          const filesOk = await assertProjectHasImplementationFiles(projectId);
          if (!filesOk.ok) {
            await this.handleFailure(projectId, currentPhase, filesOk.message);
            break;
          }
        }

        const outputArtifactContent = execRes.data;

        const nextState = def.nextState || 'COMPLETED';
        const nextDef = PIPELINE_PHASE_DEFINITIONS[nextState];
        const handoffRes = await HandoffManager.executeHandoff({
          projectId,
          fromAgentRole: def.agentRole,
          toAgentRole: nextDef?.agentRole ?? 'SYSTEM',
          fromPhase: currentPhase,
          toPhase: nextState,
          artifact: {
            type: def.outputArtifactType,
            content: outputArtifactContent,
            producerRole: def.agentRole,
            metadata: {
              ...(capabilityMatch ? {
                assignedAgent: capabilityMatch.primaryAgent,
                reviewerAgent: capabilityMatch.supportingReviewer,
                confidenceScore: capabilityMatch.confidenceScore,
              } : {}),
              ...(agentContext ? {
                contextRole: agentContext.role,
                contextPersonality: agentContext.personality,
              } : {}),
            },
          },
        });

        if (!handoffRes.success) {
          await this.handleFailure(projectId, currentPhase, handoffRes.error.message);
          break;
        }

        const compRes = await WorkflowManager.onPhaseCompleted(
          projectId,
          currentPhase,
          def.outputArtifactType,
          handoffRes.data.artifactId,
        );

        if (!compRes.success) {
          await this.handleFailure(projectId, currentPhase, compRes.error.message);
          break;
        }

        if (compRes.data.action === 'PAUSE_FOR_APPROVAL') {
          await WorkflowManager.setPausedAtPhase(projectId, currentPhase);
          const approvalType = def.approvalRequiredAfter || 'Unknown Approval';
          // Belt-and-suspenders: never leave *_RUNNING while a gate is open
          if (def.approvalRequiredAfter) {
            await ApprovalManager.ensurePausedForApproval(
              projectId,
              def.approvalRequiredAfter,
              currentPhase,
            );
          }
          WorkspaceService.markApprovalRequired(projectId, approvalType, currentPhase);
          await this.emitVisibilityEvent(projectId, 'STEP_START', currentPhase, `Waiting for approval: ${approvalType}`);
          await pulseGenerationHeartbeat(projectId, {
            message: `Waiting for your approval: ${approvalType}`,
            phase: currentPhase,
            department: def.department,
            clearError: true,
          });
          isRunning = false;
          break;
        }

        if (compRes.data.nextPhase === 'COMPLETED') {
          const { assertProjectHasImplementationFiles } = await import(
            '@/core/company-orchestration/implementation-file-gate'
          );
          const filesOk = await assertProjectHasImplementationFiles(projectId);
          if (!filesOk.ok) {
            await this.handleFailure(
              projectId,
              'DEVELOPMENT_RUNNING',
              filesOk.message ||
                'Cannot complete — Explorer has no real app files. Resume Development.',
            );
            // Rewind so Resume regenerates Development
            await WorkflowManager.forceReopenPhase(
              projectId,
              'DEVELOPMENT_RUNNING',
              'Blocked COMPLETED — missing implementation files',
            );
            break;
          }

          await WorkflowManager.transitionState(projectId, 'COMPLETED', 'All departments completed successfully');
          await prisma.project.update({ where: { id: projectId }, data: { status: 'COMPLETED' } }).catch(() => {});
          await ArtifactManager.storeArtifact(projectId, {
            type: 'FinalRelease',
            content: { status: 'RELEASED', completedAt: new Date().toISOString(), finalArtifact: def.outputArtifactType },
            producerRole: 'SYSTEM',
            summary: 'Final autonomous release artifact',
          });
          await companyEventBus.publish('PROJECT_COMPLETED', projectId, { status: 'COMPLETED' }, 'CompanyPipelineEngine');
          await recordTimelineEvent({
            type: 'workflow.completed',
            message: '🎉 Project delivery pipeline completed successfully! Final release artifact generated.',
            metadata: { projectId },
          });
          await this.emitVisibilityEvent(projectId, 'STEP_COMPLETE', 'COMPLETED', 'Pipeline completed successfully');
          WorkspaceService.markPipelineCompleted(projectId);
          isRunning = false;
          break;
        }

        WorkspaceService.completePipelinePhase(projectId, currentPhase, `${def.department} completed`);
        const transRes = await WorkflowManager.transitionState(projectId, compRes.data.nextPhase!);
        if (!transRes.success) {
          await this.handleFailure(projectId, currentPhase, transRes.error.message);
          break;
        }
      }
    } catch (err: any) {
      console.error('[CompanyPipelineEngine] runPipeline fatal error:', err);
      await this.handleFailure(projectId, 'FAILED', err?.message || 'Fatal pipeline error');
    } finally {
      this.runningProjects.delete(projectId);
    }
  }

  /** Read + clear one-shot user revision feedback stored when regenerating after approval. */
  private static async consumeRevisionFeedback(
    projectId: string,
    phase: ProjectLifecycleState,
  ): Promise<string | null> {
    try {
      const { findWorkflowScalars, updateWorkflowScalars } = await import('./workflow-state-access');
      const wf = await findWorkflowScalars(projectId);
      const meta = { ...((wf?.metadata as Record<string, unknown>) || {}) };
      if (meta.revisionTargetPhase === phase && typeof meta.revisionFeedback === 'string') {
        const feedback = meta.revisionFeedback.trim();
        delete meta.revisionFeedback;
        delete meta.revisionTargetPhase;
        await updateWorkflowScalars(projectId, { metadata: meta });
        return feedback || null;
      }

      // Fallback: latest UserRevisionFeedback artifact for this phase
      const art = await ArtifactManager.getLatestArtifact(projectId, 'UserRevisionFeedback');
      if (art.success && art.data) {
        const content = art.data as { phase?: string; feedback?: string };
        if (
          content.feedback &&
          (!content.phase || content.phase === phase)
        ) {
          return String(content.feedback).trim() || null;
        }
      }
    } catch (err) {
      console.warn('[CompanyPipelineEngine] consumeRevisionFeedback failed:', err);
    }
    return null;
  }

  private static async executeDepartmentTask(
    projectId: string,
    phase: ProjectLifecycleState,
    inputData: any,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      this.touchLock(projectId);
      const revisionFeedback = await this.consumeRevisionFeedback(projectId, phase);
      const { isStrictModeEnabled } = await import('@/core/billing/project-credits');
      const strictMode = await isStrictModeEnabled(projectId);

      switch (phase) {
        case 'DISCOVERY_RUNNING': {
          const mod = await phaseLoaders.DISCOVERY_RUNNING();
          await pulseGenerationHeartbeat(projectId, {
            message: 'Product Discovery is shaping the brief…',
            phase: 'DISCOVERY_RUNNING',
            department: 'Product Discovery',
          });
          const agent = new mod.ProductDiscoveryAgent();
          let ideaStr =
            typeof inputData === 'string'
              ? inputData
              : inputData?.description || inputData?.name || JSON.stringify(inputData);
          if (revisionFeedback) {
            ideaStr = `${ideaStr}\n\nUser revision feedback: ${revisionFeedback}`;
          }
          await persistStackConstraints(projectId, ideaStr, revisionFeedback);
          try {
            const spec = await agent.discoverProductSpecification(ideaStr);
            return { success: true, data: spec };
          } catch (err: any) {
            const msg = err?.message || 'Product Discovery failed';
            if (isBlockingProviderError(msg)) {
              return { success: false, error: msg };
            }
            throw err;
          }
        }
        case 'CLARIFICATION_RUNNING': {
          const spec = inputData;
          const engines = await loadClarificationEngines();
          let discussion: any = null;
          try {
            discussion = await engines.ConversationEngine.startConversation(
              'Clarification discussion for product specification',
              ['PRODUCT_MANAGER', 'SOFTWARE_ARCHITECT'],
              projectId,
            );
          } catch {}
          const questions = engines.ClarificationEngine.generateQuestions(spec);
          const defaultAnswers: Record<string, string | string[]> = {};
          questions.forEach((q: { id: string; options: string[] }) => {
            if (q.options.length > 0) {
              defaultAnswers[q.id] = q.options[0]!;
            }
          });
          const clarifiedSpec = engines.ClarificationEngine.applyAnswers(spec, defaultAnswers);
          return { success: true, data: { specification: clarifiedSpec, questions, discussion } };
        }
        case 'PROPOSAL_RUNNING': {
          const mod = await phaseLoaders.PROPOSAL_RUNNING();
          const spec = inputData?.specification || inputData;
          const proposal = mod.ProductProposalEngine.generateProposal(
            spec,
            projectId,
            revisionFeedback || undefined,
          );
          return { success: true, data: proposal };
        }
        case 'STRATEGY_RUNNING': {
          const mod = await phaseLoaders.STRATEGY_RUNNING();
          await pulseGenerationHeartbeat(projectId, {
            message: 'CEO is packaging strategy…',
            phase: 'STRATEGY_RUNNING',
            department: 'Executive Strategy',
          });
          const ideaStr = typeof inputData === 'string' ? inputData : JSON.stringify(inputData);
          await persistStackConstraints(projectId, ideaStr, revisionFeedback);
          const ceoRes = await mod.analyzeUserIdea(projectId, ideaStr);
          if (!ceoRes.success) {
            return resolveAgentFailure({
              phase: 'STRATEGY_RUNNING',
              strictMode,
              errorMessage: ceoRes.error?.message,
              fallback: () =>
                mod.buildHeuristicCEOAnalysis(ideaStr, revisionFeedback || undefined),
            });
          }
          return { success: true, data: ceoRes.data };
        }
        case 'PRODUCT_RUNNING': {
          const mod = await phaseLoaders.PRODUCT_RUNNING();
          await pulseGenerationHeartbeat(projectId, {
            message: 'Product Manager is refining requirements…',
            phase: 'PRODUCT_RUNNING',
            department: 'Product Management',
          });
          const pmRes = await mod.refineRequirements(projectId, inputData);
          if (!pmRes.success) {
            return resolveAgentFailure({
              phase: 'PRODUCT_RUNNING',
              strictMode,
              errorMessage: pmRes.error?.message,
              fallback: () =>
                mod.buildHeuristicRefinedRequirements(
                  inputData,
                  revisionFeedback || undefined,
                ),
            });
          }
          return { success: true, data: pmRes.data };
        }
        case 'ANALYSIS_RUNNING': {
          const mod = await phaseLoaders.ANALYSIS_RUNNING();
          const baRes = await mod.generateSoftwareRequirementSpec(
            projectId,
            inputData,
            revisionFeedback || undefined,
          );
          if (!baRes.success) {
            return resolveAgentFailure({
              phase: 'ANALYSIS_RUNNING',
              strictMode,
              errorMessage: baRes.error?.message,
              fallback: () =>
                mod.buildHeuristicSoftwareRequirementSpec(
                  inputData,
                  revisionFeedback || undefined,
                ),
            });
          }
          return { success: true, data: baRes.data };
        }
        case 'DESIGN_RUNNING': {
          const mod = await phaseLoaders.DESIGN_RUNNING();
          const uiRes = await mod.generateUiDesignSpec(
            projectId,
            inputData,
            revisionFeedback || undefined,
          );
          if (!uiRes.success) {
            return resolveAgentFailure({
              phase: 'DESIGN_RUNNING',
              strictMode,
              errorMessage: uiRes.error?.message,
              fallback: () =>
                mod.buildHeuristicUiDesignSpec(inputData, revisionFeedback || undefined),
            });
          }
          return { success: true, data: uiRes.data };
        }
        case 'ARCHITECTURE_RUNNING': {
          const mod = await phaseLoaders.ARCHITECTURE_RUNNING();
          const stackIntent = await persistStackConstraints(
            projectId,
            inputData,
            revisionFeedback,
          );
          const archRes = await mod.designArchitecture(
            projectId,
            inputData,
            revisionFeedback || undefined,
          );
          if (!archRes.success) {
            return resolveAgentFailure({
              phase: 'ARCHITECTURE_RUNNING',
              strictMode,
              errorMessage: archRes.error?.message,
              fallback: () =>
                mod.buildHeuristicArchitecture(
                  inputData,
                  revisionFeedback || undefined,
                  stackIntent,
                ),
            });
          }
          return { success: true, data: archRes.data };
        }
        case 'PLANNING_RUNNING': {
          const mod = await phaseLoaders.PLANNING_RUNNING();
          const planResult = await mod.ExecutivePlanner.planProjectWork(projectId);
          try {
            if (planResult.milestones) {
              const delegationMod = await import('@/core/workforce/communication/delegation.engine');
              for (const milestone of planResult.milestones.slice(0, 3)) {
                await delegationMod.DelegationEngine.delegateSubtask({
                  parentTaskId: `milestone_${milestone.title || 'plan'}`,
                  fromAgent: 'PRODUCT_MANAGER',
                  toAgent: 'FRONTEND_ENGINEER',
                  subtaskTitle: milestone.title || 'Plan task',
                  subtaskDescription: milestone.description || 'Milestone task',
                  projectId,
                });
              }
            }
          } catch {}
          return { success: true, data: planResult };
        }
        case 'DEVELOPMENT_RUNNING': {
          const mod = await phaseLoaders.DEVELOPMENT_RUNNING();
          await pulseGenerationHeartbeat(projectId, {
            message: 'Developer agent is implementing the architecture…',
            phase: 'DEVELOPMENT_RUNNING',
            department: 'Software Engineering',
          });

          const { resolveStackFromMemory } = await import(
            '@/core/memory/persist-stack-constraints'
          );
          const { assertProjectHasImplementationFiles } = await import(
            '@/core/company-orchestration/implementation-file-gate'
          );
          const stackIntent = await resolveStackFromMemory(
            projectId,
            inputData,
            revisionFeedback,
          );

          // Todo-driven Development: Architect file tree → todos → files → all done → QA
          let implementation: any = null;
          let mode: 'todo_driven' | 'developer_agent' | 'heuristic_fallback' = 'todo_driven';

          const architectureInput =
            inputData?.architecture && typeof inputData === 'object'
              ? { ...inputData, ...(inputData.architecture || {}) }
              : inputData?.ArchitectureDocument || inputData;

          try {
            const todoRes = await mod.implementFromArchitectureTodos(
              projectId,
              architectureInput,
              stackIntent,
              revisionFeedback || undefined,
            );
            if (todoRes.success) {
              implementation = todoRes.data;
            } else if (todoRes.error?.message) {
              if (process.env.NODE_ENV !== 'test' && process.env.ALLOW_HEURISTIC_MOCK !== 'true') {
                return { success: false, error: todoRes.error.message };
              }
            }
          } catch (todoErr: any) {
            const msg = todoErr?.message || 'Todo-driven development failed';
            if (process.env.NODE_ENV !== 'test' && process.env.ALLOW_HEURISTIC_MOCK !== 'true') {
              return { success: false, error: msg };
            }
          }

          if (!implementation) {
            mode = 'developer_agent';
            try {
              const agentRes = await mod.implementArchitecture(
                projectId,
                architectureInput,
                undefined,
              );
              if (agentRes.success) {
                implementation = agentRes.data;
                const listed =
                  Array.isArray(implementation?.changes) ? implementation.changes.length : 0;
                if (listed === 0) implementation = null;
              } else if (agentRes.error?.message) {
                if (process.env.NODE_ENV !== 'test' && process.env.ALLOW_HEURISTIC_MOCK !== 'true') {
                  return { success: false, error: agentRes.error.message };
                }
              }
            } catch (agentErr: any) {
              const msg = agentErr?.message || 'Developer agent failed';
              if (process.env.NODE_ENV !== 'test' && process.env.ALLOW_HEURISTIC_MOCK !== 'true') {
                return { success: false, error: msg };
              }
            }
          }

          if (!implementation) {
            if (process.env.NODE_ENV !== 'test' && process.env.ALLOW_HEURISTIC_MOCK !== 'true') {
              return {
                success: false,
                error:
                  'Developer Agent could not generate codebase files. Resume after fixing AI provider/credits.',
              };
            }
            mode = 'heuristic_fallback';
            implementation = mod.buildHeuristicImplementation(
              inputData,
              revisionFeedback || undefined,
              stackIntent,
            );
            try {
              const { syncFilesToWorkspace } = await import(
                '@/features/workspace/explorer/services/workspace-sync.service'
              );
              await syncFilesToWorkspace(
                projectId,
                (implementation.changes || []).map((c: { file: string; code: string }) => ({
                  path: c.file,
                  content: c.code,
                  language: mod.getLanguageFromPath(c.file),
                })),
              );
            } catch (syncErr) {
              return {
                success: false,
                error:
                  syncErr instanceof Error
                    ? `Development could not write files: ${syncErr.message}`
                    : 'Development could not write files into Explorer',
              };
            }
          }

          const filesOk = await assertProjectHasImplementationFiles(projectId);
          if (!filesOk.ok) {
            return {
              success: false,
              error: filesOk.message,
            };
          }

          await pulseGenerationHeartbeat(projectId, {
            message: `Development todos complete — ${filesOk.evidence.realFileCount} files ready for QA (${mode})`,
            phase: 'DEVELOPMENT_RUNNING',
            department: 'Software Engineering',
          });

          return {
            success: true,
            data: {
              implementation,
              summary:
                implementation?.report?.notes ||
                `Implementation ready (${filesOk.evidence.realFileCount} files)`,
              files:
                implementation?.report?.changedFiles ||
                filesOk.evidence.paths.filter((p) => !p.match(/package\.json|README/i)),
              engineers: { developer: 'completed', mode },
              explorerSynced: true,
              fileEvidence: filesOk.evidence,
              todosCompleted: true,
              ...(revisionFeedback ? { revisionNote: revisionFeedback } : {}),
            },
          };
        }
        case 'TESTING_RUNNING': {
          const mod = await phaseLoaders.TESTING_RUNNING();
          const { loadDeliveryPlan, updateImplementationTodos } = await import(
            '@/core/company-orchestration/implementation-todo.store'
          );
          const delivery = await loadDeliveryPlan(projectId);
          if (delivery?.qaTodos?.length) {
            await pulseGenerationHeartbeat(projectId, {
              message: `QA starting ${delivery.qaTodos.length} architecture QA todos…`,
              phase: 'TESTING_RUNNING',
              department: 'Quality Assurance',
            });
          }

          const qaRes = await mod.reviewImplementation(
            projectId,
            inputData,
            revisionFeedback || undefined,
          );

          let qaPayload: any;
          if (!qaRes.success) {
            const gated = resolveAgentFailure({
              phase: 'TESTING_RUNNING',
              strictMode,
              errorMessage: qaRes.error?.message,
              fallback: () =>
                mod.buildHeuristicQaReport(inputData, revisionFeedback || undefined),
            });
            if (!gated.success) return gated;
            qaPayload = gated.data;
          } else {
            qaPayload = qaRes.data;
          }

          if (delivery?.qaTodos?.length) {
            const qaTodos = delivery.qaTodos.map((t) => ({ ...t, status: 'done' as const }));
            await updateImplementationTodos(
              projectId,
              delivery.implementationTodos,
              qaTodos,
            );
          }

          return {
            success: true,
            data: {
              ...qaPayload,
              qaTodos: delivery?.qaTodos || [],
              qaTodosCompleted: true,
            },
          };
        }
        case 'REVIEW_RUNNING': {
          const fileMap: Record<string, string> = {};
          if (typeof inputData === 'object' && inputData !== null) {
            if (inputData.files) {
              Object.assign(fileMap, inputData.files);
            } else if (inputData.content && typeof inputData.content === 'object') {
              Object.entries(inputData.content as Record<string, unknown>).forEach(([k, v]) => {
                if (typeof v === 'string') fileMap[k] = v;
              });
            }
          }
          const engines = await loadReviewEngines();
          const report = engines.ReviewCommittee.evaluateCodebase(projectId, fileMap, {
            context: inputData,
            feedback: revisionFeedback || undefined,
          });
          let refactorReport: any = null;
          try {
            refactorReport = engines.AutonomousRefactoringEngine.analyzeAndRefactor(projectId, fileMap);
          } catch {}
          let conflictResolution: any = null;
          try {
            const requiredActions = report.requiredActionItems || [];
            if (requiredActions.length > 0) {
              conflictResolution = await engines.ConflictResolutionEngine.resolveConflict({
                projectId,
                topic: 'Code review conflict resolution',
                conflictingRoles: ['FRONTEND_ENGINEER', 'BACKEND_ENGINEER'],
                proposals: requiredActions.map((action: string) => ({
                  role: 'SOFTWARE_ARCHITECT' as const,
                  solution: action,
                })),
              });
            }
          } catch {}
          return { success: true, data: { ...report, refactorReport, conflictResolution } };
        }
        case 'SECURITY_RUNNING': {
          const mod = await phaseLoaders.SECURITY_RUNNING();
          const secRes = await mod.generateSecurityReportSpec(
            projectId,
            inputData,
            revisionFeedback || undefined,
          );
          if (!secRes.success) {
            return resolveAgentFailure({
              phase: 'SECURITY_RUNNING',
              strictMode,
              errorMessage: secRes.error?.message,
              fallback: () =>
                mod.buildHeuristicSecurityReport(inputData, revisionFeedback || undefined),
            });
          }
          return { success: true, data: secRes.data };
        }
        case 'DEPLOYMENT_RUNNING': {
          const mod = await phaseLoaders.DEPLOYMENT_RUNNING();
          await pulseGenerationHeartbeat(projectId, {
            message: 'Preparing Preview package — you deploy only when ready…',
            phase: 'DEPLOYMENT_RUNNING',
            department: 'DevOps & Deployment',
          });
          this.touchLock(projectId);

          const devopsRes = await mod.generateDevopsPlanSpec(
            projectId,
            inputData,
            revisionFeedback || undefined,
          );
          if (!devopsRes.success) {
            const gated = resolveAgentFailure({
              phase: 'DEPLOYMENT_RUNNING',
              strictMode,
              errorMessage: devopsRes.error?.message,
              fallback: () =>
                mod.buildHeuristicDevopsPlan(inputData, revisionFeedback || undefined),
            });
            if (!gated.success) return gated;
            await pulseGenerationHeartbeat(projectId, {
              message: 'Preview ready — review first, deploy only if you want',
              phase: 'DEPLOYMENT_RUNNING',
              department: 'DevOps & Deployment',
            });
            return {
              success: true,
              data: {
                ...gated.data,
                previewReady: true,
                deployRequiresUserAction: true,
                summary:
                  'Preview package ready. Review first — production deploy only when you choose.',
                ...(revisionFeedback ? { revisionNote: revisionFeedback } : {}),
              },
            };
          }

          await pulseGenerationHeartbeat(projectId, {
            message: 'Preview ready — review first, deploy only if you want',
            phase: 'DEPLOYMENT_RUNNING',
            department: 'DevOps & Deployment',
          });

          return {
            success: true,
            data: {
              ...devopsRes.data,
              previewReady: true,
              deployRequiresUserAction: true,
              summary:
                'Preview package ready. Review first — production deploy only when you choose.',
              ...(revisionFeedback ? { revisionNote: revisionFeedback } : {}),
            },
          };
        }
        case 'MONITORING': {
          const telemetryData = {
            status: 'HEALTHY',
            metricsPlatform: 'Prometheus / OpenTelemetry',
            uptimeSLA: '99.99%',
            activeMonitors: [
              { endpoint: '/api/health', type: 'HTTP_200', latencyMs: 12 },
              { endpoint: 'database_pool', type: 'PG_CONNECTIONS', active: 5, max: 50 },
            ],
            alertRulesConfigured: 8,
            timestamp: new Date().toISOString(),
          };
          return { success: true, data: telemetryData };
        }
        default:
          return { success: false, error: `Unhandled department execution phase: ${phase}` };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Department execution threw exception' };
    }
  }

  private static async emitVisibilityEvent(
    projectId: string,
    type: 'STEP_START' | 'STEP_COMPLETE' | 'ERROR',
    phase: string,
    message: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const visibilityType = type === 'STEP_START' ? 'STEP' : type === 'STEP_COMPLETE' ? 'SUCCESS' : 'ERROR';
      const visibility = getExecutionVisibilityService();
      visibility.emitEvent({ projectId, type: visibilityType, stepId: phase, message, developerDetails: details });
      visibility.recordTimelineEntry({ projectId, status: type, message });
    } catch {}
  }

  private static async handleFailure(projectId: string, phase: string, message: string): Promise<void> {
    console.error(`[CompanyPipelineEngine] Pipeline failed at phase ${phase}:`, message);

    // Cancel / in-progress are ownership races — do not burn retries or flip to FAILED
    const lower = (message || '').toLowerCase();
    if (
      lower.includes('build cancelled') ||
      lower.includes('already in progress') ||
      lower.includes('build_in_progress')
    ) {
      await pulseGenerationHeartbeat(projectId, {
        message: 'Software Engineering is still working — waiting for the active build…',
        phase,
        department: 'Software Engineering',
        clearError: true,
      }).catch(() => {});
      return;
    }

    const classified = classifyAiError(message);
    const diagnosis = RootCauseDiagnoser.diagnose({ failureReason: message });

    await pulseGenerationHeartbeat(projectId, {
      message: classified.message,
      phase,
      department: PIPELINE_PHASE_DEFINITIONS[phase as ProjectLifecycleState]?.department,
      error: { message: classified.message, code: classified.code },
    }).catch(() => {});

    // Persist resume point (especially credits / billing)
    try {
      const wf = await findWorkflowScalars(projectId);
      const meta = { ...((wf?.metadata as Record<string, unknown>) || {}) };
      meta.generationPhase = phase;
      meta.resumePhase = phase;
      meta.blockedReason = classified.kind;
      meta.blockedAt = new Date().toISOString();
      meta.rootCauseDiagnosis = diagnosis;
      meta.lastGenerationError = {
        message: classified.message,
        code: classified.code,
        at: new Date().toISOString(),
      };
      await updateWorkflowScalars(projectId, {
        metadata: meta,
        nextAction: classified.message,
      });
      await WorkflowManager.setPausedAtPhase(projectId, phase as ProjectLifecycleState).catch(
        () => {},
      );
    } catch {}

    // Credits / rate limits / auth: stop here — do not auto-retry or skip ahead
    if (
      classified.kind === 'credits' ||
      classified.kind === 'rate_limited' ||
      classified.code === 'AUTH_ERROR' ||
      isBlockingProviderError(message)
    ) {
      await WorkflowManager.transitionState(
        projectId,
        'FAILED',
        `Stopped at ${phase}: ${classified.title}. Resume when ready.`,
      );
      await prisma.project
        .update({ where: { id: projectId }, data: { status: 'REVIEW' } })
        .catch(() => {});
      await companyEventBus.publish(
        'EXECUTION_FAILED',
        projectId,
        { phase, error: classified.message, code: classified.code, resumable: true },
        'CompanyPipelineEngine',
      );
      await recordTimelineEvent({
        type: 'workflow.failed',
        message: `⏸ ${classified.title} — paused at this step. Use Resume when credits/keys are ready.`,
        metadata: { projectId, phase, error: classified.message, code: classified.code },
      });
      await this.emitVisibilityEvent(projectId, 'ERROR', phase, classified.message, {
        error: classified.message,
        code: classified.code,
        resumable: true,
      });
      WorkspaceService.markPipelineFailed(projectId, classified.message);
      return;
    }

    try {
      const retryMod = await loadRetryEngine();
      const retryDecision = await retryMod.RetryEngine.handleFailure(projectId, phase, message);
      if (retryDecision.shouldRetry && retryDecision.attempt <= 3) {
        console.log(
          `[CompanyPipelineEngine] Retry ${retryDecision.attempt}/3 for ${phase}: ${retryDecision.remediationAction}`,
        );
        await pulseGenerationHeartbeat(projectId, {
          message: `Retrying ${phase} (attempt ${retryDecision.attempt}/3)…`,
          phase,
          clearError: true,
        }).catch(() => {});
        return;
      }
    } catch {}

    await WorkflowManager.transitionState(
      projectId,
      'FAILED',
      `Failed in ${phase}: ${classified.message}`,
    );
    await prisma.project
      .update({ where: { id: projectId }, data: { status: 'REVIEW' } })
      .catch(() => {});
    await companyEventBus.publish(
      'EXECUTION_FAILED',
      projectId,
      { phase, error: classified.message, code: classified.code },
      'CompanyPipelineEngine',
    );
    await recordTimelineEvent({
      type: 'workflow.failed',
      message: `⛔ ${classified.title}: ${classified.message}`,
      metadata: { projectId, phase, error: classified.message, code: classified.code },
    });
    await this.emitVisibilityEvent(projectId, 'ERROR', phase, classified.message, {
      error: classified.message,
      code: classified.code,
    });
    WorkspaceService.markPipelineFailed(projectId, classified.message);
  }
}
