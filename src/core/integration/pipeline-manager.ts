import type { ApiResult } from '@/types/common.types';
import type { PipelineConfig, ProjectLifecycleState } from './integration.types';
import { LifecycleManager } from './lifecycle-manager';
import { ExecutionStateService } from './execution-state.service';
import { companyEventBus } from '../company/company-event-bus';
import { PipelineEngine } from '../workflow-engine/pipeline-engine';
import { PlanningNode } from '../workflow-engine/nodes/planning-node';
import { ArchitectureNode } from '../workflow-engine/nodes/architecture-node';
import { DesignNode } from '../workflow-engine/nodes/design-node';
import { ExecutionNode } from '../workflow-engine/nodes/execution-node';
import { DebateNode } from '../workflow-engine/nodes/debate-node';
import type { ExecutionContext } from '../workflow-engine/execution-context';

export class PipelineManager {
  private static getNodesFromPhase(phase: ProjectLifecycleState) {
    const allNodes = [
      new PlanningNode(),
      new ArchitectureNode(),
      new DesignNode(),
      new ExecutionNode(),
      new DebateNode()
    ];

    switch (phase) {
      case 'PLANNING': return allNodes;
      case 'ARCHITECTURE': return allNodes.slice(1);
      case 'DESIGN': return allNodes.slice(2);
      case 'EXECUTION': return allNodes.slice(3);
      case 'DEBATE': return allNodes.slice(4);
      default: return allNodes;
    }
  }

  public static async startProject(
    projectId: string,
    userIdea: string,
    config: PipelineConfig = { autoAdvance: true, maxRetries: 1, recoverOnFailure: true },
  ): Promise<ApiResult<any>> {
    try {
      await companyEventBus.publish('PROJECT_CREATED', projectId, { userIdea }, 'PipelineManager');
      const engine = new PipelineEngine(this.getNodesFromPhase('PLANNING'));
      const initialContext: ExecutionContext = {
        projectId,
        userIdea,
        metadata: { startTime: Date.now(), errors: [], attempts: {} }
      };

      const result = await engine.run(initialContext);
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: { message: err.message, code: 'PIPELINE_FAILED' } };
    }
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

      const previousPhase = state.previousPhase || (state.lastEvent?.payload?.from as ProjectLifecycleState) || 'PLANNING';
      await LifecycleManager.transition(projectId, 'PAUSED', previousPhase, 'Resuming execution');
      ExecutionStateService.updatePhase(projectId, previousPhase);
      ExecutionStateService.updateHealth(projectId, 'HEALTHY');

      const engine = new PipelineEngine(this.getNodesFromPhase(previousPhase));
      const context: ExecutionContext = {
        projectId,
        userIdea: resumeData.userIdea || 'Resume idea',
        prd: resumeData.prd || (resumeData.pmData ? { requirements: resumeData.pmData } : { requirements: resumeData.requirements || [] }),
        architecture: resumeData.architecture || resumeData.archData || { systemDesign: 'System Architecture' },
        design: resumeData.design,
        execution: resumeData.execution,
        metadata: { startTime: Date.now(), errors: [], attempts: {} }
      };

      const result = await engine.run(context);
      return { success: true, data: result };
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

      const targetPhase = state.error?.stage || state.previousPhase || (state.lastEvent?.payload?.from as ProjectLifecycleState) || 'PLANNING';
      await LifecycleManager.transition(projectId, 'FAILED', targetPhase, 'Retrying execution after failure');
      ExecutionStateService.updatePhase(projectId, targetPhase);
      ExecutionStateService.updateHealth(projectId, 'HEALTHY');

      const engine = new PipelineEngine(this.getNodesFromPhase(targetPhase));
      const context: ExecutionContext = {
        projectId,
        userIdea: retryData.userIdea || 'Retry idea',
        prd: retryData.prd || (retryData.pmData ? { requirements: retryData.pmData } : { requirements: retryData.requirements || [] }),
        architecture: retryData.architecture || retryData.archData || { systemDesign: 'System Architecture' },
        design: retryData.design,
        execution: retryData.execution,
        metadata: { startTime: Date.now(), errors: [], attempts: {} }
      };

      const result = await engine.run(context);
      return { success: true, data: result };
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
      await companyEventBus.publish('TASK_COMPLETED', projectId, { skippedFrom: state.currentPhase, targetStage }, 'PipelineManager');
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
