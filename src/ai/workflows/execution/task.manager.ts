import type { AITask, TaskPriorityType } from './task.types';
import {
  createTask as createTaskRecord,
  getTask,
  getWorkflowTasks,
  updateTaskStatus,
  getTaskStats,
} from './task.engine';

export class TaskManager {
  createTask(
    workflowId: string,
    title: string,
    description: string,
    assignedRole: string,
    priority: TaskPriorityType = 'MEDIUM',
    dependencies: string[] = [],
  ): AITask {
    return createTaskRecord(workflowId, title, description, assignedRole, priority, dependencies);
  }

  getTask(id: string): AITask | undefined {
    return getTask(id);
  }

  getWorkflowTasks(workflowId: string): AITask[] {
    return getWorkflowTasks(workflowId);
  }

  completeTask(id: string, output: string): AITask | undefined {
    return updateTaskStatus(id, 'completed', output);
  }

  failTask(id: string, error: string): AITask | undefined {
    return updateTaskStatus(id, 'failed', undefined, error);
  }

  startTask(id: string): AITask | undefined {
    return updateTaskStatus(id, 'in_progress');
  }

  blockTask(id: string, reason: string): AITask | undefined {
    return updateTaskStatus(id, 'blocked', undefined, reason);
  }

  getStats(workflowId?: string) {
    return getTaskStats(workflowId);
  }
}

let taskManagerInstance: TaskManager | null = null;

export function getTaskManager(): TaskManager {
  if (!taskManagerInstance) {
    taskManagerInstance = new TaskManager();
  }
  return taskManagerInstance;
}
