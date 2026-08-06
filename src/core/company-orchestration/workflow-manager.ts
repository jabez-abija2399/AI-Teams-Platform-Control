import { prisma } from '@/lib/prisma';
import {
  PIPELINE_PHASE_DEFINITIONS,
  VALID_STATE_TRANSITIONS,
  type ProjectLifecycleState,
  type MissionControlStatus,
} from './types';
import { ArtifactManager } from './artifact-manager';
import { ApprovalManager } from './approval-manager';
import type { ApiResult } from '@/types/common.types';
import {
  findWorkflowScalars,
  updateWorkflowScalars,
  setWorkflowTextArray,
  loadWorkflowLists,
  parseStringList,
} from './workflow-state-access';

/** All pipeline phases that count as progress toward COMPLETED. */
const PIPELINE_PROGRESS_PHASES: string[] = [
  'DISCOVERY_RUNNING',
  'CLARIFICATION_RUNNING',
  'PROPOSAL_RUNNING',
  'STRATEGY_RUNNING',
  'PRODUCT_RUNNING',
  'ANALYSIS_RUNNING',
  'PLANNING_RUNNING',
  'ARCHITECTURE_RUNNING',
  'DESIGN_RUNNING',
  'DEVELOPMENT_RUNNING',
  'TESTING_RUNNING',
  'REVIEW_RUNNING',
  'SECURITY_RUNNING',
  'DEPLOYMENT_RUNNING',
  'MONITORING',
];

/** Prisma + @prisma/adapter-pg sometimes returns lists as raw strings / jsonb. */
function asStringArray(value: unknown): string[] {
  return parseStringList(value);
}

type WorkflowRow = {
  projectId: string;
  currentPhase: string;
  activeAgent: string | null;
  currentArtifact: string | null;
  progress: number;
  nextAction: string | null;
  waitingApprovals: unknown;
  completedPhases: unknown;
  risks: unknown;
  metadata: unknown;
};

function toMissionControlStatus(state: WorkflowRow): MissionControlStatus {
  const phase = state.currentPhase as ProjectLifecycleState;
  return {
    projectId: state.projectId,
    currentDepartment: PIPELINE_PHASE_DEFINITIONS[phase]?.department ?? 'Unknown',
    activeAgent: state.activeAgent ?? 'SYSTEM',
    currentPhase: phase,
    currentArtifact: state.currentArtifact,
    progress: state.progress,
    nextAction: state.nextAction,
    waitingApprovals: asStringArray(state.waitingApprovals) as MissionControlStatus['waitingApprovals'],
    completedPhases: asStringArray(state.completedPhases),
    risks: asStringArray(state.risks),
    pausedAtPhase: (state.metadata as { pausedAtPhase?: ProjectLifecycleState } | null)?.pausedAtPhase,
  };
}

async function loadWorkflowRow(projectId: string): Promise<WorkflowRow | null> {
  const row = await findWorkflowScalars(projectId);
  if (!row) return null;
  const lists = await loadWorkflowLists(projectId);
  return {
    ...row,
    completedPhases: lists.completedPhases,
    waitingApprovals: lists.waitingApprovals,
    risks: lists.risks,
  };
}

async function setWorkflowArrays(
  projectId: string,
  fields: {
    completedPhases?: string[];
    waitingApprovals?: string[];
    risks?: string[];
  },
): Promise<void> {
  if (fields.completedPhases) {
    await setWorkflowTextArray(projectId, 'completedPhases', fields.completedPhases);
  }
  if (fields.waitingApprovals) {
    await setWorkflowTextArray(projectId, 'waitingApprovals', fields.waitingApprovals);
  }
  if (fields.risks) {
    await setWorkflowTextArray(projectId, 'risks', fields.risks);
  }
}

export class WorkflowManager {
  public static async markCompleted(
    projectId: string,
    reason = 'Project marked complete',
  ): Promise<void> {
    const existing = await loadWorkflowRow(projectId);

    if (existing) {
      await updateWorkflowScalars(projectId, {
        currentPhase: 'COMPLETED',
        progress: 100,
        nextAction: reason,
        activeAgent: 'SYSTEM',
        currentArtifact: 'FinalRelease',
      });
    } else {
      await prisma.projectWorkflowState.create({
        data: {
          projectId,
          currentPhase: 'COMPLETED',
          progress: 100,
          nextAction: reason,
          activeAgent: 'SYSTEM',
          currentArtifact: 'FinalRelease',
        },
        select: { projectId: true },
      });
    }

    await setWorkflowArrays(projectId, {
      completedPhases: PIPELINE_PROGRESS_PHASES,
      waitingApprovals: [],
      risks: [],
    });

    // Never invent Explorer files just to look complete — require real Development output.
  }

