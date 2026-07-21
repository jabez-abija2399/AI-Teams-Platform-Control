import type { WorkflowInstance, WorkflowProgress } from './workflow.types';

export interface IWorkflowEngine {
  createWorkflow(
    definitionId: string,
    projectId: string,
    name: string,
    input?: string,
  ): WorkflowInstance;
  startWorkflow(workflowId: string): Promise<void>;
  pauseWorkflow(workflowId: string): void;
  resumeWorkflow(workflowId: string): void;
  cancelWorkflow(workflowId: string): void;
  getWorkflow(workflowId: string): WorkflowInstance | undefined;
  getWorkflowProgress(workflowId: string): WorkflowProgress | undefined;
  getProjectWorkflows(projectId: string): WorkflowInstance[];
}
