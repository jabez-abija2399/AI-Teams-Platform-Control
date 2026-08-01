import { prisma } from '@/lib/prisma';
import type {
  CompanyCheckpoint,
  CompanyProjectState,
  CompanyWorker,
  CompanyTask,
  CompanyStopwatchMetrics,
} from './types';
import { CompanyStateMachine } from './company-state-machine';
import { CompanyStopwatch } from './company-stopwatch';

export class CompanyCheckpointService {
  private static memoryCheckpoints: Map<string, CompanyCheckpoint[]> = new Map();

  public static async saveCheckpoint(
    projectId: string,
    state: CompanyProjectState,
    eventIndex: number,
    activeWorkers: CompanyWorker[],
    completedTasks: string[],
    queuedTasks: CompanyTask[],
    stopwatchMetrics: CompanyStopwatchMetrics,
    resumePayload?: Record<string, any>
  ): Promise<CompanyCheckpoint> {
    const checkpoint: CompanyCheckpoint = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      projectId,
      state,
      eventIndex,
      activeWorkers: [...activeWorkers],
      completedTasks: [...completedTasks],
      queuedTasks: [...queuedTasks],
      stopwatchMetrics: { ...stopwatchMetrics, agentUtilization: { ...stopwatchMetrics.agentUtilization } },
      timestamp: Date.now(),
      resumePayload: resumePayload ? { ...resumePayload } : undefined,
    };

    // Save in memory
    const existing = this.memoryCheckpoints.get(projectId) || [];
    existing.unshift(checkpoint);
    if (existing.length > 50) existing.pop();
    this.memoryCheckpoints.set(projectId, existing);

    // Attempt to persist in DB (optional/graceful for tests)
    try {
      await prisma.document.create({
        data: {
          projectId,
          type: 'COMPANY_CHECKPOINT',
          title: `Checkpoint: ${state}`,
          content: JSON.stringify(checkpoint),
          author: 'CompanyCheckpointService',
        },
      });
    } catch (err) {
      // Gracefully ignore DB error in environments without active DB connection
    }

    return checkpoint;
  }

  public static async getLatestCheckpoint(projectId: string): Promise<CompanyCheckpoint | undefined> {
    // Check memory first
    const mem = this.memoryCheckpoints.get(projectId);
    if (mem && mem.length > 0) {
      return mem[0];
    }

    // Try restoring from DB
    try {
      const doc = await prisma.document.findFirst({
        where: { projectId, type: 'COMPANY_CHECKPOINT' },
        orderBy: { createdAt: 'desc' },
      });
      if (doc) {
        const parsed = JSON.parse(doc.content) as CompanyCheckpoint;
        this.memoryCheckpoints.set(projectId, [parsed]);
        return parsed;
      }
    } catch (err) {
      // Ignore DB errors
    }

    return undefined;
  }

  public static async restoreCheckpoint(projectId: string): Promise<{ checkpoint?: CompanyCheckpoint; restored: boolean }> {
    const chk = await this.getLatestCheckpoint(projectId);
    if (!chk) {
      return { restored: false };
    }

    // Restore state machine
    CompanyStateMachine.forceState(projectId, chk.state);

    // Restore stopwatch metrics
    const m = CompanyStopwatch.getMetrics(projectId);
    m.totalProjectDurationMs = chk.stopwatchMetrics.totalProjectDurationMs;
    m.taskDurationMs = chk.stopwatchMetrics.taskDurationMs;
    m.reviewDurationMs = chk.stopwatchMetrics.reviewDurationMs;
    m.idleTimeMs = chk.stopwatchMetrics.idleTimeMs;
    m.approvalWaitingTimeMs = chk.stopwatchMetrics.approvalWaitingTimeMs;
    m.agentUtilization = { ...chk.stopwatchMetrics.agentUtilization };
    m.lastUpdated = Date.now();
    CompanyStopwatch.setProjectStartTime(projectId, Date.now() - chk.stopwatchMetrics.totalProjectDurationMs);

    return { checkpoint: chk, restored: true };
  }

  public static async clearCheckpoints(projectId: string): Promise<void> {
    this.memoryCheckpoints.delete(projectId);
    try {
      await prisma.document.deleteMany({
        where: { projectId, type: 'COMPANY_CHECKPOINT' },
      });
    } catch (err) {
      // Ignore DB errors
    }
  }

  public static resetAll(): void {
    this.memoryCheckpoints.clear();
  }
}
