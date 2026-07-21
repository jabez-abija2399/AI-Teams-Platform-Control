import type { AITask, TaskPriorityType } from './task.types';

const taskStore = new Map<string, AITask>();

export function createTask(
  workflowId: string,
  title: string,
  description: string,
  assignedRole: string,
  priority: TaskPriorityType = 'MEDIUM',
  dependencies: string[] = [],
): AITask {
  const task: AITask = {
    id: crypto.randomUUID(),
    workflowId,
    title,
    description,
    assignedRole,
    status: 'pending',
    priority,
    dependencies,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  taskStore.set(task.id, task);
  return task;
}

export function getTask(id: string): AITask | undefined {
  return taskStore.get(id);
}

export function getWorkflowTasks(workflowId: string): AITask[] {
  return Array.from(taskStore.values())
    .filter((t) => t.workflowId === workflowId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function updateTaskStatus(
  id: string,
  status: AITask['status'],
  output?: string,
  error?: string,
): AITask | undefined {
  const task = taskStore.get(id);
  if (!task) return undefined;
  task.status = status;
  task.updatedAt = new Date();
  if (output) task.output = output;
  if (error) task.error = error;
  return task;
}

export function getTaskStats(workflowId?: string): {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  failed: number;
  blocked: number;
} {
  const tasks = workflowId ? getWorkflowTasks(workflowId) : Array.from(taskStore.values());
  return {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    failed: tasks.filter((t) => t.status === 'failed').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
  };
}
