import { prisma } from '@/lib/prisma';
import { companyEventBus } from '@/core/integration/event-bus';
import { recordTimelineEvent } from '@/features/ai-workspace/services/timeline.service';
import type { ApiResult } from '@/types/common.types';
import type { ApprovalGateType, ProjectLifecycleState } from './types';
import { findWorkflowScalars, setWorkflowTextArray, updateWorkflowScalars, parseStringList } from './workflow-state-access';

export class ApprovalManager {
  /**
   * Requests a centralized approval gate.
   * Pauses the pipeline and records a pending approval in ApprovalHistory.
   */
  public static async requestApproval(
    projectId: string,
    approvalType: ApprovalGateType,
    phase: ProjectLifecycleState,
    artifactType?: string,
    artifactId?: string,
    requestedBy: string = 'SYSTEM',
  ): Promise<ApiResult<{ approvalId: string }>> {
    try {
      // Check if there is already a pending approval of this type
      const existing = await prisma.approvalHistory.findFirst({
        where: { projectId, approvalType, status: 'PENDING' },
      });

      // Always ensure workflow is PAUSED while a gate is pending.
      // (Previously, an existing PENDING row returned early and left
      // currentPhase as TESTING_RUNNING — UI showed approve, API rejected.)
      await this.ensurePausedForApproval(projectId, approvalType, phase);

      if (existing) {
        return { success: true, data: { approvalId: existing.id } };
      }

      const approval = await prisma.approvalHistory.create({
        data: {
          projectId,
          approvalType,
          phase,
          artifactType,
          artifactId,
          status: 'PENDING',
          requestedBy,
        },
      });

      await companyEventBus.publish(
        'APPROVAL_REQUESTED',
        projectId,
        { approvalId: approval.id, approvalType, phase, artifactType },
        'ApprovalManager',
      );

      await recordTimelineEvent({
        type: 'workflow.approval_requested',
        message: `⏸️ Pipeline paused: Awaiting ${approvalType}`,
        metadata: { projectId, approvalId: approval.id, approvalType, phase },
      });

      return { success: true, data: { approvalId: approval.id } };
    } catch (err: any) {
      console.error('[ApprovalManager] requestApproval error:', err);
      return {
        success: false,
        error: { message: err?.message || 'Failed to request approval', code: 'APPROVAL_REQUEST_FAILED' },
      };
    }
  }

  /** Force PAUSED + waitingApprovals for a gate (idempotent heal). */
  public static async ensurePausedForApproval(
    projectId: string,
    approvalType: ApprovalGateType,
    phase?: ProjectLifecycleState | string | null,
  ): Promise<void> {
    let state: {
      currentPhase: string;
      waitingApprovals: unknown;
      metadata: unknown;
    } | null = null;
    try {
      const scalar = await prisma.projectWorkflowState.findUnique({
        where: { projectId },
        select: { currentPhase: true, metadata: true },
      });
      if (!scalar) return;
      let waitingApprovals: unknown = [];
      try {
        const arrays = await prisma.$queryRaw<{ waitingApprovals: unknown }[]>`
          SELECT "waitingApprovals" FROM project_workflow_states
          WHERE "projectId" = ${projectId} LIMIT 1
        `;
        waitingApprovals = arrays[0]?.waitingApprovals ?? [];
      } catch {
        waitingApprovals = [];
      }
      state = { ...scalar, waitingApprovals };
    } catch (err: any) {
      console.warn('[ApprovalManager] findUnique failed:', err?.message);
      return;
    }
    if (!state) return;

    const waiting = parseStringList(state.waitingApprovals);
    if (!waiting.includes(approvalType)) {
      waiting.push(approvalType);
    }

    const meta = { ...((state.metadata as Record<string, unknown>) || {}) };
    const pausePhase =
      (phase && String(phase).endsWith('_RUNNING') ? phase : null) ||
      (typeof meta.pausedAtPhase === 'string' ? meta.pausedAtPhase : null) ||
      (state.currentPhase.endsWith('_RUNNING') ? state.currentPhase : null);
    if (pausePhase) {
      meta.pausedAtPhase = pausePhase;
    }

    // Scalars via Prisma; text[] via SQL — adapter-pg String[] writes can throw e.map.
    await updateWorkflowScalars(projectId, {
      currentPhase: 'PAUSED',
      nextAction: `Awaiting human executive decision for: ${approvalType}`,
      metadata: meta,
    });

    await setWorkflowTextArray(projectId, 'waitingApprovals', waiting);
  }

