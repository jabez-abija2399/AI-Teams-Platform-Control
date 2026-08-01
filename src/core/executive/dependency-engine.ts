import type { ExecutiveTask, Milestone } from './types';

export class DependencyEngine {
  /**
   * Evaluates task status based on dependency chain and marks blocked tasks
   */
  public static evaluateDependencies(tasks: ExecutiveTask[]): ExecutiveTask[] {
    const taskMap = new Map(tasks.map((t) => [t.id, t]));

    return tasks.map((task) => {
      const blockers: string[] = [];

      for (const depId of task.dependencyChain) {
        const depTask = taskMap.get(depId);
        if (depTask && depTask.status !== 'completed') {
          blockers.push(`Waiting for task "${depTask.title}" (${depTask.status})`);
        }
      }

      const isBlocked = blockers.length > 0;
      return {
        ...task,
        blockers,
        status: isBlocked ? 'blocked' : task.status === 'blocked' ? 'pending' : task.status,
      };
    });
  }

  /**
   * Detects if a milestone is ready to begin based on parent milestone dependencies
   */
  public static checkMilestoneStatus(milestone: Milestone, allMilestones: Milestone[]): Milestone['status'] {
    if (milestone.completionPercentage >= 100) return 'completed';

    const milestoneMap = new Map(allMilestones.map((m) => [m.id, m]));
    for (const depId of milestone.dependencies) {
      const dep = milestoneMap.get(depId);
      if (dep && dep.completionPercentage < 100) {
        return 'blocked';
      }
    }

    return milestone.completionPercentage > 0 ? 'in_progress' : 'pending';
  }
}
