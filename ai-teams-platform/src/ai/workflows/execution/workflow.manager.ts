import type { WorkflowInstance, WorkflowProgress } from '../core/workflow.types';
import {
  createWorkflow,
  startWorkflow,
  getWorkflow,
  getWorkflowProgress,
  getProjectWorkflows,
  pauseWorkflow,
  resumeWorkflow,
  cancelWorkflow,
} from '../core/workflow.engine';
import { SOFTWARE_PROJECT_TEMPLATE } from '../templates/software-project.template';

export function startSoftwareProjectWorkflow(
  projectId: string,
  projectName: string,
  input: string,
): WorkflowInstance {
  const workflow = createWorkflow(
    SOFTWARE_PROJECT_TEMPLATE,
    projectId,
    `${projectName} - Development Workflow`,
    input,
  );

  // Fire-and-forget — do not await
  void startWorkflow(workflow.id);

  return workflow;
}

export function getWorkflowById(id: string): WorkflowInstance | undefined {
  return getWorkflow(id);
}

export function getWorkflowProgressById(id: string): WorkflowProgress | undefined {
  return getWorkflowProgress(id);
}

export function listProjectWorkflows(projectId: string): WorkflowInstance[] {
  return getProjectWorkflows(projectId);
}

export function pauseWorkflowById(id: string): void {
  pauseWorkflow(id);
}

export function resumeWorkflowById(id: string): void {
  resumeWorkflow(id);
}

export function cancelWorkflowById(id: string): void {
  cancelWorkflow(id);
}
