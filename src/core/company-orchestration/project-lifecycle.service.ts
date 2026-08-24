import { prisma } from '@/lib/prisma';
import { WorkflowManager } from './workflow-manager';
import { ArtifactManager } from './artifact-manager';
import { ApprovalManager } from './approval-manager';
import { HandoffManager } from './handoff-manager';
import { CompanyPipelineEngine } from './company-pipeline.engine';
import { companyEventBus } from '@/core/integration/event-bus';
import { recordTimelineEvent } from '@/features/ai-workspace/services/timeline.service';
import type { ApiResult } from '@/types/common.types';
import { PIPELINE_PHASE_DEFINITIONS, type ApprovalGateType, type MissionControlStatus, type ProjectLifecycleState } from './types';
import { pulseGenerationHeartbeat } from './generation-status';

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

      const currentPhase = stateRes.data.currentPhase;

      // Never restart a finished or in-flight pipeline — restore/resume instead.
      if (currentPhase === 'COMPLETED') {
        return {
          success: true,
          data: stateRes.data,
        };
      }

      let projectRow = await prisma.project.findUnique({
        where: { id: projectId },
        select: { status: true, name: true, description: true },
      });
      if (!projectRow) {
        try {
          projectRow = await prisma.project.create({
            data: {
              id: projectId,
              name: 'AI Generated Application',
              slug: `ai-app-${projectId.slice(-6)}`,
              description: userIdea || 'Complete software application created by AI Teams.',
              ownerId: 'clx0182user',
              status: 'IN_PROGRESS',
              selectedStackId: 'nextjs-fullstack-v1',
              selectedStackVersion: '1.0.0',
              stackSource: 'PLATFORM_TEMPLATE',
            },
            select: { status: true, name: true, description: true },
          });
        } catch {
          projectRow = await prisma.project.findUnique({
            where: { id: projectId },
            select: { status: true, name: true, description: true },
          });
        }
      }
      if (!projectRow) {
        return { success: false, error: { message: 'Project not found', code: 'PROJECT_NOT_FOUND' } };
      }
      if (projectRow.status === 'COMPLETED' || projectRow.status === 'ARCHIVED') {
        await WorkflowManager.markCompleted(projectId, 'Project already completed');
        const healed = await WorkflowManager.getOrInitState(projectId);
        return healed;
      }

      if (currentPhase === 'PAUSED') {
        return {
          success: false,
          error: {
            message: 'Pipeline is waiting for approval. Approve to continue.',
            code: 'PIPELINE_PAUSED',
          },
        };
      }
      if (currentPhase !== 'CREATED' && currentPhase !== 'FAILED') {
        // Already running — kick the engine again if unlocked, but do not reset phase.
        setTimeout(() => {
          CompanyPipelineEngine.runPipeline(projectId).catch((err) => {
            console.error('[ProjectLifecycleService] re-kick runPipeline error:', err);
          });
        }, 50);
        return {
          success: true,
          data: stateRes.data,
        };
      }

      // FAILED → reset to CREATED then start fresh
      if (currentPhase === 'FAILED') {
        const { updateWorkflowScalars, setWorkflowTextArray } = await import(
          './workflow-state-access'
        );
        await updateWorkflowScalars(projectId, {
          currentPhase: 'CREATED',
          progress: 0,
          nextAction: 'Ready to restart',
        });
        await setWorkflowTextArray(projectId, 'completedPhases', []);
        await setWorkflowTextArray(projectId, 'waitingApprovals', []);
      }

      const ideaContent = userIdea || projectRow.description || projectRow.name;

      // 1. Store initial intake artifact
      await ArtifactManager.storeArtifact(projectId, {
        type: 'ProjectIdea',
        content: { name: projectRow.name, description: ideaContent },
        producerRole: 'USER',
        consumerRoles: ['PRODUCT_DISCOVERY'],
        summary: `Initial project intake idea for ${projectRow.name}`,
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

      await companyEventBus.publish('LIFECYCLE_STARTED', projectId, { userIdea: ideaContent }, 'ProjectLifecycleService');
      await recordTimelineEvent({
        type: 'workflow.started',
        message: `🚀 Autonomous Software Company pipeline started for project "${projectRow.name}"`,
        metadata: { projectId, phase: 'DISCOVERY_RUNNING' },
      });

      await pulseGenerationHeartbeat(projectId, {
        message: 'Starting your AI company…',
        phase: 'DISCOVERY_RUNNING',
        department: 'Product Discovery',
        clearError: true,
      }).catch(() => {});

      try {
        const { findWorkflowScalars, updateWorkflowScalars } = await import('./workflow-state-access');
        const wf = await findWorkflowScalars(projectId);
        const meta = { ...((wf?.metadata as Record<string, unknown>) || {}) };
        meta.sessionStartedAt = new Date().toISOString();
        await updateWorkflowScalars(projectId, { metadata: meta });
      } catch {}

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
    status: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED' = 'APPROVED',
    reviewedBy: string = 'Executive Reviewer',
    comments?: string,
  ): Promise<ApiResult<MissionControlStatus>> {
    try {
      // Resolve gate name — UI may pass artifact type; prefer any PENDING row.
      let resolvedType = approvalType;
      if (resolvedType) {
        const exact = await prisma.approvalHistory.findFirst({
          where: { projectId, approvalType: resolvedType, status: 'PENDING' },
        });
        if (!exact) {
          const anyPending = await prisma.approvalHistory.findFirst({
            where: { projectId, status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
          });
          if (anyPending?.approvalType) {
            resolvedType = anyPending.approvalType as ApprovalGateType;
          }
        }
      } else {
        const anyPending = await prisma.approvalHistory.findFirst({
          where: { projectId, status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
        });
        if (anyPending?.approvalType) {
          resolvedType = anyPending.approvalType as ApprovalGateType;
        }
      }
      approvalType = resolvedType;

      const stateRes = await WorkflowManager.getOrInitState(projectId);
      if (!stateRes.success) return stateRes;
      let state = stateRes.data;

      // Heal desynced state: UI can show approval while phase is still *_RUNNING
      // (pending ApprovalHistory / waitingApprovals without PAUSED).
      if (state.currentPhase !== 'PAUSED' && approvalType) {
        const pending = await prisma.approvalHistory.findFirst({
          where: { projectId, approvalType, status: 'PENDING' },
        });
        const waiting = Array.isArray(state.waitingApprovals) ? state.waitingApprovals : [];
        if (pending || waiting.includes(approvalType)) {
          const pausePhase =
            (pending?.phase as ProjectLifecycleState | undefined) ||
            state.pausedAtPhase ||
            (state.currentPhase.endsWith('_RUNNING')
              ? (state.currentPhase as ProjectLifecycleState)
              : undefined);
          await ApprovalManager.ensurePausedForApproval(
            projectId,
            approvalType,
            pausePhase,
          );
          const healed = await WorkflowManager.getOrInitState(projectId);
          if (healed.success) state = healed.data;
        }
      }

      if (state.currentPhase !== 'PAUSED') {
        return {
          success: false,
          error: {
            message: `Project is not currently PAUSED (state is ${state.currentPhase})`,
            code: 'NOT_PAUSED',
          },
        };
      }

      // Request changes → regenerate the paused phase with user feedback
      if (approvalType && status === 'CHANGES_REQUESTED') {
        return this.requestChangesAndRegenerate(projectId, approvalType, reviewedBy, comments);
      }

      if (approvalType) {
        const resolveRes = await ApprovalManager.resolveApproval(
          projectId,
          approvalType,
          status === 'REJECTED' ? 'REJECTED' : 'APPROVED',
          reviewedBy,
          comments,
        );
        if (!resolveRes.success) {
          return { success: false, error: resolveRes.error };
        }

        if (status === 'REJECTED') {
          const failRes = await WorkflowManager.transitionState(
            projectId,
            'FAILED',
            `Approval rejected: ${comments || approvalType}`,
          );
          await prisma.project
            .update({ where: { id: projectId }, data: { status: 'REVIEW' } })
            .catch(() => {});
          return failRes;
        }
      }

      let nextPhase: ProjectLifecycleState = 'DISCOVERY_RUNNING';
      const pausedAt = state.pausedAtPhase;
      if (pausedAt) {
        const def = PIPELINE_PHASE_DEFINITIONS[pausedAt];
        if (def && def.nextState) {
          nextPhase = def.nextState;
        }
      } else {
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

      await WorkflowManager.setPausedAtPhase(projectId, null);

      await companyEventBus.publish('LIFECYCLE_RESUMED', projectId, { nextPhase, reviewedBy }, 'ProjectLifecycleService');
      await recordTimelineEvent({
        type: 'workflow.resumed',
        message: `▶️ Pipeline resumed by ${reviewedBy} -> advancing to ${nextPhase}`,
        metadata: { projectId, nextPhase },
      });

      setTimeout(() => {
        CompanyPipelineEngine.runPipeline(projectId).catch((err) => {
          console.error('[ProjectLifecycleService] Background runPipeline error after resume:', err);
        });
      }, 50);

      return transitionRes;
    } catch (err: any) {
      console.error('[ProjectLifecycleService] resumeLifecycle error:', err);
      return {
        success: false,
        error: { message: err?.message || 'Failed to resume lifecycle', code: 'LIFECYCLE_RESUME_FAILED' },
      };
    }
  }

  /**
   * User requested edits: store feedback, re-run the paused phase, then pause again for re-approval.
   */
  public static async requestChangesAndRegenerate(
    projectId: string,
    approvalType: ApprovalGateType,
    reviewedBy: string = 'Executive Reviewer',
    comments?: string,
  ): Promise<ApiResult<MissionControlStatus>> {
    try {
      const feedback = (comments || '').trim();
      if (feedback.length < 3) {
        return {
          success: false,
          error: {
            message: 'Please add a short comment describing what to change.',
            code: 'FEEDBACK_REQUIRED',
          },
        };
      }

      const stateRes = await WorkflowManager.getOrInitState(projectId);
      if (!stateRes.success) return stateRes;
      const state = stateRes.data;

      const regeneratePhase =
        state.pausedAtPhase ||
        (state.completedPhases?.[state.completedPhases.length - 1] as ProjectLifecycleState | undefined);

      if (!regeneratePhase || !PIPELINE_PHASE_DEFINITIONS[regeneratePhase]) {
        return {
          success: false,
          error: { message: 'Could not determine which phase to regenerate.', code: 'PHASE_UNKNOWN' },
        };
      }

      const resolveRes = await ApprovalManager.resolveApproval(
        projectId,
        approvalType,
        'CHANGES_REQUESTED',
        reviewedBy,
        feedback,
      );
      if (!resolveRes.success) return { success: false, error: resolveRes.error };

      await ArtifactManager.storeArtifact(projectId, {
        type: 'UserRevisionFeedback',
        content: {
          approvalType,
          phase: regeneratePhase,
          feedback,
          requestedBy: reviewedBy,
          createdAt: new Date().toISOString(),
        },
        producerRole: 'USER',
        consumerRoles: [PIPELINE_PHASE_DEFINITIONS[regeneratePhase].agentRole],
        summary: `User feedback for ${approvalType}: ${feedback.slice(0, 120)}`,
      });

      // Persist feedback on workflow metadata for the next phase run
      const { findWorkflowScalars, updateWorkflowScalars } = await import('./workflow-state-access');
      const wf = await findWorkflowScalars(projectId);
      const meta = { ...((wf?.metadata as Record<string, unknown>) || {}) };
      meta.revisionFeedback = feedback;
      meta.revisionTargetPhase = regeneratePhase;

      // Snapshot current doc for Mission Control before → after diff
      try {
        const artType = PIPELINE_PHASE_DEFINITIONS[regeneratePhase].outputArtifactType;
        const artRes = await ArtifactManager.getLatestArtifact(projectId, artType);
        let beforeContent: unknown = artRes.success ? artRes.data : null;
        if (beforeContent == null) {
          const doc = await prisma.document.findFirst({
            where: { projectId, type: artType },
            orderBy: { createdAt: 'desc' },
          });
          if (doc?.content) {
            try {
              beforeContent = JSON.parse(doc.content);
            } catch {
              beforeContent = doc.content;
            }
          }
        }
        if (beforeContent != null) {
          meta.revisionBefore = {
            type: artType,
            title: artType.replace(/([A-Z])/g, ' $1').trim(),
            content: beforeContent,
            capturedAt: new Date().toISOString(),
            feedback,
          };
        }
      } catch (err) {
        console.warn('[ProjectLifecycleService] revisionBefore snapshot failed:', err);
      }

      await updateWorkflowScalars(projectId, {
        metadata: meta,
        nextAction: `Regenerating ${PIPELINE_PHASE_DEFINITIONS[regeneratePhase].department} with your feedback`,
      });

      await pulseGenerationHeartbeat(projectId, {
        message: `Regenerating ${PIPELINE_PHASE_DEFINITIONS[regeneratePhase].department} with your feedback…`,
        phase: regeneratePhase,
        department: PIPELINE_PHASE_DEFINITIONS[regeneratePhase].department,
        clearError: true,
      });

      await WorkflowManager.setPausedAtPhase(projectId, null);

      const transitionRes = await WorkflowManager.transitionState(
        projectId,
        regeneratePhase,
        `Regenerating ${regeneratePhase} after user feedback`,
      );
      if (!transitionRes.success) return transitionRes;

      await recordTimelineEvent({
        type: 'workflow.resumed',
        message: `🔄 Regenerating document with your comments`,
        metadata: { projectId, regeneratePhase, feedback },
      });

      setTimeout(() => {
        CompanyPipelineEngine.runPipeline(projectId).catch((err) => {
          console.error('[ProjectLifecycleService] regenerate runPipeline error:', err);
        });
      }, 50);

      return transitionRes;
    } catch (err: any) {
      console.error('[ProjectLifecycleService] requestChangesAndRegenerate error:', err);
      return {
        success: false,
        error: { message: err?.message || 'Failed to regenerate', code: 'REGENERATE_FAILED' },
      };
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
