import { prisma } from '@/lib/prisma';
import { PIPELINE_PHASE_DEFINITIONS, VALID_STATE_TRANSITIONS, type ProjectLifecycleState, type PhaseDefinition, type MissionControlStatus } from './types';
import { ArtifactManager } from './artifact-manager';
import { ApprovalManager } from './approval-manager';
import type { ApiResult } from '@/types/common.types';

export class WorkflowManager {
  /**
   * Initializes or retrieves the ProjectWorkflowState for a given project.
   */
  public static async getOrInitState(projectId: string): Promise<ApiResult<MissionControlStatus>> {
    try {
      let state = await prisma.projectWorkflowState.findUnique({ where: { projectId } });
      if (!state) {
        state = await prisma.projectWorkflowState.create({
          data: {
            projectId,
            currentPhase: 'CREATED',
            completedPhases: [] as any,
            activeAgent: 'SYSTEM',
            currentArtifact: null,
            progress: 0,
            nextAction: 'Ready to start Product Discovery',
            waitingApprovals: [] as any,
            risks: [] as any,
          },
        });
      }

      return {
        success: true,
        data: {
          projectId: state.projectId,
          currentDepartment: PIPELINE_PHASE_DEFINITIONS[state.currentPhase as ProjectLifecycleState]?.department ?? 'Unknown',
          activeAgent: state.activeAgent ?? 'SYSTEM',
          currentPhase: state.currentPhase as ProjectLifecycleState,
          currentArtifact: state.currentArtifact,
          progress: state.progress,
          nextAction: state.nextAction,
          waitingApprovals: (state.waitingApprovals as any) ?? [],
          completedPhases: (state.completedPhases as any) ?? [],
          risks: (state.risks as any) ?? [],
          pausedAtPhase: (state.metadata as any)?.pausedAtPhase as ProjectLifecycleState | undefined,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: { message: err?.message || 'Failed to initialize workflow state', code: 'WORKFLOW_INIT_FAILED' },
      };
    }
  }

  /**
   * Evaluates if a given phase transition is allowed according to the strict state machine rules.
   */
  public static canTransition(from: ProjectLifecycleState, to: ProjectLifecycleState): boolean {
    if (from === to) return true;
    const allowed = VALID_STATE_TRANSITIONS[from];
    return Array.isArray(allowed) && allowed.includes(to);
  }

  /**
   * Evaluates whether the next phase can begin by checking if required input artifacts exist.
   */
  public static async evaluatePrerequisites(
    projectId: string,
    targetPhase: ProjectLifecycleState,
  ): Promise<ApiResult<boolean>> {
    const def = PIPELINE_PHASE_DEFINITIONS[targetPhase];
    if (!def) {
      return { success: false, error: { message: `Unknown phase definition: ${targetPhase}`, code: 'UNKNOWN_PHASE' } };
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

  /**
   * Records which phase triggered a pause-for-approval so that resume
   * can advance to that phase's nextState instead of re-entering it.
   * Pass null/undefined to clear (e.g. after resume).
   */
  public static async setPausedAtPhase(
    projectId: string,
    pausedAtPhase: ProjectLifecycleState | null | undefined,
  ): Promise<void> {
    try {
      const current = await prisma.projectWorkflowState.findUnique({ where: { projectId } });
      const meta = (current?.metadata as Record<string, any>) ?? {};
      if (pausedAtPhase) {
        meta.pausedAtPhase = pausedAtPhase;
      } else {
        delete meta.pausedAtPhase;
      }
      await prisma.projectWorkflowState.update({
        where: { projectId },
        data: {
          metadata: meta as any,
        },
      });
    } catch (err: any) {
      console.error('[WorkflowManager] setPausedAtPhase error:', err);
    }
  }

  /**
   * Transitions the project to a new state if valid and prerequisites are satisfied.
   */
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

      // If transitioning to a running phase, verify prerequisites
      if (toPhase !== 'PAUSED' && toPhase !== 'FAILED' && toPhase !== 'COMPLETED') {
        const prereq = await this.evaluatePrerequisites(projectId, toPhase);
        if (!prereq.success) return { success: false, error: prereq.error };
      }

      const def = PIPELINE_PHASE_DEFINITIONS[toPhase];
      const newCompleted = [...current.completedPhases];
      if (current.currentPhase !== 'PAUSED' && current.currentPhase !== 'CREATED' && !newCompleted.includes(current.currentPhase)) {
        newCompleted.push(current.currentPhase);
      }

      const updated = await prisma.projectWorkflowState.update({
        where: { projectId },
        data: {
          currentPhase: toPhase,
          completedPhases: newCompleted as any,
          activeAgent: def?.agentRole ?? current.activeAgent,
          progress: def?.progressPercentage ?? current.progress,
          nextAction: reason ?? `Executing ${def?.department ?? toPhase}`,
        },
      });

      return {
        success: true,
        data: {
          projectId: updated.projectId,
          currentDepartment: def?.department ?? 'Unknown',
          activeAgent: updated.activeAgent ?? 'SYSTEM',
          currentPhase: updated.currentPhase as ProjectLifecycleState,
          currentArtifact: updated.currentArtifact,
          progress: updated.progress,
          nextAction: updated.nextAction,
          waitingApprovals: (updated.waitingApprovals as any) ?? [],
          completedPhases: (updated.completedPhases as any) ?? [],
          risks: (updated.risks as any) ?? [],
        },
      };
    } catch (err: any) {
      console.error('[WorkflowManager] transitionState error:', err);
      return {
        success: false,
        error: { message: err?.message || 'State transition failed', code: 'TRANSITION_FAILED' },
      };
    }
  }

  /**
   * Called when an agent finishes its work in the current phase.
   * Checks if an approval gate is required after this phase.
   * If yes, pauses pipeline and requests approval.
   * If no, returns next phase definition ready for automatic execution.
   */
  public static async onPhaseCompleted(
    projectId: string,
    completedPhase: ProjectLifecycleState,
    outputArtifactType: string,
    outputArtifactId?: string,
  ): Promise<ApiResult<{ action: 'PAUSE_FOR_APPROVAL' | 'PROCEED'; nextPhase?: ProjectLifecycleState; approvalType?: string }>> {
    try {
      const def = PIPELINE_PHASE_DEFINITIONS[completedPhase];
      if (!def) {
        return { success: false, error: { message: `Unknown phase definition: ${completedPhase}`, code: 'UNKNOWN_PHASE' } };
      }

      // Update currentArtifact in workflow state
      await prisma.projectWorkflowState.update({
        where: { projectId },
        data: { currentArtifact: outputArtifactType },
      }).catch(() => {});

      if (def.approvalRequiredAfter) {
        // Request approval and pause
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
        error: { message: err?.message || 'Phase completion processing failed', code: 'PHASE_COMPLETE_FAILED' },
      };
    }
  }
}
