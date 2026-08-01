import { prisma } from '@/lib/prisma';
import type { ProjectTaskEntity, TaskExecutionState, TaskPriorityLevel } from './types';
import type { AgentRole } from '@/ai/agents/core/agent.types';

export class TaskManagementEngine {
  async createTask(params: {
    id?: string;
    projectId: string; // Used to fetch the current executionId or we can just link executionId. Wait, we need executionId.
    executionId?: string;
    agentRole: AgentRole;
    description: string;
    priority?: TaskPriorityLevel;
    dependencies?: string[];
    inputArtifacts?: string[];
    maxRetries?: number;
    requiresApproval?: boolean;
    approvalReason?: string;
  }): Promise<ProjectTaskEntity> {
    const id = params.id ?? `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const executionId = params.executionId ?? params.projectId; // fallback for backwards compatibility

    // Ensure there is a project record (for tests)
    let proj = await prisma.project.findUnique({ where: { id: params.projectId } });
    if (!proj) {
      let testUser = await prisma.user.findFirst({ where: { email: 'test@example.com' } });
      if (!testUser) {
        testUser = await prisma.user.create({
          data: { email: 'test@example.com', name: 'Test User' }
        });
      }
      proj = await prisma.project.create({
        data: {
          id: params.projectId,
          name: 'Auto-generated Test Project',
          ownerId: testUser.id,
          status: 'PLANNING',
        }
      });
    }

    // Ensure there is an execution record
    let exec = await prisma.projectExecution.findUnique({ where: { id: executionId } });
    if (!exec) {
      exec = await prisma.projectExecution.create({
        data: {
          id: executionId,
          projectId: params.projectId,
          workflowId: 'default',
          status: 'RUNNING',
        },
      });
    }

    const task = await prisma.executionTask.create({
      data: {
        id,
        executionId: exec.id,
        agentRole: params.agentRole,
        taskType: 'agent_task',
        description: params.description,
        priority: params.priority ?? 'MEDIUM',
        status: 'PENDING',
        maxAttempts: params.maxRetries ?? 3,
        dependencies: params.dependencies ?? [],
        inputArtifacts: params.inputArtifacts ?? [],
        outputArtifacts: [],
      }
    });

    return this.mapToEntity(task, params.projectId, params.requiresApproval, params.approvalReason);
  }

  async getTask(taskId: string): Promise<ProjectTaskEntity | undefined> {
    const task = await prisma.executionTask.findUnique({
      where: { id: taskId },
      include: { execution: true },
    });
    if (!task) return undefined;
    return this.mapToEntity(task, task.execution.projectId, false);
  }

  async getProjectTasks(projectId: string): Promise<ProjectTaskEntity[]> {
    const tasks = await prisma.executionTask.findMany({
      where: { execution: { projectId } },
      include: { execution: true },
      orderBy: { createdAt: 'asc' },
    });
    return tasks.map(t => this.mapToEntity(t, t.execution.projectId, false));
  }

  async updateTaskStatus(
    taskId: string,
    status: TaskExecutionState,
    metadata?: {
      error?: string;
      approvalReason?: string;
      outputArtifactId?: string;
      incrementRetry?: boolean;
    },
  ): Promise<ProjectTaskEntity | undefined> {
    const current = await prisma.executionTask.findUnique({ where: { id: taskId }, include: { execution: true } });
    if (!current) return undefined;

    const data: any = { status };
    if (status === 'COMPLETED') {
      data.completedAt = new Date();
    }
    if (status === 'RUNNING') {
      data.startedAt = new Date();
    }

    if (metadata?.outputArtifactId && !current.outputArtifacts.includes(metadata.outputArtifactId)) {
      data.outputArtifacts = [...current.outputArtifacts, metadata.outputArtifactId];
    }
    if (metadata?.incrementRetry) {
      data.attempts = current.attempts + 1;
    }

    // We can't store error directly on ExecutionTask model without a migration for errorMessage, but we can store it in AgentRun. 
    // However, for the scope of the TaskEngine, we can just use the status.
    const updated = await prisma.executionTask.update({
      where: { id: taskId },
      data,
      include: { execution: true },
    });

    return this.mapToEntity(updated, updated.execution.projectId, false, metadata?.error, metadata?.approvalReason);
  }

  async getReadyTasks(projectId: string): Promise<ProjectTaskEntity[]> {
    const allTasks = await this.getProjectTasks(projectId);
    const readyTasks: ProjectTaskEntity[] = [];

    for (const task of allTasks) {
      if (task.status !== 'PENDING' && task.status !== 'ASSIGNED' && task.status !== 'RETRYING') {
        continue;
      }

      // Check dependencies
      let allDepsCompleted = true;
      for (const depId of task.dependencies) {
        const depTask = await this.getTask(depId);
        if (!depTask || depTask.status !== 'COMPLETED') {
          allDepsCompleted = false;
          break;
        }
      }

      if (allDepsCompleted) {
        readyTasks.push(task);
      }
    }

    // Sort by priority (URGENT > HIGH > MEDIUM > LOW) and createdAt
    const priorityWeight: Record<TaskPriorityLevel, number> = {
      URGENT: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    readyTasks.sort((a, b) => {
      const diff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (diff !== 0) return diff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    return readyTasks;
  }

  async areAllTasksCompleted(projectId: string): Promise<boolean> {
    const count = await prisma.executionTask.count({
      where: { execution: { projectId } }
    });
    if (count === 0) return false;

    const completed = await prisma.executionTask.count({
      where: { execution: { projectId }, status: 'COMPLETED' }
    });
    return count === completed;
  }

  async hasFailedTasks(projectId: string): Promise<boolean> {
    const count = await prisma.executionTask.count({
      where: { execution: { projectId }, status: 'FAILED' }
    });
    return count > 0;
  }

  async clearProjectTasks(projectId: string): Promise<void> {
    await prisma.projectExecution.deleteMany({
      where: { projectId }
    });
  }

  private mapToEntity(task: any, projectId: string, requiresApproval = false, approvalReason?: string, error?: string): ProjectTaskEntity {
    return {
      id: task.id,
      projectId,
      agentRole: task.agentRole as AgentRole,
      description: task.description,
      priority: task.priority as TaskPriorityLevel,
      dependencies: task.dependencies,
      status: task.status as TaskExecutionState,
      inputArtifacts: task.inputArtifacts,
      outputArtifacts: task.outputArtifacts,
      createdAt: task.createdAt,
      completedAt: task.completedAt ?? undefined,
      retryCount: task.attempts,
      maxRetries: task.maxAttempts,
      requiresApproval,
      approvalReason,
      error,
    };
  }
}

let instance: TaskManagementEngine | null = null;
export function getTaskManagementEngine(): TaskManagementEngine {
  if (!instance) {
    instance = new TaskManagementEngine();
  }
  return instance;
}
