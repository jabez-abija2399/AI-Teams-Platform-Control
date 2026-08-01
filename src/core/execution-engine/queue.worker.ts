import { prisma } from '@/lib/prisma';
import { getTaskManagementEngine } from './task.engine';
import { getPipelineOrchestrator } from './pipeline.orchestrator';
import { getExecutionVisibilityService } from './visibility.service';

export class ExecutionQueueWorker {
  private taskEngine = getTaskManagementEngine();
  private orchestrator = getPipelineOrchestrator();
  private visibility = getExecutionVisibilityService();
  private isRunning = false;

  async startWorkerLoop(intervalMs = 5000): Promise<void> {
    this.isRunning = true;
    while (this.isRunning) {
      try {
        await this.processNextTask();
        await this.recoverAbandonedTasks();
      } catch (err) {
        console.error('[ExecutionWorker] Error in worker loop:', err);
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  stopWorker(): void {
    this.isRunning = false;
  }

  private async processNextTask(): Promise<boolean> {
    // Find all projects that are currently running
    const activeExecutions = await prisma.projectExecution.findMany({
      where: { status: { in: ['RUNNING', 'DEVELOPMENT'] } }
    });

    for (const exec of activeExecutions) {
      const readyTasks = await this.taskEngine.getReadyTasks(exec.projectId);
      
      for (const task of readyTasks) {
        // Attempt atomic lock
        const lockResult = await prisma.executionTask.updateMany({
          where: { id: task.id, status: 'PENDING' },
          data: { status: 'CLAIMED', startedAt: new Date() }
        });

        if (lockResult.count > 0) {
          // Lock acquired, execute
          this.visibility.emitEvent({
            projectId: task.projectId,
            type: 'INFO',
            stepId: 'worker_claim',
            message: `Worker claimed task ${task.id} (${task.agentRole})`,
          });
          
          await this.executeTask(task.id, exec.projectId);
          return true; // processed a task
        }
      }
    }
    return false; // no tasks processed
  }

  private async executeTask(taskId: string, projectId: string) {
    const task = await this.taskEngine.getTask(taskId);
    if (!task) return;

    await this.taskEngine.updateTaskStatus(taskId, 'RUNNING');
    
    // We can use pipeline orchestrator to execute the task using its existing executeWithRetry logic
    // But since pipeline orchestrator expects to control the whole loop, we just call the executor directly
    const inputData = await this.orchestrator.collectTaskInput(projectId, task);
    const result = await this.orchestrator.executeWithRetry(projectId, task, inputData);

    if (result.success) {
      await this.taskEngine.updateTaskStatus(taskId, 'COMPLETED');
    } else {
      await this.taskEngine.updateTaskStatus(taskId, 'FAILED', { error: result.error });
    }
  }

  private async recoverAbandonedTasks() {
    // Tasks stuck in CLAIMED or RUNNING for > 15 minutes
    const threshold = new Date(Date.now() - 15 * 60 * 1000);
    const abandoned = await prisma.executionTask.updateMany({
      where: {
        status: { in: ['CLAIMED', 'RUNNING'] },
        startedAt: { lt: threshold }
      },
      data: {
        status: 'PENDING',
        startedAt: null
      }
    });

    if (abandoned.count > 0) {
      console.log(`[ExecutionWorker] Recovered ${abandoned.count} abandoned tasks.`);
    }
  }
}
