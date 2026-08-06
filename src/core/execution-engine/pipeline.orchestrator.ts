import type { ProjectEntity, ProjectExecutionStatus, ProjectTaskEntity } from './types';
import type { AgentRole } from '@/ai/agents/core/agent.types';
import { getProjectExecutionService } from './project.service';
import { getTaskManagementEngine } from './task.engine';
import { getArtifactManagementSystem } from './artifact.system';
import { getApprovalManagementService } from './approval.service';
import { getExecutionVisibilityService } from './visibility.service';
import { selectWorkflowForInput } from '@/ai/router/workflow.selector';
import { getWorkflow } from '@/core/workflow-engine/workflow.registry';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { getExecutionEngine } from '@/ai/agents/core/execution.engine';
import { prisma } from '@/lib/prisma';
import { getAgentBudgetManager } from './budget.manager';
import { getCollaborationManager } from './collaboration.manager';
import { ProductDiscoveryAgent } from '@/ai/agents/roles/product-discovery.agent';
import { ClarificationEngine } from '@/core/discovery/clarification.engine';
import { DiscoveryApprovalService } from '@/core/discovery/approval.service';
import { ArchitectureApprovalService } from '@/core/architecture/architecture-approval.service';
import { logAIEvent } from '@/ai/monitoring/ai.logger';

export interface PipelineExecutionResult {
  projectId: string;
  status: ProjectExecutionStatus;
  tasksCompleted: number;
  tasksFailed: number;
  artifactsProduced: number;
  approvalsRequested: number;
  totalDurationMs: number;
  timeline: Array<{
    taskId: string;
    agentRole: AgentRole;
    status: string;
    durationMs: number;
  }>;
}

interface AgentExecutor {
  (params: {
    projectId: string;
    taskId: string;
    role: AgentRole;
    description: string;
    inputData: unknown;
  }): Promise<{
    success: boolean;
    output?: unknown;
    error?: string;
    qualityScore?: number;
  }>;
}

export class PipelineOrchestrator {
  private projectService = getProjectExecutionService();
  private taskEngine = getTaskManagementEngine();
  private artifactSystem = getArtifactManagementSystem();
  private approvalService = getApprovalManagementService();
  private visibilityService = getExecutionVisibilityService();
  private memoryManager = getMemoryManager();
  private budgetManager = getAgentBudgetManager();
  private collabManager = getCollaborationManager();

  private agentExecutor: AgentExecutor;

  constructor(executor?: AgentExecutor) {
    this.agentExecutor = executor ?? this.defaultAgentExecutor.bind(this);
  }

