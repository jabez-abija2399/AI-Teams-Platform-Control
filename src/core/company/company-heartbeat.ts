import type { CompanyHealthReport, CompanyWorker, CompanyTask } from './types';
import { CompanyHealthService } from './company-health.service';
import { CompanyEventBus } from './company-event-bus';
import { CompanyStateMachine } from './company-state-machine';

export class CompanyHeartbeat {
  private static timers: Map<string, NodeJS.Timeout> = new Map();
  private static lastPulse: Map<string, number> = new Map();

  public static async check(
    projectId: string,
    activeWorkers: CompanyWorker[],
    queue: CompanyTask[]
  ): Promise<CompanyHealthReport> {
    const isPaused = CompanyStateMachine.getState(projectId) === 'PAUSED';
    const previousHealth = CompanyHealthService.getReport(projectId);
    const report = CompanyHealthService.evaluateHealth(projectId, activeWorkers, queue, isPaused);

    this.lastPulse.set(projectId, report.timestamp);

    // If something is wrong, emit specific health events
    if (report.stalledWorkersCount > 0 && previousHealth.stalledWorkersCount === 0) {
      const stalled = activeWorkers.filter((w) => w.status === 'WORKING' && Date.now() - w.lastHeartbeat > 30000);
      await CompanyEventBus.publish('WORKER_STALLED', projectId, { stalledWorkers: stalled, issues: report.issues }, 'CompanyHeartbeat');
    }

    if (report.deadlocksDetected && !previousHealth.deadlocksDetected) {
      await CompanyEventBus.publish('DEADLOCK_DETECTED', projectId, { queueCount: queue.length, issues: report.issues }, 'CompanyHeartbeat');
    }

    if (report.failedRetriesCount > 0 && previousHealth.failedRetriesCount === 0) {
      const failed = queue.filter((t) => t.status === 'FAILED' || t.retries >= t.maxRetries);
      await CompanyEventBus.publish('TASK_FAILED', projectId, { failedTasks: failed, issues: report.issues }, 'CompanyHeartbeat');
    }

    // Emit regular heartbeat check pulse
    await CompanyEventBus.publish('HEARTBEAT_CHECK', projectId, { report }, 'CompanyHeartbeat');

    return report;
  }

  public static startMonitor(
    projectId: string,
    getWorkersFn: () => CompanyWorker[],
    getQueueFn: () => CompanyTask[],
    intervalMs: number = 5000
  ): void {
    this.stopMonitor(projectId);
    const timer = setInterval(() => {
      const workers = getWorkersFn();
      const queue = getQueueFn();
      this.check(projectId, workers, queue).catch((err) => {
        console.error(`[CompanyHeartbeat] Error during check for project ${projectId}:`, err);
      });
    }, intervalMs);
    this.timers.set(projectId, timer);
  }

  public static stopMonitor(projectId: string): void {
    const timer = this.timers.get(projectId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(projectId);
    }
  }

  public static getPulse(projectId: string): number {
    return this.lastPulse.get(projectId) || Date.now();
  }

  public static clearProject(projectId: string): void {
    this.stopMonitor(projectId);
    this.lastPulse.delete(projectId);
  }

  public static resetAll(): void {
    for (const projectId of this.timers.keys()) {
      this.stopMonitor(projectId);
    }
    this.timers.clear();
    this.lastPulse.clear();
  }
}