  /**
   * Resolves a pending approval (APPROVED, REJECTED, or CHANGES_REQUESTED).
   */
  public static async resolveApproval(
    projectId: string,
    approvalType: ApprovalGateType,
    status: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED',
    reviewedBy: string = 'Human Executive',
    comments?: string,
  ): Promise<ApiResult<{ approvalId: string; status: string }>> {
    try {
      const pending = await prisma.approvalHistory.findFirst({
        where: { projectId, approvalType, status: 'PENDING' },
      });

      if (!pending) {
        return {
          success: false,
          error: { message: `No pending approval found for ${approvalType}`, code: 'APPROVAL_NOT_FOUND' },
        };
      }

      const updated = await prisma.approvalHistory.update({
        where: { id: pending.id },
        data: {
          status,
          reviewedBy,
          comments,
        },
      });

      const state = await findWorkflowScalars(projectId).catch(() => null);
      if (state) {
        // Load current waiting list via raw SQL (avoid String[] mapper)
        let waiting: string[] = [];
        try {
          const rows = await prisma.$queryRaw<{ waitingApprovals: unknown }[]>`
            SELECT "waitingApprovals" FROM project_workflow_states
            WHERE "projectId" = ${projectId} LIMIT 1
          `;
          const raw = rows[0]?.waitingApprovals;
          waiting = parseStringList(raw);
        } catch {
          waiting = [];
        }
        waiting = waiting.filter((a) => a !== approvalType);
        await setWorkflowTextArray(projectId, 'waitingApprovals', waiting);
      }

      const eventName =
        status === 'APPROVED'
          ? 'APPROVAL_GRANTED'
          : status === 'CHANGES_REQUESTED'
            ? 'APPROVAL_REJECTED'
            : 'APPROVAL_REJECTED';

      await companyEventBus.publish(
        eventName,
        projectId,
        { approvalId: updated.id, approvalType, status, reviewedBy, comments },
        'ApprovalManager',
      );

      const message =
        status === 'APPROVED'
          ? `✅ ${approvalType} granted by ${reviewedBy}`
          : status === 'CHANGES_REQUESTED'
            ? `🔄 ${approvalType}: changes requested — regenerating`
            : `❌ ${approvalType} rejected by ${reviewedBy}`;

      await recordTimelineEvent({
        type: status === 'APPROVED' ? 'workflow.approved' : 'workflow.rejected',
        message,
        metadata: { projectId, approvalId: updated.id, approvalType, status, comments },
      });

      return { success: true, data: { approvalId: updated.id, status } };
    } catch (err: any) {
      console.error('[ApprovalManager] resolveApproval error:', err);
      return {
        success: false,
        error: { message: err?.message || 'Failed to resolve approval', code: 'APPROVAL_RESOLVE_FAILED' },
      };
    }
  }

  /**
   * Retrieves all approval histories for a project.
   */
  public static async getApprovalHistory(projectId: string): Promise<ApiResult<any[]>> {
    try {
      const records = await prisma.approvalHistory.findMany({
        where: { projectId },
        orderBy: { createdAt: 'asc' },
      });
      return { success: true, data: records };
    } catch (err: any) {
      return { success: false, error: { message: err?.message || 'Failed to get approval history', code: 'APPROVAL_GET_FAILED' } };
    }
  }
}
