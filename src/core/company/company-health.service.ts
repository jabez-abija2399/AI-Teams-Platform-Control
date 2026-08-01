import type { CompanyHealthReport, CompanyHealthStatus, CompanyWorker, CompanyTask } from './types';

export class CompanyHealthService {
  private static reports: Map<string, CompanyHealthReport> = new Map();

  public static initReport(projectId: string): CompanyHealthReport {
    const report: CompanyHealthReport = {
      projectId,
      status: 'HEALTHY',
      runningWorkersCount: 0,
      stalledWorkersCount: 0,
      blockedTasksCount: 0,
      deadlocksDetected: false,
      failedRetriesCount: 0,
      resourceUtilization: 25, // default baseline
      issues: [],
      timestamp: Date.now(),
    };
    this.reports.set(projectId, report);
    return report;
  }

  public static getReport(projectId: string): CompanyHealthReport {
    let r = this.reports.get(projectId);
    if (!r) {
      r = this.initReport(projectId);
    }
    return r;
  }

  public static updateReport(projectId: string, updates: Partial<CompanyHealthReport>): CompanyHealthReport {
    const r = this.getReport(projectId);
    const updated: CompanyHealthReport = {
      ...r,
      ...updates,
      timestamp: Date.now(),
    };
    this.reports.set(projectId, updated);
    return updated;
  }

  public static evaluateHealth(
    projectId: string,
    activeWorkers: CompanyWorker[],
    queue: CompanyTask[],
    isPaused: boolean = false
  ): CompanyHealthReport {
    const now = Date.now();
    const issues: string[] = [];
    let status: CompanyHealthStatus = isPaused ? 'PAUSED' : 'HEALTHY';

    const runningWorkersCount = activeWorkers.filter((w) => w.status === 'WORKING').length;
    
    // Check stalled workers (e.g., no heartbeat for over 30 seconds while WORKING)
    const stalledWorkers = activeWorkers.filter(
      (w) => w.status === 'WORKING' && now - w.lastHeartbeat > 30000
    );
    const stalledWorkersCount = stalledWorkers.length;
    if (stalledWorkersCount > 0) {
      status = 'STALLED';
      stalledWorkers.forEach((w) => issues.push(`Worker ${w.role} (${w.id}) stalled without heartbeat`));
    }

    // Check blocked tasks
    const blockedTasksCount = queue.filter((t) => t.status === 'BLOCKED').length;
    if (blockedTasksCount > 0) {
      if (status === 'HEALTHY') status = 'DEGRADED';
      issues.push(`${blockedTasksCount} task(s) blocked in execution queue`);
    }

    // Check failed retries
    const failedTasks = queue.filter((t) => t.status === 'FAILED' || t.retries >= t.maxRetries);
    const failedRetriesCount = failedTasks.length;
    if (failedRetriesCount > 0) {
      status = 'FAILED';
      failedTasks.forEach((t) => issues.push(`Task "${t.title}" failed after max retries (${t.error || 'unknown error'})`));
    }

    // Detect potential deadlocks (tasks queued, workers idle, but no progress made)
    const queuedTasksCount = queue.filter((t) => t.status === 'QUEUED').length;
    const idleWorkersCount = activeWorkers.filter((w) => w.status === 'IDLE').length;
    const deadlocksDetected = queuedTasksCount > 0 && idleWorkersCount === activeWorkers.length && activeWorkers.length > 0 && runningWorkersCount === 0;
    if (deadlocksDetected) {
      status = 'STALLED';
      issues.push('Potential deadlock: queued tasks present but all active workers remain idle');
    }

    // Calculate simulated resource utilization based on running workers and task concurrency
    const maxCapacity = Math.max(activeWorkers.length, 4);
    const utilization = Math.min(Math.round((runningWorkersCount / maxCapacity) * 100), 100);

    const evaluated: CompanyHealthReport = {
      projectId,
      status,
      runningWorkersCount,
      stalledWorkersCount,
      blockedTasksCount,
      deadlocksDetected,
      failedRetriesCount,
      resourceUtilization: Math.max(utilization, 15), // keep minimum idle footprint
      issues,
      timestamp: now,
    };

    this.reports.set(projectId, evaluated);
    return evaluated;
  }

  public static setStatus(projectId: string, status: CompanyHealthStatus, reason?: string): CompanyHealthReport {
    const r = this.getReport(projectId);
    const issues = reason ? [reason, ...r.issues.filter((i) => i !== reason)] : r.issues;
    return this.updateReport(projectId, { status, issues });
  }

  public static clearProject(projectId: string): void {
    this.reports.delete(projectId);
  }

  public static resetAll(): void {
    this.reports.clear();
  }
}
