import type {
  CompanySupervisorRecommendation,
  CompanyWorker,
  CompanyTask,
  CompanyStopwatchMetrics,
} from './types';
import { CompanyHealthService } from './company-health.service';
import { CompanyEventBus } from './company-event-bus';
import { CompanyStateMachine } from './company-state-machine';

export class CompanySupervisor {
  private static recommendations: Map<string, CompanySupervisorRecommendation[]> = new Map();

  public static async monitor(
    projectId: string,
    activeWorkers: CompanyWorker[],
    queue: CompanyTask[],
    stopwatch: CompanyStopwatchMetrics
  ): Promise<CompanySupervisorRecommendation[]> {
    const recs: CompanySupervisorRecommendation[] = [];
    const health = CompanyHealthService.getReport(projectId);
    const state = CompanyStateMachine.getState(projectId);

    // 1. Check worker utilization & queue backlog
    const idleWorkers = activeWorkers.filter((w) => w.status === 'IDLE');
    const queuedTasks = queue.filter((t) => t.status === 'QUEUED');
    if (queuedTasks.length > 0 && idleWorkers.length > 0) {
      recs.push({
        id: `rec_${Date.now()}_1`,
        projectId,
        type: 'REBALANCE_WORKERS',
        priority: queuedTasks.length > 3 ? 'HIGH' : 'MEDIUM',
        message: `${queuedTasks.length} tasks queued while ${idleWorkers.length} workers are idle.`,
        suggestedAction: 'Automatically assign queued tasks to available IDLE workers.',
        timestamp: Date.now(),
      });
    }

    // 2. Check failed or blocked tasks
    const failedTasks = queue.filter((t) => t.status === 'FAILED' || t.status === 'BLOCKED');
    if (failedTasks.length > 0) {
      recs.push({
        id: `rec_${Date.now()}_2`,
        projectId,
        type: 'RETRY_TASK',
        priority: 'CRITICAL',
        message: `${failedTasks.length} task(s) encountered failure or blockage.`,
        suggestedAction: 'Trigger exponential backoff retry or reassign to Senior AI Agent.',
        timestamp: Date.now(),
      });
    }

    // 3. Check review duration and status
    if (state === 'REVIEW' || stopwatch.reviewDurationMs > 60000) {
      recs.push({
        id: `rec_${Date.now()}_3`,
        projectId,
        type: 'ESCALATE_REVIEW',
        priority: 'HIGH',
        message: `Review phase active for ${Math.round(stopwatch.reviewDurationMs / 1000)}s.`,
        suggestedAction: 'Escalate pending code checks to Review Committee / Architecture Review Board.',
        timestamp: Date.now(),
      });
    }

    // 4. Check overall execution speed
    if (stopwatch.totalProjectDurationMs > 300000 && state !== 'COMPLETED' && state !== 'PAUSED') {
      recs.push({
        id: `rec_${Date.now()}_4`,
        projectId,
        type: 'OPTIMIZE_SPEED',
        priority: 'MEDIUM',
        message: 'Project execution duration exceeding standard velocity thresholds.',
        suggestedAction: 'Enable context compression and parallelize non-dependent task execution.',
        timestamp: Date.now(),
      });
    }

    // 5. Check system health degradation
    if (health.status === 'DEGRADED' || health.status === 'STALLED') {
      recs.push({
        id: `rec_${Date.now()}_5`,
        projectId,
        type: 'HEALTH_WARNING',
        priority: 'CRITICAL',
        message: `Company health is ${health.status}: ${health.issues.join('; ')}`,
        suggestedAction: 'Restart stalled workers and clear deadlock conditions immediately.',
        timestamp: Date.now(),
      });
    }

    this.recommendations.set(projectId, recs);

    // Emit event if critical recommendations generated
    const critical = recs.filter((r) => r.priority === 'CRITICAL' || r.priority === 'HIGH');
    if (critical.length > 0) {
      await CompanyEventBus.publish(
        'SUPERVISOR_RECOMMENDATION',
        projectId,
        { recommendations: critical },
        'CompanySupervisor'
      );
    }

    return recs;
  }

  public static getRecommendations(projectId: string): CompanySupervisorRecommendation[] {
    return this.recommendations.get(projectId) || [];
  }

  public static clearProject(projectId: string): void {
    this.recommendations.delete(projectId);
  }

  public static resetAll(): void {
    this.recommendations.clear();
  }
}
