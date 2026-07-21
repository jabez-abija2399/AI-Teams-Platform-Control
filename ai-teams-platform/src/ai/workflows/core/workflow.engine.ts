import type { WorkflowInstance, WorkflowProgress, WorkflowStep } from '../core/workflow.types';
import type { WorkflowDefinition } from '../core/workflow.types';
import { executeWorkflowStep } from '../execution/workflow.executor';

const workflows = new Map<string, WorkflowInstance>();
const runningWorkflows = new Set<string>();

export function createWorkflow(
  definition: WorkflowDefinition,
  projectId: string,
  name: string,
  input?: string,
): WorkflowInstance {
  const steps: WorkflowStep[] = definition.steps.map((step, index) => ({
    id: crypto.randomUUID(),
    name: step.name,
    description: step.description,
    agentRole: step.agentRole,
    status: 'PENDING',
    order: index,
  }));

  const workflow: WorkflowInstance = {
    id: crypto.randomUUID(),
    definitionId: definition.id,
    name,
    projectId,
    status: 'PENDING',
    steps,
    currentStepIndex: 0,
    input,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  workflows.set(workflow.id, workflow);
  return workflow;
}

export async function startWorkflow(workflowId: string): Promise<void> {
  const workflow = workflows.get(workflowId);
  if (!workflow) throw new Error(`Workflow ${workflowId} not found`);
  if (workflow.status === 'RUNNING') return;

  workflow.status = 'RUNNING';
  workflow.startedAt = new Date();
  workflow.updatedAt = new Date();
  runningWorkflows.add(workflowId);

  try {
    let context: string | undefined = workflow.input;

    for (let i = workflow.currentStepIndex; i < workflow.steps.length; i++) {
      if (!runningWorkflows.has(workflowId)) break;

      const step = workflow.steps[i];
      if (!step) continue;

      workflow.currentStepIndex = i;
      step.status = 'RUNNING';
      step.startedAt = new Date();

      const result = await executeWorkflowStep(step, context);

      if (result.success) {
        step.status = 'COMPLETED';
        step.output = result.output;
        step.completedAt = new Date();
        context = result.output;
      } else {
        step.status = 'FAILED';
        step.error = result.output;
        step.completedAt = new Date();
        workflow.status = 'FAILED';
        workflow.error = result.output;
        workflow.updatedAt = new Date();
        runningWorkflows.delete(workflowId);
        return;
      }
    }

    workflow.status = 'COMPLETED';
    workflow.output = context;
    workflow.completedAt = new Date();
    workflow.updatedAt = new Date();
    runningWorkflows.delete(workflowId);
  } catch (error) {
    workflow.status = 'FAILED';
    workflow.error = error instanceof Error ? error.message : String(error);
    workflow.updatedAt = new Date();
    runningWorkflows.delete(workflowId);
  }
}

export function pauseWorkflow(workflowId: string): void {
  const workflow = workflows.get(workflowId);
  if (!workflow || workflow.status !== 'RUNNING') return;
  runningWorkflows.delete(workflowId);
  workflow.status = 'PAUSED';
  workflow.updatedAt = new Date();
}

export function resumeWorkflow(workflowId: string): void {
  const workflow = workflows.get(workflowId);
  if (!workflow || workflow.status !== 'PAUSED') return;
  void startWorkflow(workflowId);
}

export function cancelWorkflow(workflowId: string): void {
  const workflow = workflows.get(workflowId);
  if (!workflow) return;
  runningWorkflows.delete(workflowId);
  workflow.status = 'CANCELLED';
  workflow.updatedAt = new Date();
}

export function getWorkflow(workflowId: string): WorkflowInstance | undefined {
  return workflows.get(workflowId);
}

export function getWorkflowProgress(workflowId: string): WorkflowProgress | undefined {
  const workflow = workflows.get(workflowId);
  if (!workflow) return undefined;

  const completedSteps = workflow.steps.filter((s) => s.status === 'COMPLETED').length;
  const failedSteps = workflow.steps.filter((s) => s.status === 'FAILED').length;

  return {
    workflowId: workflow.id,
    status: workflow.status,
    currentStep: workflow.currentStepIndex,
    totalSteps: workflow.steps.length,
    completedSteps,
    failedSteps,
    percentComplete: Math.round((completedSteps / workflow.steps.length) * 100),
    steps: workflow.steps.map((s) => ({
      name: s.name,
      status: s.status,
      agentRole: s.agentRole,
      output: s.output,
      error: s.error,
    })),
  };
}

export function getProjectWorkflows(projectId: string): WorkflowInstance[] {
  return Array.from(workflows.values()).filter((w) => w.projectId === projectId);
}