  /**
   * Main entry point: transforms a user idea into a complete executed project.
   *
   * User Idea → Project → Workflow Selection → Task Generation →
   * Agent Execution (with retry) → Artifact Storage → Approval → Completion
   */
  async executeIdea(params: {
    owner: string;
    name: string;
    idea: string;
    autoApprove?: boolean;
  }): Promise<PipelineExecutionResult> {
    const startTime = Date.now();
    const timeline: PipelineExecutionResult['timeline'] = [];

    // ── Step 1: Create Project ──
    const workflowSelection = selectWorkflowForInput(params.idea);
    const project = await this.projectService.createProject({
      owner: params.owner,
      name: params.name,
      description: params.idea,
      workflowId: workflowSelection.workflowId,
      assignedAgents: workflowSelection.agents,
    });

    this.visibilityService.emitEvent({
      projectId: project.id,
      type: 'INFO',
      stepId: 'project_created',
      message: `Project "${params.name}" created with workflow: ${workflowSelection.workflowName}`,
    });

    // ── Step 0: Product Discovery & Clarification Approval ──
    await logAIEvent('DISCOVERY_STARTED', { projectId: project.id, idea: params.idea }, 'PRODUCT_DISCOVERY');
    const discoveryAgent = new ProductDiscoveryAgent();
    const productSpec = await discoveryAgent.discoverProductSpecification(params.idea);

    const questions = ClarificationEngine.generateQuestions(productSpec);
    productSpec.questions = questions;
    productSpec.clarificationRequired = questions.length > 0;

    await logAIEvent('QUESTIONS_GENERATED', { projectId: project.id, count: questions.length }, 'PRODUCT_DISCOVERY');
    await DiscoveryApprovalService.createProposalApproval(project.id, productSpec);

    if (!params.autoApprove) {
      const approvalStatus = await DiscoveryApprovalService.getApprovalStatus(project.id);
      if (approvalStatus !== 'APPROVED') {
        await this.projectService.updateProjectStatus(project.id, 'WAITING_FOR_APPROVAL');
        this.visibilityService.emitEvent({
          projectId: project.id,
          type: 'INFO',
          stepId: 'discovery_approval_waiting',
          message: `Product proposal created for "${productSpec.productName}". Waiting for user approval.`,
        });

        return {
          projectId: project.id,
          status: 'WAITING_FOR_APPROVAL',
          tasksCompleted: 0,
          tasksFailed: 0,
          artifactsProduced: 1,
          approvalsRequested: 1,
          totalDurationMs: Date.now() - startTime,
          timeline: [],
        };
      }
    }

    // ── Step 2: Generate Tasks from Workflow ──
    await this.projectService.updateProjectStatus(project.id, 'PLANNING');
    const tasks = await this.generateTasksFromWorkflow(project.id, workflowSelection.workflowId);

    this.visibilityService.emitEvent({
      projectId: project.id,
      type: 'INFO',
      stepId: 'ceo_vision',
      message: `Generated ${tasks.length} tasks for workflow: ${workflowSelection.workflowId}`,
    });

    // ── Step 3: Execute Tasks (DAG-ordered) ──
    await this.projectService.updateProjectStatus(project.id, 'DEVELOPMENT');
    let tasksCompleted = 0;
    let tasksFailed = 0;
    let artifactsProduced = 0;
    let approvalsRequested = 0;

    const maxIterations = tasks.length * 4; // Safety limit for retries
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;

      // Check completion
      const allDone = await this.taskEngine.areAllTasksCompleted(project.id);
      if (allDone) break;

      // Check hard failure
      const hasFailed = await this.taskEngine.hasFailedTasks(project.id);
      if (hasFailed && iteration > tasks.length * 2) {
        await this.projectService.updateProjectStatus(project.id, 'FAILED');
        break;
      }

      // Get next ready tasks
      const readyTasks = await this.taskEngine.getReadyTasks(project.id);
      if (readyTasks.length === 0) {
        // Check for approval-blocked tasks
        const pending = await this.approvalService.getPendingApprovals(project.id);
        if (pending.length > 0 && params.autoApprove) {
          for (const approval of pending) {
            await this.approvalService.approveRequest(approval.id, 'auto-approve');
            approvalsRequested++;
          }
          continue;
        }
        break; // No tasks available: either all done or deadlocked
      }

      // Execute each ready task
      for (const task of readyTasks) {
        const taskStart = Date.now();

        // Determine step phase and update project status
        const phaseStatus = this.getPhaseStatusForRole(task.agentRole);
        await this.projectService.updateProjectStatus(project.id, phaseStatus);

        this.visibilityService.emitEvent({
          projectId: project.id,
          type: 'STEP',
          stepId: this.getStepIdForRole(task.agentRole),
          message: `${task.agentRole} agent executing: ${task.description}`,
          developerDetails: { taskId: task.id, retryCount: task.retryCount },
        });

        await this.taskEngine.updateTaskStatus(task.id, 'RUNNING');

        // Collect input from dependency artifacts
        const input: Record<string, unknown> = {};

        // Inject shared agent collaboration memory (Gap 3)
        const recentDiscussions = await this.collabManager.getRecentContext(project.id);
        if (recentDiscussions.length > 0) {
          input['_collaborationContext'] = recentDiscussions;
        }

        const inputData = await this.collectTaskInput(project.id, task);
        const finalInput = { ...input, ...inputData };

        // Execute with retry
        const result = await this.executeWithRetry(project.id, task, finalInput);
        const taskDuration = Date.now() - taskStart;

        if (result.success) {
          // Store artifact
          const artifact = await this.artifactSystem.storeArtifact({
            ownerAgent: task.agentRole,
            projectId: project.id,
            type: `${task.agentRole}_OUTPUT`,
            title: `${task.agentRole}: ${task.description.substring(0, 60)}`,
            content: result.output,
            status: 'APPROVED',
          });

          await this.taskEngine.updateTaskStatus(task.id, 'COMPLETED', {
            outputArtifactId: artifact.id,
          });

          if (task.agentRole === 'FRONTEND' || task.agentRole === 'DEVELOPER') {
            await this.syncArtifactToWorkspace(project.id, result.output, task.agentRole);
          }

          // Gap 3: Share outcome in collaboration memory
          await this.collabManager.broadcastMessage(
            project.id,
            task.agentRole,
            `I have completed task "${task.description}". The artifact is stored and ready.`
          );

          // Store memory
          await this.memoryManager.storeShortTerm(project.id, {
            agentRole: task.agentRole,
            taskDescription: task.description,
            outcome: 'SUCCESS',
            qualityScore: result.qualityScore,
          });

          tasksCompleted++;
          artifactsProduced++;

          this.visibilityService.recordTimelineEntry({
            projectId: project.id,
            taskId: task.id,
            agentRole: task.agentRole,
            status: 'COMPLETED',
            message: `${task.agentRole} completed: ${task.description}`,
            durationMs: taskDuration,
            qualityScore: result.qualityScore,
          });

          // ── Architecture Approval Gate ──
          if (task.agentRole === 'ARCHITECT') {
            await ArchitectureApprovalService.createApprovalRequest(project.id, result.output);
            if (!params.autoApprove) {
              const archStatus = await ArchitectureApprovalService.getApprovalStatus(project.id);
              if (archStatus !== 'ARCHITECTURE_APPROVED') {
                await this.projectService.updateProjectStatus(project.id, 'WAITING_FOR_ARCHITECTURE_APPROVAL');
                this.visibilityService.emitEvent({
                  projectId: project.id,
                  type: 'INFO',
                  stepId: 'architecture_approval_waiting',
                  message: 'Architecture proposal created. Waiting for user approval.',
                });

                return {
                  projectId: project.id,
                  status: 'WAITING_FOR_ARCHITECTURE_APPROVAL',
                  tasksCompleted,
                  tasksFailed,
                  artifactsProduced,
                  approvalsRequested: approvalsRequested + 1,
                  totalDurationMs: Date.now() - startTime,
                  timeline: [],
                };
              }
            }
          }

          // Check if task requires human approval
          if (task.requiresApproval) {
            await this.approvalService.requestApproval({
              projectId: project.id,
              taskId: task.id,
              artifactId: artifact.id,
              requestedBy: task.agentRole,
              reason: task.approvalReason ?? `${task.agentRole} output requires human review`,
            });
            approvalsRequested++;

            this.visibilityService.emitEvent({
              projectId: project.id,
              type: 'APPROVAL',
              stepId: 'approval_required',
              message: `Human approval requested for ${task.agentRole} output`,
            });
          }

          timeline.push({
            taskId: task.id,
            agentRole: task.agentRole,
            status: 'COMPLETED',
            durationMs: taskDuration,
          });
        } else {
          tasksFailed++;

          // Store failure lesson in procedural memory
          await this.memoryManager.storeLesson(
            project.id,
            `${task.agentRole} failed: ${result.error}`,
            `Review ${task.agentRole} contract obligations and verify input data quality`,
          );

          this.visibilityService.emitEvent({
            projectId: project.id,
            type: 'ERROR',
            stepId: this.getStepIdForRole(task.agentRole),
            message: `${task.agentRole} failed after max retries: ${result.error}`,
          });

          this.visibilityService.recordTimelineEntry({
            projectId: project.id,
            taskId: task.id,
            agentRole: task.agentRole,
            status: 'FAILED',
            message: `${task.agentRole} failed: ${result.error}`,
            durationMs: taskDuration,
            error: result.error,
            retryCount: task.retryCount,
          });

          timeline.push({
            taskId: task.id,
            agentRole: task.agentRole,
            status: 'FAILED',
            durationMs: taskDuration,
          });
        }
      }
    }

