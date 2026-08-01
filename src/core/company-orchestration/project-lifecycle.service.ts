import { prisma } from '@/lib/prisma';
import { WorkflowManager } from './workflow-manager';
import { ArtifactManager } from './artifact-manager';
import { ApprovalManager } from './approval-manager';
import { HandoffManager } from './handoff-manager';
import { CompanyPipelineEngine } from './company-pipeline.engine';
import { CompanyEventBus } from '@/core/integration/event-bus';
import { recordTimelineEvent } from '@/features/ai-workspace/services/timeline.service';
import type { ApiResult } from '@/types/common.types';
import { PIPELINE_PHASE_DEFINITIONS, type ApprovalGateType, type MissionControlStatus, type ProjectLifecycleState } from './types';

export class ProjectLifecycleService {
  /**
   * Retrieves the comprehensive Mission Control status for an autonomous project.
   */
  public static async getStatus(projectId: string): Promise<ApiResult<MissionControlStatus>> {
    return WorkflowManager.getOrInitState(projectId);
  }

  /**
   * Starts the autonomous software delivery pipeline from the CREATED state.
   * 1. Initializes workflow state
   * 2. Stores initial ProjectIdea artifact
   * 3. Transitions to DISCOVERY_RUNNING
   * 4. Triggers asynchronous background execution via CompanyPipelineEngine
   */
  public static async startLifecycle(
    projectId: string,
    userIdea?: string,
  ): Promise<ApiResult<MissionControlStatus>> {
    try {
      const stateRes = await WorkflowManager.getOrInitState(projectId);
      if (!stateRes.success) return stateRes;

      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) {
        return { success: false, error: { message: 'Project not found', code: 'PROJECT_NOT_FOUND' } };
      }

      const ideaContent = userIdea || project.description || project.name;

      // 1. Store initial intake artifact
      await ArtifactManager.storeArtifact(projectId, {
        type: 'ProjectIdea',
        content: { name: project.name, description: ideaContent },
        producerRole: 'USER',
        consumerRoles: ['PRODUCT_DISCOVERY'],
        summary: `Initial project intake idea for ${project.name}`,
      });

      // 2. Transition state to DISCOVERY_RUNNING
      const transitionRes = await WorkflowManager.transitionState(
        projectId,
        'DISCOVERY_RUNNING',
        'Starting Product Discovery phase',
      );
      if (!transitionRes.success) return transitionRes;

      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'IN_PROGRESS' },
      }).catch(() => {});

      await CompanyEventBus.publish('LIFECYCLE_STARTED', projectId, { userIdea: ideaContent }, 'ProjectLifecycleService');
      await recordTimelineEvent({
        type: 'workflow.started',
        message: `🚀 Autonomous Software Company pipeline started for project "${project.name}"`,
        metadata: { projectId, phase: 'DISCOVERY_RUNNING' },
      });

      // 3. Trigger automatic pipeline execution asynchronously (or synchronously if awaited)
      setTimeout(() => {
        CompanyPipelineEngine.runPipeline(projectId).catch((err) => {
          console.error('[ProjectLifecycleService] Background runPipeline error:', err);
        });
      }, 50);

      return transitionRes;
    } catch (err: any) {
      console.error('[ProjectLifecycleService] startLifecycle error:', err);
      return { success: false, error: { message: err?.message || 'Failed to start lifecycle', code: 'LIFECYCLE_START_FAILED' } };
    }
  }

  /**
   * Resumes a paused project after an executive human approval or intervention.
   */
  public static async resumeLifecycle(
    projectId: string,
    approvalType?: ApprovalGateType,
    status: 'APPROVED' | 'REJECTED' = 'APPROVED',
    reviewedBy: string = 'Executive Reviewer',
    comments?: string,
  ): Promise<ApiResult<MissionControlStatus>> {
    try {
      const stateRes = await WorkflowManager.getOrInitState(projectId);
      if (!stateRes.success) return stateRes;
      const state = stateRes.data;

      if (state.currentPhase !== 'PAUSED') {
        return {
          success: false,
          error: { message: `Project is not currently PAUSED (state is ${state.currentPhase})`, code: 'NOT_PAUSED' },
        };
      }

      // If resolving an approval gate
      if (approvalType) {
        const resolveRes = await ApprovalManager.resolveApproval(projectId, approvalType, status, reviewedBy, comments);
        if (!resolveRes.success) {
          return { success: false, error: resolveRes.error };
        }

        if (status === 'REJECTED') {
          const failRes = await WorkflowManager.transitionState(projectId, 'FAILED', `Approval rejected: ${comments || approvalType}`);
          await prisma.project.update({ where: { id: projectId }, data: { status: 'REVIEW' } }).catch(() => {});
          return failRes;
        }
      }

      // Determine which phase triggered the approval, then advance to its next state
      let nextPhase: ProjectLifecycleState = 'DISCOVERY_RUNNING';
      const pausedAt = state.pausedAtPhase;
      if (pausedAt) {
        const def = PIPELINE_PHASE_DEFINITIONS[pausedAt];
        if (def && def.nextState) {
          nextPhase = def.nextState;
        }
      } else {
        // Fallback: use completedPhases logic (legacy)
        const completed = state.completedPhases;
        if (completed && completed.length > 0) {
          const lastCompleted = completed[completed.length - 1] as ProjectLifecycleState;
          const def = PIPELINE_PHASE_DEFINITIONS[lastCompleted];
          if (def && def.nextState) {
            nextPhase = def.nextState;
          }
        }
      }

      const transitionRes = await WorkflowManager.transitionState(
        projectId,
        nextPhase,
        `Resumed execution after approval/pause -> entering ${nextPhase}`,
      );
      if (!transitionRes.success) return transitionRes;

      // Clear pausedAtPhase now that we've resumed
      await WorkflowManager.setPausedAtPhase(projectId, null);

      await CompanyEventBus.publish('LIFECYCLE_RESUMED', projectId, { nextPhase, reviewedBy }, 'ProjectLifecycleService');
      await recordTimelineEvent({
        type: 'workflow.resumed',
        message: `▶️ Pipeline resumed by ${reviewedBy} -> advancing to ${nextPhase}`,
        metadata: { projectId, nextPhase },
      });

      // Continue execution automatically
      setTimeout(() => {
        CompanyPipelineEngine.runPipeline(projectId).catch((err) => {
          console.error('[ProjectLifecycleService] Background runPipeline error after resume:', err);
        });
      }, 50);

      return transitionRes;
    } catch (err: any) {
      console.error('[ProjectLifecycleService] resumeLifecycle error:', err);
      return { success: false, error: { message: err?.message || 'Failed to resume lifecycle', code: 'LIFECYCLE_RESUME_FAILED' } };
    }
  }

  /**
   * Retrieves the comprehensive timeline of artifacts, handoffs, and approvals for a project.
   */
  public static async getTimeline(projectId: string): Promise<ApiResult<any>> {
    try {
      const [artifactsRes, handoffsRes, approvalsRes] = await Promise.all([
        ArtifactManager.getArtifactTimeline(projectId),
        HandoffManager.getHandoffHistory(projectId),
        ApprovalManager.getApprovalHistory(projectId),
      ]);

      const timeline = [
        ...(artifactsRes.success ? artifactsRes.data.map((a: any) => ({ ...a, eventType: 'ARTIFACT', timestamp: a.createdAt })) : []),
        ...(handoffsRes.success ? handoffsRes.data.map((h: any) => ({ ...h, eventType: 'HANDOFF', timestamp: h.createdAt })) : []),
        ...(approvalsRes.success ? approvalsRes.data.map((ap: any) => ({ ...ap, eventType: 'APPROVAL', timestamp: ap.createdAt })) : []),
      ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      return { success: true, data: { timeline, count: timeline.length } };
    } catch (err: any) {
      return { success: false, error: { message: err?.message || 'Failed to fetch timeline', code: 'TIMELINE_FAILED' } };
    }
  }
}