  /**
   * Force reopen a phase for regeneration (e.g. COMPLETED with empty Explorer → Development).
   * Bypasses normal transition graph; trims completedPhases past the target.
   */
  public static async forceReopenPhase(
    projectId: string,
    phase: ProjectLifecycleState,
    reason: string,
  ): Promise<ApiResult<MissionControlStatus>> {
    try {
      const def = PIPELINE_PHASE_DEFINITIONS[phase];
      if (!def) {
        return {
          success: false,
          error: { message: `Unknown phase ${phase}`, code: 'INVALID_PHASE' },
        };
      }

      // Do not call getOrInitState here — it can re-enter heal → forceReopen.
      let current = await loadWorkflowRow(projectId);
      if (!current) {
        await prisma.projectWorkflowState.create({
          data: {
            projectId,
            currentPhase: phase,
            activeAgent: def.agentRole,
            progress: def.progressPercentage,
            nextAction: reason,
          },
          select: { projectId: true },
        }).catch(() => {});
        current = await loadWorkflowRow(projectId);
      }

      const lists = current ? await loadWorkflowLists(projectId) : { completedPhases: [] as string[], waitingApprovals: [] as string[], risks: [] as string[] };
      const completedPhases = lists.completedPhases;
      const order = PIPELINE_PROGRESS_PHASES;
      const targetIdx = order.indexOf(phase);
      const trimmed =
        targetIdx >= 0
          ? completedPhases.filter((p) => {
              const i = order.indexOf(p);
              return i >= 0 && i < targetIdx;
            })
          : completedPhases.filter((p) => p !== phase);

      await updateWorkflowScalars(projectId, {
        currentPhase: phase,
        activeAgent: def.agentRole,
        progress: def.progressPercentage,
        nextAction: reason,
      });
      await setWorkflowArrays(projectId, {
        completedPhases: trimmed,
        waitingApprovals: [],
      });

      await prisma.project
        .update({
          where: { id: projectId },
          data: { status: 'IN_PROGRESS' },
        })
        .catch(() => {});

      const updated = await loadWorkflowRow(projectId);
      if (!updated) {
        return {
          success: true,
          data: {
            projectId,
            currentDepartment: def.department,
            activeAgent: def.agentRole,
            currentPhase: phase,
            currentArtifact: def.outputArtifactType,
            progress: def.progressPercentage,
            nextAction: reason,
            waitingApprovals: [],
            completedPhases: trimmed,
            risks: [],
          },
        };
      }
      return { success: true, data: toMissionControlStatus(updated) };
    } catch (err: any) {
      return {
        success: false,
        error: {
          message: err?.message || 'Failed to reopen phase',
          code: 'REOPEN_FAILED',
        },
      };
    }
  }