    // ── Step 4: Determine Final Status ──
    const allCompleted = await this.taskEngine.areAllTasksCompleted(project.id);
    const finalStatus: ProjectExecutionStatus = allCompleted ? 'COMPLETED' : 'FAILED';
    await this.projectService.updateProjectStatus(project.id, finalStatus);

    if (allCompleted) {
      this.visibilityService.emitEvent({
        projectId: project.id,
        type: 'SUCCESS',
        stepId: 'complete',
        message: 'Project execution completed successfully!',
      });

      // Store long-term memory of successful project completion
      await this.memoryManager.storeLongTerm(project.id, {
        event: 'PROJECT_COMPLETED',
        workflow: workflowSelection.workflowId,
        tasksCompleted,
        artifactsProduced,
        totalDuration: Date.now() - startTime,
      });
    }

    return {
      projectId: project.id,
      status: finalStatus,
      tasksCompleted,
      tasksFailed,
      artifactsProduced,
      approvalsRequested,
      totalDurationMs: Date.now() - startTime,
      timeline,
    };
  }

  /**
   * Generate tasks from a registered workflow definition, preserving DAG order.
   */
  async generateTasksFromWorkflow(
    projectId: string,
    workflowId: string,
  ): Promise<ProjectTaskEntity[]> {
    const workflow = getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow "${workflowId}" not found in registry.`);
    }

    const tasks: ProjectTaskEntity[] = [];
    const taskIdMap = new Map<string, string>(); // stepName → taskId

    // Walk the DAG by following `next` pointers from initialStep
    let currentStepId: string | undefined = workflow.initialStep;
    const visited = new Set<string>();

    while (currentStepId && !visited.has(currentStepId)) {
      visited.add(currentStepId);
      const step: import('@/core/workflow-engine/workflow.types').WorkflowStep | undefined = workflow.steps[currentStepId];
      if (!step) break;

      // Determine which tasks are dependencies
      const deps: string[] = [];
      if (tasks.length > 0) {
        const prevTask = tasks[tasks.length - 1];
        if (prevTask) deps.push(prevTask.id);
      }

      // Determine if this step needs approval
      const needsApproval =
        step.agent === 'ARCHITECT' ||
        step.agent === 'DEVOPS';

      const task = await this.taskEngine.createTask({
        projectId,
        agentRole: step.agent as AgentRole,
        description: step.taskTitle,
        priority: this.getPriorityForRole(step.agent as AgentRole),
        dependencies: deps,
        maxRetries: step.retryLimit ?? 3,
        requiresApproval: needsApproval,
        approvalReason: needsApproval
          ? `${step.agent} output requires human verification before proceeding`
          : undefined,
      });

      taskIdMap.set(currentStepId, task.id);
      tasks.push(task);
      currentStepId = step.next;
    }

    return tasks;
  }

  /**
   * Execute a task with retry logic and failure memory injection.
   */
  public async executeWithRetry(
    projectId: string,
    task: ProjectTaskEntity,
    inputData: unknown,
  ): Promise<{ success: boolean; output?: unknown; error?: string; qualityScore?: number }> {
    const maxRetries = task.maxRetries;
    let lastError = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (attempt > 1) {
        await this.taskEngine.updateTaskStatus(task.id, 'RETRYING', { incrementRetry: true });

        this.visibilityService.emitEvent({
          projectId,
          type: 'RETRY',
          stepId: this.getStepIdForRole(task.agentRole),
          message: `${task.agentRole} retry attempt ${attempt}/${maxRetries}`,
        });
      }

      const attemptStart = Date.now();
      try {
        // Budget check
        const budgetCheck = await this.budgetManager.checkBudget(task.id, task.agentRole);
        if (!budgetCheck.allowed) {
          return { success: false, error: `Budget exceeded: ${budgetCheck.reason}` };
        }

        const result = await this.agentExecutor({
          projectId,
          taskId: task.id,
          role: task.agentRole,
          description: task.description,
          inputData,
        });

        // Record budget usage
        await this.budgetManager.recordUsage({
          taskId: task.id,
          agentRole: task.agentRole,
          modelUsed: 'default-model', // Can be populated dynamically
          promptTokens: 0, // Should be extracted from agent output if available
          completionTokens: 0,
          durationMs: Date.now() - attemptStart,
          success: result.success,
          errorMessage: result.error,
        });

        if (result.success) {
          return result;
        }

        lastError = result.error ?? 'Unknown agent error';
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    // All retries exhausted
    await this.taskEngine.updateTaskStatus(task.id, 'FAILED', {
      error: lastError,
    });

    return { success: false, error: lastError };
  }

  /**
   * Collect input from completed dependency artifacts.
   */
  public async collectTaskInput(
    projectId: string,
    task: ProjectTaskEntity,
  ): Promise<Record<string, unknown>> {
    const input: Record<string, unknown> = {};
    const project = await this.projectService.getProject(projectId);
    input.projectDescription = project?.description ?? '';

    // Get outputs from completed dependency tasks
    for (const depId of task.dependencies) {
      const depTask = await this.taskEngine.getTask(depId);
      if (depTask && depTask.outputArtifacts.length > 0) {
        for (const artId of depTask.outputArtifacts) {
          const art = await this.artifactSystem.getArtifact(artId);
          if (art) {
            input[`${depTask.agentRole}_output`] = art.content;
          }
        }
      }
    }

    // Inject procedural lessons
    const lessons = await this.memoryManager.getRelevantLessons(
      projectId,
      task.description,
    );
    if (lessons.length > 0) {
      input._proceduralLessons = lessons;
    }

    return input;
  }

  /**
   * Default agent executor: delegates to the real AgentExecutionEngine.
   */
  private async defaultAgentExecutor(params: {
    projectId: string;
    taskId: string;
    role: AgentRole;
    description: string;
    inputData: unknown;
  }): Promise<{ success: boolean; output?: unknown; error?: string; qualityScore?: number }> {
    const engine = getExecutionEngine();
    
    // We infer taskType from the role, e.g., 'FRONTEND' -> 'frontend_implementation'
    const taskType = this.getStepIdForRole(params.role);

    const res = await engine.executeTask({
      projectId: params.projectId,
      role: params.role,
      taskTitle: params.description,
      taskType,
      inputData: params.inputData,
    });

    if (res.success && res.data) {
      return {
        success: true,
        output: res.data.output,
        qualityScore: res.data.qualityScore.overall,
      };
    } else {
      return {
        success: false,
        error: res.success ? 'Execution failed' : (typeof res.error === 'object' && res.error !== null && 'message' in res.error ? String((res.error as any).message) : String(res.error)),
      };
    }
  }

  private async syncArtifactToWorkspace(projectId: string, output: unknown, agentRole: AgentRole): Promise<void> {
    try {
      if (typeof output !== 'object' || output === null) return;
      const data = output as Record<string, unknown>;

      let repo = await prisma.repository.findUnique({ where: { projectId } });
      if (!repo) {
        repo = await prisma.repository.create({
          data: { projectId, path: `/projects/${projectId}` },
        });
      }

      // Handle multi-file output (Phase 7 support)
      let filesUpdated = false;
      if (Array.isArray(data['files'])) {
        for (const file of data['files']) {
          if (typeof file !== 'object' || file === null) continue;
          const { path, content, language } = file as any;
          if (typeof path === 'string' && typeof content === 'string') {
            await this.upsertFile(repo.id, path, content, language || 'typescript');
            filesUpdated = true;
          }
        }
      } else {
        // Legacy single file extraction
        const code = data['Frontend component code'] ?? data['code'] ?? data['content'];
        if (typeof code === 'string') {
          const filePath = agentRole === 'FRONTEND' ? 'src/app/page.tsx' : 'src/index.ts';
          await this.upsertFile(repo.id, filePath, code, 'typescript');
          filesUpdated = true;
        }
      }

      if (filesUpdated) {
        // Phase 18 Gap 2: Git-like versioning
        const currentFiles = await prisma.file.findMany({
          where: { repositoryId: repo.id },
          select: { path: true, content: true }
        });
        
        const fileMap: Record<string, string> = {};
        currentFiles.forEach(f => fileMap[f.path] = f.content);

        const lastSnapshot = await prisma.projectSnapshot.findFirst({
          where: { projectId },
          orderBy: { versionNumber: 'desc' }
        });
        const nextVersion = lastSnapshot ? lastSnapshot.versionNumber + 1 : 1;

        await prisma.projectSnapshot.create({
          data: {
            projectId,
            commitMessage: `Agent ${agentRole} updated codebase.`,
            versionNumber: nextVersion,
            fileMap
          }
        });
      }
    } catch (err) {
      console.error('[PipelineOrchestrator] Error syncing artifact to DB:', err);
    }
  }

  private async upsertFile(repositoryId: string, path: string, content: string, language: string) {
    const existingFile = await prisma.file.findFirst({
      where: { repositoryId, path },
    });

    if (existingFile) {
      await prisma.file.update({
        where: { id: existingFile.id },
        data: { content, language, updatedAt: new Date() },
      });
    } else {
      await prisma.file.create({
        data: { repositoryId, path, content, language },
      });
    }
  }

  private getPhaseStatusForRole(role: AgentRole): ProjectExecutionStatus {
    const map: Partial<Record<AgentRole, ProjectExecutionStatus>> = {
      CEO: 'PLANNING',
      PRODUCT_MANAGER: 'PLANNING',
      ARCHITECT: 'ARCHITECTURE',
      DATABASE: 'ARCHITECTURE',
      BACKEND: 'DEVELOPMENT',
      FRONTEND: 'DEVELOPMENT',
      DEVELOPER: 'DEVELOPMENT',
      SECURITY: 'TESTING',
      QA: 'TESTING',
      DEVOPS: 'DEPLOYMENT',
    };
    return map[role] ?? 'IN_PROGRESS';
  }

  private getStepIdForRole(role: AgentRole): string {
    const map: Partial<Record<AgentRole, string>> = {
      CEO: 'ceo_vision',
      PRODUCT_MANAGER: 'pm_requirements',
      ARCHITECT: 'architecture_design',
      DATABASE: 'database_design',
      BACKEND: 'backend_implementation',
      FRONTEND: 'frontend_implementation',
      SECURITY: 'security_audit',
      QA: 'qa_review',
      DEVOPS: 'devops_deploy',
    };
    return map[role] ?? 'agent_task';
  }

  private getPriorityForRole(role: AgentRole): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
    const map: Partial<Record<AgentRole, 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>> = {
      CEO: 'HIGH',
      PRODUCT_MANAGER: 'HIGH',
      ARCHITECT: 'HIGH',
      DATABASE: 'MEDIUM',
      BACKEND: 'MEDIUM',
      FRONTEND: 'MEDIUM',
      SECURITY: 'HIGH',
      QA: 'HIGH',
      DEVOPS: 'MEDIUM',
    };
    return map[role] ?? 'MEDIUM';
  }
}

let instance: PipelineOrchestrator | null = null;
export function getPipelineOrchestrator(executor?: AgentExecutor): PipelineOrchestrator {
  if (!instance) {
    instance = new PipelineOrchestrator(executor);
  }
  return instance;
}

export function createPipelineOrchestrator(executor?: AgentExecutor): PipelineOrchestrator {
  return new PipelineOrchestrator(executor);
}
