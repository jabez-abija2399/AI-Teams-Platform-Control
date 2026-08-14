import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CompanySupervisor,
  CompanyHealthService,
  companyEventBus,
  CompanyStateMachine,
  CompanyStopwatch,
  type CompanyWorker,
  type CompanyTask,
} from '../../src/core/company';

describe('Phase 34 — Company Supervisor Service', () => {
  const projectId = 'proj_sup_test_303';

  beforeEach(() => {
    CompanySupervisor.resetAll();
    CompanyHealthService.resetAll();
    CompanyStateMachine.resetAll();
    CompanyStopwatch.resetAll();
    companyEventBus.clearHistory();
    companyEventBus.resetListeners();
  });

  it('1. Recommends REBALANCE_WORKERS when queue backlog exists with idle workers', async () => {
    const workers: CompanyWorker[] = [
      { id: 'w1', role: 'DEVELOPER', status: 'IDLE', lastHeartbeat: Date.now(), utilizationPercentage: 10 },
      { id: 'w2', role: 'DEVELOPER', status: 'IDLE', lastHeartbeat: Date.now(), utilizationPercentage: 15 },
    ];
    const queue: CompanyTask[] = [
      { id: 't1', projectId, title: 'Task 1', description: '', role: 'DEVELOPER', status: 'QUEUED', durationMs: 0, retries: 0, maxRetries: 3 },
      { id: 't2', projectId, title: 'Task 2', description: '', role: 'DEVELOPER', status: 'QUEUED', durationMs: 0, retries: 0, maxRetries: 3 },
    ];
    const stopwatch = CompanyStopwatch.initProject(projectId);

    const recs = await CompanySupervisor.monitor(projectId, workers, queue, stopwatch);

    const rebalance = recs.find((r) => r.type === 'REBALANCE_WORKERS');
    expect(rebalance).toBeDefined();
    expect(rebalance?.suggestedAction).toContain('assign queued tasks');
  });

  it('2. Recommends RETRY_TASK and emits SUPERVISOR_RECOMMENDATION event on task failures', async () => {
    const workers: CompanyWorker[] = [];
    const queue: CompanyTask[] = [
      { id: 't_fail', projectId, title: 'Failed Task', description: '', role: 'DEVELOPER', status: 'FAILED', durationMs: 500, retries: 3, maxRetries: 3, error: 'Network timeout' },
    ];
    const stopwatch = CompanyStopwatch.initProject(projectId);

    const listener = vi.fn();
    companyEventBus.subscribe('SUPERVISOR_RECOMMENDATION', listener);

    const recs = await CompanySupervisor.monitor(projectId, workers, queue, stopwatch);

    const retryRec = recs.find((r) => r.type === 'RETRY_TASK');
    expect(retryRec).toBeDefined();
    expect(retryRec?.priority).toBe('CRITICAL');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('3. Generates HEALTH_WARNING when system health is DEGRADED or STALLED', async () => {
    CompanyHealthService.setStatus(projectId, 'STALLED', 'Worker stopped responding');
    const workers: CompanyWorker[] = [];
    const queue: CompanyTask[] = [];
    const stopwatch = CompanyStopwatch.initProject(projectId);

    const recs = await CompanySupervisor.monitor(projectId, workers, queue, stopwatch);

    const healthRec = recs.find((r) => r.type === 'HEALTH_WARNING');
    expect(healthRec).toBeDefined();
    expect(healthRec?.priority).toBe('CRITICAL');
  });
});
