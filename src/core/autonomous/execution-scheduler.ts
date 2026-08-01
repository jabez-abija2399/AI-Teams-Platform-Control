import { ExecutivePlanner } from '@/core/executive/executive-planner';
import { DependencyEngine } from '@/core/executive/dependency-engine';
import { ParallelExecutionEngine } from './parallel-execution.engine';
import { ConflictDetector } from './conflict-detector';
import { ExecutionTimelineService } from './execution-timeline.service';
import type { AutonomousStatus } from './types';

export class ExecutionScheduler {
  /**
   * Continuous scheduler loop tick for a project
   */
  public static async tick(projectId: string): Promise<AutonomousStatus> {
    const { tasks } = await ExecutivePlanner.planProjectWork(projectId);
    const evaluatedTasks = DependencyEngine.evaluateDependencies(tasks);
    const conflicts = ConflictDetector.detectConflicts(projectId, evaluatedTasks);

    const queuedTasks = evaluatedTasks.filter((t) => t.status === 'pending');
    const runningTasks = evaluatedTasks.filter((t) => t.status === 'in_progress');
    const completedTasks = evaluatedTasks.filter((t) => t.status === 'completed');
    const failedTasks = evaluatedTasks.filter((t) => t.status === 'failed');

    // Dispatch ready unblocked tasks if worker slots are open
    for (const task of queuedTasks) {
      if (task.blockers.length === 0) {
        await ParallelExecutionEngine.executeTaskConcurrently(projectId, task);
      }
    }

    const activeWorkers = ParallelExecutionEngine.getActiveWorkers();
    const limit = ParallelExecutionEngine.getConcurrencyLimit();
    const utilization = Math.round((activeWorkers.length / limit) * 100);

    return {
      projectId,
      concurrencyLimit: limit,
      activeWorkersCount: activeWorkers.length,
      queuedTasksCount: queuedTasks.length,
      runningTasksCount: runningTasks.length,
      reviewingTasksCount: 0,
      completedTasksCount: completedTasks.length,
      failedTasksCount: failedTasks.length,
      retriesCount: 0,
      conflictsCount: conflicts.length,
      workerUtilizationPercentage: utilization,
    };
  }
}
