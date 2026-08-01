import { getWorkflow } from './workflow.registry';
import { createWorkflowState, updateWorkflowState } from './workflow.state';
import type { WorkflowExecutionState, WorkflowStep } from './workflow.types';
import { getExecutionEngine } from '@/ai/agents/core/execution.engine';
import { logAIEvent } from '../../ai/monitoring/ai.logger';

export class WorkflowExecutor {
  async executeWorkflow(
    workflowId: string,
    projectId: string,
    initialInput: unknown,
  ): Promise<WorkflowExecutionState> {
    const workflow = getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow definition "${workflowId}" not found in registry.`);
    }

    const state = createWorkflowState(workflowId, projectId, workflow.initialStep);
    await logAIEvent('WORKFLOW_STARTED', { workflowId, projectId, initialStep: workflow.initialStep });

    let currentStepId: string | undefined = workflow.initialStep;

    while (currentStepId) {
      const step: WorkflowStep | undefined = workflow.steps[currentStepId];
      if (!step) {
        updateWorkflowState(projectId, { status: 'FAILED' });
        throw new Error(`Step "${currentStepId}" not found in workflow "${workflowId}".`);
      }

      updateWorkflowState(projectId, { currentStep: currentStepId });
      await logAIEvent('WORKFLOW_STEP_STARTED', { workflowId, projectId, step: currentStepId, agent: step.agent });

      const inputData = step.inputTransformer
        ? step.inputTransformer(state.stepResults, initialInput)
        : initialInput;

      const engine = getExecutionEngine();
      const res = await engine.executeTask({
        projectId,
        role: step.agent,
        taskTitle: step.taskTitle,
        taskType: step.taskType,
        inputData,
      });

      if (res.success) {
        state.stepResults[currentStepId] = res.data.output;
        state.history.push({
          step: currentStepId,
          agent: step.agent,
          status: 'SUCCESS',
          timestamp: new Date(),
        });
        updateWorkflowState(projectId, {
          stepResults: state.stepResults,
          history: state.history,
        });
        await logAIEvent('WORKFLOW_STEP_COMPLETED', { workflowId, projectId, step: currentStepId, agent: step.agent });
        currentStepId = step.next;
      } else {
        const errorMsg = res.error.message ?? 'Step execution failed';
        state.history.push({
          step: currentStepId,
          agent: step.agent,
          status: 'FAILURE',
          error: errorMsg,
          timestamp: new Date(),
        });
        await logAIEvent('WORKFLOW_STEP_FAILED', { workflowId, projectId, step: currentStepId, agent: step.agent, error: errorMsg });

        if (step.onFailure && workflow.steps[step.onFailure]) {
          currentStepId = step.onFailure;
        } else {
          updateWorkflowState(projectId, { status: 'FAILED', history: state.history });
          throw new Error(`Workflow "${workflowId}" failed at step "${currentStepId}": ${errorMsg}`);
        }
      }
    }

    updateWorkflowState(projectId, { status: 'COMPLETED', currentStep: 'DONE' });
    await logAIEvent('WORKFLOW_COMPLETED', { workflowId, projectId });
    return state;
  }
}

let workflowExecutorInstance: WorkflowExecutor | null = null;

export function getWorkflowExecutor(): WorkflowExecutor {
  if (!workflowExecutorInstance) {
    workflowExecutorInstance = new WorkflowExecutor();
  }
  return workflowExecutorInstance;
}

