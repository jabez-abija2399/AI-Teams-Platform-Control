import type { CompanyStopwatchMetrics } from './types';

export class CompanyStopwatch {
  private static metrics: Map<string, CompanyStopwatchMetrics> = new Map();
  private static startTimes: Map<string, number> = new Map();

  public static initProject(projectId: string): CompanyStopwatchMetrics {
    const initial: CompanyStopwatchMetrics = {
      totalProjectDurationMs: 0,
      taskDurationMs: 0,
      reviewDurationMs: 0,
      idleTimeMs: 0,
      approvalWaitingTimeMs: 0,
      agentUtilization: {},
      lastUpdated: Date.now(),
    };
    this.metrics.set(projectId, initial);
    this.startTimes.set(projectId, Date.now());
    return initial;
  }

  public static getMetrics(projectId: string): CompanyStopwatchMetrics {
    let m = this.metrics.get(projectId);
    if (!m) {
      m = this.initProject(projectId);
    }
    // Automatically update total duration from start time if active
    const start = this.startTimes.get(projectId);
    if (start && start > 0) {
      m.totalProjectDurationMs = Date.now() - start;
      m.lastUpdated = Date.now();
    }
    return m;
  }

  public static recordTaskDuration(projectId: string, durationMs: number, agentRole?: string): void {
    const m = this.getMetrics(projectId);
    m.taskDurationMs += durationMs;
    if (agentRole) {
      m.agentUtilization[agentRole] = (m.agentUtilization[agentRole] || 0) + durationMs;
    }
    m.lastUpdated = Date.now();
    this.metrics.set(projectId, m);
  }

  public static recordReviewDuration(projectId: string, durationMs: number): void {
    const m = this.getMetrics(projectId);
    m.reviewDurationMs += durationMs;
    m.lastUpdated = Date.now();
    this.metrics.set(projectId, m);
  }

  public static recordIdleTime(projectId: string, idleMs: number): void {
    const m = this.getMetrics(projectId);
    m.idleTimeMs += idleMs;
    m.lastUpdated = Date.now();
    this.metrics.set(projectId, m);
  }

  public static recordApprovalWaitTime(projectId: string, waitMs: number): void {
    const m = this.getMetrics(projectId);
    m.approvalWaitingTimeMs += waitMs;
    m.lastUpdated = Date.now();
    this.metrics.set(projectId, m);
  }

  public static startTimer(
    projectId: string,
    timerType: 'task' | 'review' | 'approval' | 'idle',
    agentRole?: string
  ): () => number {
    const startTime = Date.now();
    return () => {
      const durationMs = Date.now() - startTime;
      if (timerType === 'task') {
        this.recordTaskDuration(projectId, durationMs, agentRole);
      } else if (timerType === 'review') {
        this.recordReviewDuration(projectId, durationMs);
      } else if (timerType === 'approval') {
        this.recordApprovalWaitTime(projectId, durationMs);
      } else if (timerType === 'idle') {
        this.recordIdleTime(projectId, durationMs);
      }
      return durationMs;
    };
  }

  public static setProjectStartTime(projectId: string, timestamp: number): void {
    this.startTimes.set(projectId, timestamp);
  }

  public static pauseProjectTimer(projectId: string): void {
    const m = this.getMetrics(projectId);
    const start = this.startTimes.get(projectId);
    if (start && start > 0) {
      m.totalProjectDurationMs = Date.now() - start;
    }
    this.startTimes.set(projectId, 0); // 0 indicates paused timer
    this.metrics.set(projectId, m);
  }

  public static resumeProjectTimer(projectId: string): void {
    const m = this.getMetrics(projectId);
    // Set start time such that Date.now() - start equals totalProjectDurationMs
    this.startTimes.set(projectId, Date.now() - m.totalProjectDurationMs);
  }

  public static clearProject(projectId: string): void {
    this.metrics.delete(projectId);
    this.startTimes.delete(projectId);
  }

  public static resetAll(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }
}