  public static async healIfProjectFinished(projectId: string): Promise<boolean> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { status: true },
      });
      if (!project) return false;

      const state = await loadWorkflowRow(projectId);
      if (project.status === 'COMPLETED' || project.status === 'ARCHIVED') {
        if (state?.currentPhase === 'COMPLETED') {
          if ((state.progress ?? 0) < 100) {
            await updateWorkflowScalars(projectId, {
              progress: 100,
              nextAction: 'Pipeline completed',
            });
          }
          return true;
        }
        await this.markCompleted(projectId, 'Restored completed project state');
        return true;
      }

      if (state?.currentPhase === 'CREATED' && project.status === 'IN_PROGRESS') {
        const { getProjectFileEvidence } = await import(
          '@/core/company-orchestration/implementation-file-gate'
        );
        const evidence = await getProjectFileEvidence(projectId);
        // Never complete from a Document alone — require real Explorer app files
        if (evidence.ok) {
          await this.markCompleted(projectId, 'Restored progress from existing deliverables');
          await prisma.project
            .update({ where: { id: projectId }, data: { status: 'COMPLETED' } })
            .catch(() => {});
          return true;
        }
      }

      // Hollow COMPLETED (100% but no files) → reopen Development for Resume
      if (state?.currentPhase === 'COMPLETED') {
        const { getProjectFileEvidence } = await import(
          '@/core/company-orchestration/implementation-file-gate'
        );
        const evidence = await getProjectFileEvidence(projectId);
        if (!evidence.ok) {
          await this.forceReopenPhase(
            projectId,
            'DEVELOPMENT_RUNNING',
            evidence.message || 'Reopened Development — missing real files',
          );
          return false;
        }
      }

      return false;
    } catch (err: any) {
      console.warn('[WorkflowManager] healIfProjectFinished failed:', err?.message);
      return false;
    }
  }

  public static async getOrInitState(projectId: string): Promise<ApiResult<MissionControlStatus>> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { status: true },
      });
      const projectFinished =
        project?.status === 'COMPLETED' || project?.status === 'ARCHIVED';

      let state = await loadWorkflowRow(projectId);
      if (!state) {
        if (projectFinished) {
          await this.markCompleted(projectId, 'Restored completed project state');
          state = await loadWorkflowRow(projectId);
        } else {
          try {
            await prisma.projectWorkflowState.create({
              data: {
                projectId,
                currentPhase: 'CREATED',
                activeAgent: 'SYSTEM',
                currentArtifact: null,
                progress: 0,
                nextAction: 'Ready to start Product Discovery',
              },
              select: { projectId: true },
            });
          } catch {
            /* race */
          }
          state = await loadWorkflowRow(projectId);
        }
      }

      if (state && state.currentPhase !== 'COMPLETED') {
        const healed = await this.healIfProjectFinished(projectId);
        if (healed) {
          state = await loadWorkflowRow(projectId);
        }
      } else if (state?.currentPhase === 'COMPLETED' && (state.progress ?? 0) < 100) {
        await updateWorkflowScalars(projectId, {
          progress: 100,
          nextAction: state.nextAction || 'Pipeline completed',
        }).catch(() => {});
        state = (await loadWorkflowRow(projectId)) ?? { ...state, progress: 100 };
      }

      if (!state && projectFinished) {
        return {
          success: true,
          data: {
            projectId,
            currentDepartment: 'Company Operations',
            activeAgent: 'SYSTEM',
            currentPhase: 'COMPLETED',
            currentArtifact: 'FinalRelease',
            progress: 100,
            nextAction: 'Pipeline completed',
            waitingApprovals: [],
            completedPhases: PIPELINE_PROGRESS_PHASES,
            risks: [],
          },
        };
      }

      if (!state) {
        return {
          success: false,
          error: { message: 'Failed to load workflow state', code: 'WORKFLOW_INIT_FAILED' },
        };
      }

      return {
        success: true,
        data: toMissionControlStatus(state),
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          message: err?.message || 'Failed to initialize workflow state',
          code: 'WORKFLOW_INIT_FAILED',
        },
      };
    }
  }

  public static canTransition(from: ProjectLifecycleState, to: ProjectLifecycleState): boolean {
    if (from === to) return true;
    const allowed = VALID_STATE_TRANSITIONS[from];
    return Array.isArray(allowed) && allowed.includes(to);
  }

  public static async evaluatePrerequisites(
    projectId: string,
    targetPhase: ProjectLifecycleState,
  ): Promise<ApiResult<boolean>> {
    const def = PIPELINE_PHASE_DEFINITIONS[targetPhase];
    if (!def) {
      return {
        success: false,
        error: { message: `Unknown phase definition: ${targetPhase}`, code: 'UNKNOWN_PHASE' },
      };
    }

    if (!def.inputArtifactType) {
      return { success: true, data: true };
    }

    const res = await ArtifactManager.getLatestArtifact(projectId, def.inputArtifactType);
    if (!res.success) {
      return {
        success: false,
        error: {
          message: `Cannot enter ${targetPhase}: Prerequisite artifact '${def.inputArtifactType}' is missing or unvalidated.`,
          code: 'PREREQUISITE_MISSING',
        },
      };
    }

    return { success: true, data: true };
  }

  public static async setPausedAtPhase(
    projectId: string,
    pausedAtPhase: ProjectLifecycleState | null | undefined,
  ): Promise<void> {
    try {
      const current = await findWorkflowScalars(projectId);
      const meta = { ...((current?.metadata as Record<string, any>) ?? {}) };
      if (pausedAtPhase) {
        meta.pausedAtPhase = pausedAtPhase;
      } else {
        delete meta.pausedAtPhase;
      }
      await updateWorkflowScalars(projectId, { metadata: meta });
    } catch (err: any) {
      console.error('[WorkflowManager] setPausedAtPhase error:', err);
    }
  }

  public static async transitionState(
    projectId: string,
    toPhase: ProjectLifecycleState,
    reason?: string,
  ): Promise<ApiResult<MissionControlStatus>> {
    try {
      const currentRes = await this.getOrInitState(projectId);
      if (!currentRes.success) return currentRes;

      const current = currentRes.data;
      if (!this.canTransition(current.currentPhase, toPhase)) {
        return {
          success: false,
          error: {
            message: `Invalid lifecycle transition from ${current.currentPhase} to ${toPhase}`,
            code: 'INVALID_TRANSITION',
          },
        };
      }

      if (toPhase !== 'PAUSED' && toPhase !== 'FAILED' && toPhase !== 'COMPLETED') {
        const prereq = await this.evaluatePrerequisites(projectId, toPhase);
        if (!prereq.success) return { success: false, error: prereq.error };
      }

      const def = PIPELINE_PHASE_DEFINITIONS[toPhase];
      const newCompleted = [...current.completedPhases];
      if (
        current.currentPhase !== 'PAUSED' &&
        current.currentPhase !== 'CREATED' &&
        !newCompleted.includes(current.currentPhase)
      ) {
        newCompleted.push(current.currentPhase);
      }

      let nextProgress = def?.progressPercentage ?? current.progress;
      if (toPhase === 'PAUSED' || toPhase === 'FAILED') {
        nextProgress = current.progress;
      } else if (toPhase === 'COMPLETED') {
        nextProgress = 100;
      }

      await updateWorkflowScalars(projectId, {
        currentPhase: toPhase,
        activeAgent: def?.agentRole ?? current.activeAgent,
        progress: nextProgress,
        nextAction: reason ?? `Executing ${def?.department ?? toPhase}`,
      });

      await setWorkflowArrays(projectId, {
        completedPhases: toPhase === 'COMPLETED' ? PIPELINE_PROGRESS_PHASES : newCompleted,
        ...(toPhase === 'COMPLETED' ? { waitingApprovals: [] } : {}),
      });

      const updated = await loadWorkflowRow(projectId);
      if (!updated) {
        return {
          success: true,
          data: {
            ...current,
            currentPhase: toPhase,
            progress: nextProgress,
            nextAction: reason ?? current.nextAction,
            completedPhases: toPhase === 'COMPLETED' ? PIPELINE_PROGRESS_PHASES : newCompleted,
            waitingApprovals: toPhase === 'COMPLETED' ? [] : current.waitingApprovals,
          },
        };
      }

      return {
        success: true,
        data: toMissionControlStatus(updated),
      };
    } catch (err: any) {
      console.error('[WorkflowManager] transitionState error:', err);
      return {
        success: false,
        error: { message: err?.message || 'State transition failed', code: 'TRANSITION_FAILED' },
      };
    }
  }

  public static async onPhaseCompleted(
    projectId: string,
    completedPhase: ProjectLifecycleState,
    outputArtifactType: string,
    outputArtifactId?: string,
  ): Promise<
    ApiResult<{
      action: 'PAUSE_FOR_APPROVAL' | 'PROCEED';
      nextPhase?: ProjectLifecycleState;
      approvalType?: string;
    }>
  > {
    try {
      const def = PIPELINE_PHASE_DEFINITIONS[completedPhase];
      if (!def) {
        return {
          success: false,
          error: {
            message: `Unknown phase definition: ${completedPhase}`,
            code: 'UNKNOWN_PHASE',
          },
        };
      }

      await updateWorkflowScalars(projectId, { currentArtifact: outputArtifactType }).catch(
        () => {},
      );

      if (def.approvalRequiredAfter) {
        await ApprovalManager.requestApproval(
          projectId,
          def.approvalRequiredAfter,
          completedPhase,
          outputArtifactType,
          outputArtifactId,
          def.agentRole,
        );
        return {
          success: true,
          data: { action: 'PAUSE_FOR_APPROVAL', approvalType: def.approvalRequiredAfter },
        };
      }

      if (!def.nextState) {
        return {
          success: true,
          data: { action: 'PROCEED', nextPhase: 'COMPLETED' },
        };
      }

      return {
        success: true,
        data: { action: 'PROCEED', nextPhase: def.nextState },
      };
    } catch (err: any) {
      console.error('[WorkflowManager] onPhaseCompleted error:', err);
      return {
        success: false,
        error: {
          message: err?.message || 'Phase completion processing failed',
          code: 'PHASE_COMPLETE_FAILED',
        },
      };
    }
  }
}
