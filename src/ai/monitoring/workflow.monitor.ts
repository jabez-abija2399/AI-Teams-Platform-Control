import type { WorkflowStatus } from '../workflows/core/workflow.types';

export interface WorkflowHealth {
  workflowId: string;
  projectId: string;
  status: WorkflowStatus;
  currentStep: number;
  totalSteps: number;
  lastUpdated: Date;
  errorCount: number;
}

const healthStore = new Map<string, WorkflowHealth>();

export function registerWorkflowHealth(
  workflowId: string,
  projectId: string,
  status: WorkflowStatus,
  totalSteps: number,
): void {
  healthStore.set(workflowId, {
    workflowId,
    projectId,
    status,
    currentStep: 0,
    totalSteps,
    lastUpdated: new Date(),
    errorCount: 0,
  });
}

export function updateWorkflowHealth(
  workflowId: string,
  updates: Partial<Pick<WorkflowHealth, 'status' | 'currentStep' | 'errorCount'>>,
): void {
  const health = healthStore.get(workflowId);
  if (!health) return;
  Object.assign(health, updates, { lastUpdated: new Date() });
}

export function getWorkflowHealth(workflowId: string): WorkflowHealth | undefined {
  return healthStore.get(workflowId);
}

export function getAllWorkflowHealth(): WorkflowHealth[] {
  return Array.from(healthStore.values());
}

export function getStalledWorkflows(thresholdMs = 300_000): WorkflowHealth[] {
  const now = Date.now();
  return Array.from(healthStore.values()).filter(
    (h) => h.status === 'RUNNING' && now - h.lastUpdated.getTime() > thresholdMs,
  );
}
