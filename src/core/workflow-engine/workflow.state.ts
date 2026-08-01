import type { WorkflowExecutionState } from './workflow.types';

const stateStore = new Map<string, WorkflowExecutionState>();

export function createWorkflowState(workflowId: string, projectId: string, initialStep: string): WorkflowExecutionState {
  const state: WorkflowExecutionState = {
    workflowId,
    projectId,
    currentStep: initialStep,
    status: 'RUNNING',
    stepResults: {},
    history: [],
  };
  stateStore.set(projectId, state);
  return state;
}

export function getWorkflowState(projectId: string): WorkflowExecutionState | undefined {
  return stateStore.get(projectId);
}

export function updateWorkflowState(projectId: string, update: Partial<WorkflowExecutionState>): WorkflowExecutionState | undefined {
  const existing = stateStore.get(projectId);
  if (!existing) return undefined;
  const updated = { ...existing, ...update };
  stateStore.set(projectId, updated);
  return updated;
}

export function clearWorkflowState(projectId: string): void {
  stateStore.delete(projectId);
}
