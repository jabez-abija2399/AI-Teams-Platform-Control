import type { ApiResult } from '@/types/common.types';
import type { PipelineConfig, ProjectLifecycleState } from './integration.types';
import { CompanyOrchestrator } from './company-orchestrator';
import { LifecycleManager } from './lifecycle-manager';
import { ExecutionStateService } from './execution-state.service';
import { CompanyEventBus } from './event-bus';

export class PipelineManager {
  public static async startProject(
    projectId: string,
    userIdea: string,
    config: PipelineConfig = { autoAdvance: true, maxRetries: 1, recoverOnFailure: true },
  ): Promise<ApiResult<any>> {
    ExecutionStateService.initState(projectId, 'CREATED');
    return CompanyOrchestrator.runFullPipeline(projectId, userIdea, config);
  }

  public static async pauseProject(projectId: string, reason: string = 'User requested pause'): Promise<ApiResult<ProjectLifecycleState>> {
    try {
      const state = ExecutionStateService.getState(projectId);
      if (state.currentPhase === 'COMPLETED' || state.currentPhase === 'PAUSED') {
        return { success: true, data: state.currentPhase };
      }
      const newPhase = await LifecycleManager.transition(projectId, state.currentPhase, 'PAUSED', reason);
      ExecutionStateService.updatePhase(projectId, 'PAUSED');
      ExecutionStateService.updateHealth(projectId, 'PAUSED', {
        message: reason,
        code: 'EXECUTION_PAUSED',
        timestamp: Date.now(),
        recoverable: true,
      });
      return { success: true, data: newPhase };
    } catch (err: any) {
      return { success: false, error: { message: err?.message || 'Failed to pause project', code: 'PAUSE_FAILED' } };
    }
  }

  public static async resumeProject(
    projectId: string,
    resumeData: any = {},
  ): Promise<ApiResult<any>> {
    try {
      const state = ExecutionStateService.getState(projectId);
      if (state.executionHealth !== 'PAUSED' && state.currentPhase !== 'PAUSED') {
        return { success: false, error: { message: 'Project is not currently paused.', code: 'NOT_PAUSED' } };
      }

      const previousPhase = state.previousPhase || (state.lastEvent?.payload?.from as ProjectLifecycleState) || 'DISCOVERY';
      await LifecycleManager.transition(projectId, 'PAUSED', previousPhase, 'Resuming execution');
      ExecutionStateService.updatePhase(projectId, previousPhase);
      ExecutionStateService.updateHealth(projectId, 'HEALTHY');

      // Continue execution based on restored phase
      if (previousPhase === 'DISCOVERY') {
        return CompanyOrchestrator.executeDiscovery(projectId, resumeData.userIdea || 'Resume idea');
      } else if (previousPhase === 'PLANNING') {
        return CompanyOrchestrator.executePlanning(projectId, resumeData.ceoData || {});
      } else if (previousPhase === 'ARCHITECTURE') {
        return CompanyOrchestrator.executeArchitecture(projectId, resumeData.pmData || {});
      } else if (previousPhase === 'EXECUTION') {
        return CompanyOrchestrator.executeExecution(projectId, resumeData.archData || {}, resumeData.requirements || []);
      } else if (previousPhase === 'REVIEW') {
        return CompanyOrchestrator.executeReview(projectId, resumeData.devData || {});
      }

      return { success: true, data: { status: 'resumed', phase: previousPhase } };
    } catch (err: any) {
      return { success: false, error: { message: err?.message || 'Failed to resume project', code: 'RESUME_FAILED' } };
    }
  }

  public static async retryProject(projectId: string, retryData: any = {}): Promise<ApiResult<any>> {
    try {
      const state = ExecutionStateService.getState(projectId);
      if (state.executionHealth !== 'FAILED' && state.currentPhase !== 'FAILED') {
        return { success: false, error: { message: 'Project is not in a failed state.', code: 'NOT_FAILED' } };
      }

      const targetPhase = state.error?.stage || state.previousPhase || (state.lastEvent?.payload?.from as ProjectLifecycleState) || 'DISCOVERY';
      await LifecycleManager.transition(projectId, 'FAILED', targetPhase, 'Retrying execution after failure');
      ExecutionStateService.updatePhase(projectId, targetPhase);
      ExecutionStateService.updateHealth(projectId, 'HEALTHY');

      if (targetPhase === 'DISCOVERY') {
        return CompanyOrchestrator.executeDiscovery(projectId, retryData.userIdea || 'Retried idea');
      } else if (targetPhase === 'PLANNING') {
        return CompanyOrchestrator.executePlanning(projectId, retryData.ceoData || {});
      } else if (targetPhase === 'ARCHITECTURE') {
        return CompanyOrchestrator.executeArchitecture(projectId, retryData.pmData || {});
      } else if (targetPhase === 'EXECUTION') {
        return CompanyOrchestrator.executeExecution(projectId, retryData.archData || {}, retryData.requirements || []);
      } else if (targetPhase === 'REVIEW') {
        return CompanyOrchestrator.executeReview(projectId, retryData.devData || {});
      }

      return { success: true, data: { status: 'retried', phase: targetPhase } };
    } catch (err: any) {
      return { success: false, error: { message: err?.message || 'Failed to retry project', code: 'RETRY_FAILED' } };
    }
  }

  public static async cancelProject(projectId: string, reason: string = 'Execution cancelled by user'): Promise<ApiResult<ProjectLifecycleState>> {
    try {
      const state = ExecutionStateService.getState(projectId);
      const newPhase = await LifecycleManager.transition(projectId, state.currentPhase, 'FAILED', reason);
      ExecutionStateService.updateHealth(projectId, 'FAILED', {
        message: reason,
        code: 'EXECUTION_CANCELLED',
        timestamp: Date.now(),
        recoverable: false,
      });
      return { success: true, data: newPhase };
    } catch (err: any) {
      return { success: false, error: { message: err?.message || 'Failed to cancel project', code: 'CANCEL_FAILED' } };
    }
  }

  public static async skipStage(projectId: string, targetStage: ProjectLifecycleState): Promise<ApiResult<ProjectLifecycleState>> {
    try {
      const state = ExecutionStateService.getState(projectId);
      ExecutionStateService.updatePhase(projectId, targetStage);
      await CompanyEventBus.publish('TASK_COMPLETED', projectId, { skippedFrom: state.currentPhase, targetStage }, 'PipelineManager');
      return { success: true, data: targetStage };
    } catch (err: any) {
      return { success: false, error: { message: err?.message || 'Failed to skip stage', code: 'SKIP_FAILED' } };
    }
  }

  public static getCurrentStage(projectId: string): ProjectLifecycleState {
    const state = ExecutionStateService.getState(projectId);
    return state.currentPhase;
  }

  public static getStatus(projectId: string) {
    return ExecutionStateService.getMissionControlData(projectId);
  }
}
