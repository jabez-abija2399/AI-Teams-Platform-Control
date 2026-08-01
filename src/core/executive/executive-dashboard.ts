import type { ExecutiveDashboardData } from './types';
import { ExecutivePlanner } from './executive-planner';
import { AssignmentEngine } from './assignment-engine';
import { ProgressEngine } from './progress-engine';

export class ExecutiveDashboardService {
  /**
   * Generates comprehensive CEO executive dashboard data
   */
  public static async getDashboardData(projectId: string): Promise<ExecutiveDashboardData> {
    const { milestones, workPackages, tasks } = await ExecutivePlanner.planProjectWork(projectId);

    const completedTasks = tasks.filter((t) => t.status === 'completed');
    const blockedTasks = tasks.filter((t) => t.status === 'blocked');
    const activeMilestones = milestones.filter((m) => m.status === 'in_progress');

    const agentWorkloads = AssignmentEngine.calculateWorkloads(tasks);

    // Calculate Health Score
    let healthScore = 95;
    if (blockedTasks.length > 0) healthScore -= blockedTasks.length * 15;
    healthScore = Math.max(20, Math.min(100, healthScore));

    const healthStatus = healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'warning' : 'critical';

    const risks: string[] = [];
    const recommendations: string[] = [];

    if (blockedTasks.length > 0) {
      risks.push(`${blockedTasks.length} task(s) currently blocked by pending dependencies.`);
      recommendations.push('Authorize database schema migration task to unblock downstream developer APIs.');
    } else {
      recommendations.push('Maintain current execution velocity. All agent dependencies are green.');
    }

    return {
      projectId,
      healthScore,
      healthStatus,
      activeMilestonesCount: activeMilestones.length,
      blockedTasksCount: blockedTasks.length,
      totalTasksCount: tasks.length,
      completedTasksCount: completedTasks.length,
      estimatedCompletion: '~ 4 Hours',
      milestones,
      workPackages,
      tasks,
      agentWorkloads,
      risks,
      recommendations,
    };
  }
}
