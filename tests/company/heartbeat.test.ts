import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CompanyHeartbeat,
  CompanyHealthService,
  companyEventBus,
  CompanyStateMachine,
  type CompanyWorker,
  type CompanyTask,
} from '../../src/core/company';

describe('Phase 34 — Company Heartbeat Service', () => {
  const projectId = 'proj_hb_test_202';

  beforeEach(() => {
    CompanyHeartbeat.resetAll();
    CompanyHealthService.resetAll();
    CompanyStateMachine.resetAll();
    companyEventBus.clearHistory();
    companyEventBus.resetListeners();
  });

  it('1. Emits HEARTBEAT_CHECK pulse during routine evaluation', async () => {
    const workers: CompanyWorker[] = [
      { id: 'w1', role: 'DEVELOPER', status: 'WORKING', lastHeartbeat: Date.now(), utilizationPercentage: 50 },
    ];
    const queue: CompanyTask[] = [];

    const listener = vi.fn();
    companyEventBus.subscribe('HEARTBEAT_CHECK', listener);

    const report = await CompanyHeartbeat.check(projectId, workers, queue);

    expect(report.status).toBe('HEALTHY');
    expect(report.runningWorkersCount).toBe(1);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('2. Detects stalled workers and emits WORKER_STALLED event', async () => {
    const stalledWorker: CompanyWorker = {
      id: 'w_stalled',
      role: 'DEVELOPER',
      status: 'WORKING',
      lastHeartbeat: Date.now() - 45000, // 45 seconds ago
      utilizationPercentage: 80,
    };
    const workers = [stalledWorker];
    const queue: CompanyTask[] = [];

    const listener = vi.fn();
    companyEventBus.subscribe('WORKER_STALLED', listener);

    const report = await CompanyHeartbeat.check(projectId, workers, queue);

    expect(report.status).toBe('STALLED');
    expect(report.stalledWorkersCount).toBe(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'WORKER_STALLED',
        projectId,
      })
    );
  });

  it('3. Detects potential deadlocks and emits DEADLOCK_DETECTED event', async () => {
    const idleWorkers: CompanyWorker[] = [
      { id: 'w1', role: 'DEVELOPER', status: 'IDLE', lastHeartbeat: Date.now(), utilizationPercentage: 0 },
    ];
    const queuedTasks: CompanyTask[] = [
      {
        id: 't1',
        projectId,
        title: 'Pending Build Task',
        description: 'Stuck in queue',
        role: 'DEVELOPER',
        status: 'QUEUED',
        durationMs: 0,
        retries: 0,
        maxRetries: 3,
      },
    ];

    const listener = vi.fn();
    companyEventBus.subscribe('DEADLOCK_DETECTED', listener);

    const report = await CompanyHeartbeat.check(projectId, idleWorkers, queuedTasks);

    expect(report.deadlocksDetected).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('4. Detects failed tasks and emits TASK_FAILED event', async () => {
    const workers: CompanyWorker[] = [];
    const failedQueue: CompanyTask[] = [
      {
        id: 't_fail',
        projectId,
        title: 'Failing DB Migration',
        description: 'Syntax error',
        role: 'DEVELOPER',
        status: 'FAILED',
        durationMs: 1200,
        retries: 3,
        maxRetries: 3,
        error: 'Syntax error in schema',
      },
    ];

    const listener = vi.fn();
    companyEventBus.subscribe('TASK_FAILED', listener);

    const report = await CompanyHeartbeat.check(projectId, workers, failedQueue);

    expect(report.status).toBe('FAILED');
    expect(report.failedRetriesCount).toBe(1);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
