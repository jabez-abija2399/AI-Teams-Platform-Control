import { ProjectLifecycleService } from '@/core/company-orchestration/project-lifecycle.service';
import { CompanyPipelineEngine } from '@/core/company-orchestration/company-pipeline.engine';
import { WorkflowManager } from '@/core/company-orchestration/workflow-manager';
import { ArtifactManager } from '@/core/company-orchestration/artifact-manager';
import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import type {
  MissionControlStatus,
  ApprovalGateType,
  ProjectLifecycleState,
} from '@/core/company-orchestration/types';

export interface ICoreOrchestrator {
  startMission(projectId: string, input?: { userIdea?: string; missionTitle?: string }): Promise<ApiResult<MissionControlStatus>>;
  resumeMission(projectId: string, approvalType?: ApprovalGateType, comments?: string): Promise<ApiResult<MissionControlStatus>>;
  pauseMission(projectId: string, reason?: string): Promise<ApiResult<MissionControlStatus>>;
  retryPhase(projectId: string, phase?: ProjectLifecycleState): Promise<ApiResult<MissionControlStatus>>;
  cancelMission(projectId: string): Promise<ApiResult<boolean>>;
  getMissionState(projectId: string): Promise<ApiResult<MissionControlStatus>>;
}

/**
 * Canonical Core Orchestrator
 *
 * Single canonical execution authority for all AI Software Engineering missions.
 * Unifies project lifecycle, durable execution states, artifact generation,
 * approval gates, and multi-agent coordination.
 */
export class CanonicalCoreOrchestrator implements ICoreOrchestrator {
  private static instance: CanonicalCoreOrchestrator | null = null;

  public static getInstance(): CanonicalCoreOrchestrator {
    if (!this.instance) {
      this.instance = new CanonicalCoreOrchestrator();
    }
    return this.instance;
  }

  /**
   * Starts a new project mission or delivery pipeline run.
   */
  public async startMission(
    projectId: string,
    input?: { userIdea?: string; missionTitle?: string },
  ): Promise<ApiResult<MissionControlStatus>> {
    const idea = input?.userIdea?.trim();

    // 1. Ensure durable Mission record in DB
    try {
      const existingMission = await prisma.mission.findFirst({
        where: { projectId, status: { in: ['PLANNING', 'IN_PROGRESS', 'PAUSED'] } },
        orderBy: { createdAt: 'desc' },
      });

      if (!existingMission) {
        await prisma.mission.create({
          data: {
            projectId,
            title: input?.missionTitle || 'Primary Software Delivery Mission',
            description: idea || 'Autonomous software engineering delivery',
            status: 'IN_PROGRESS',
            currentPhase: 'DISCOVERY_RUNNING',
            attempt: 1,
          },
        });
      } else {
        await prisma.mission.update({
          where: { id: existingMission.id },
          data: {
            status: 'IN_PROGRESS',
            currentPhase: 'DISCOVERY_RUNNING',
            updatedAt: new Date(),
          },
        });
      }
    } catch (dbErr) {
      console.warn('[CanonicalCoreOrchestrator] Mission record sync notice:', dbErr);
    }

    // 2. Execute via canonical lifecycle engine
    return ProjectLifecycleService.startLifecycle(projectId, idea);
  }

  /**
   * Resumes a paused mission after approval or changes.
   */
  public async resumeMission(
    projectId: string,
    approvalType?: ApprovalGateType,
    comments?: string,
  ): Promise<ApiResult<MissionControlStatus>> {
    return ProjectLifecycleService.resumeLifecycle(
      projectId,
      approvalType,
      'APPROVED',
      'Executive Reviewer',
      comments,
    );
  }

  /**
   * Pauses an active mission safely at the current phase checkpoint.
   */
  public async pauseMission(
    projectId: string,
    reason?: string,
  ): Promise<ApiResult<MissionControlStatus>> {
    return ProjectLifecycleService.pauseLifecycle(projectId, reason);
  }

  /**
   * Retries a failed or stalled phase.
   */
  public async retryPhase(
    projectId: string,
    phase?: ProjectLifecycleState,
  ): Promise<ApiResult<MissionControlStatus>> {
    CompanyPipelineEngine.forceReleaseLock(projectId);
    return ProjectLifecycleService.retryFromPhase(projectId, phase);
  }

  /**
   * Cancels active execution and marks the mission failed/idle.
   */
  public async cancelMission(projectId: string): Promise<ApiResult<boolean>> {
    CompanyPipelineEngine.forceReleaseLock(projectId);
    await WorkflowManager.transitionState(projectId, 'PAUSED', 'Mission cancelled by user');
    return { success: true, data: true };
  }

  /**
   * Gets the durable mission control status for a project.
   */
  public async getMissionState(projectId: string): Promise<ApiResult<MissionControlStatus>> {
    return ProjectLifecycleService.getStatus(projectId);
  }
}

export const canonicalOrchestrator = CanonicalCoreOrchestrator.getInstance();
