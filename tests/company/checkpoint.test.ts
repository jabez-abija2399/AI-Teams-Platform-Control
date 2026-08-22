import { describe, it, expect, beforeEach } from 'vitest';
import {
  CompanyCheckpointService,
  CompanyStateMachine,
  CompanyStopwatch,
  type CompanyWorker,
  type CompanyTask,
} from '../../src/core/company';

describe('Phase 34 — Company Checkpoint Service', () => {
  const projectId = 'proj_chk_test_404';

  beforeEach(async () => {
    await CompanyCheckpointService.clearCheckpoints(projectId);
    CompanyCheckpointService.resetAll();
    CompanyStateMachine.resetAll();
    CompanyStopwatch.resetAll();
  });

  it('1. Saves checkpoints in memory and retrieves the latest snapshot', async () => {
    const workers: CompanyWorker[] = [
      { id: 'w1', role: 'ARCHITECT', status: 'WORKING', lastHeartbeat: Date.now(), utilizationPercentage: 50 },
    ];
    const queue: CompanyTask[] = [];
    const stopwatch = CompanyStopwatch.initProject(projectId);
    stopwatch.totalProjectDurationMs = 15000;

    const chk = await CompanyCheckpointService.saveCheckpoint(
      projectId,
      'ARCHITECTURE',
      5,
      workers,
      ['task_1', 'task_2'],
      queue,
      stopwatch,
      { customData: 'test' }
    );

    expect(chk.id).toBeDefined();
    expect(chk.state).toBe('ARCHITECTURE');
    expect(chk.eventIndex).toBe(5);

    const latest = await CompanyCheckpointService.getLatestCheckpoint(projectId);
    expect(latest).toBeDefined();
    expect(latest?.id).toBe(chk.id);
    expect(latest?.completedTasks).toEqual(['task_1', 'task_2']);
  });

  it('2. Restores project state and stopwatch metrics from persistent checkpoints', async () => {
    const workers: CompanyWorker[] = [];
    const queue: CompanyTask[] = [];
    const stopwatch = CompanyStopwatch.initProject(projectId);
    stopwatch.totalProjectDurationMs = 25000;
    stopwatch.taskDurationMs = 20000;

    await CompanyCheckpointService.saveCheckpoint(
      projectId,
      'EXECUTION',
      10,
      workers,
      [],
      queue,
      stopwatch
    );

    // Simulate crash/reset by clearing in-memory state machine and stopwatch
    CompanyStateMachine.clearProject(projectId);
    CompanyStopwatch.clearProject(projectId);
    expect(CompanyStateMachine.getState(projectId)).toBe('CREATED'); // default fallback

    const result = await CompanyCheckpointService.restoreCheckpoint(projectId);

    expect(result.restored).toBe(true);
    expect(CompanyStateMachine.getState(projectId)).toBe('EXECUTION');

    const restoredStopwatch = CompanyStopwatch.getMetrics(projectId);
    expect(restoredStopwatch.totalProjectDurationMs).toBeGreaterThanOrEqual(25000);
    expect(restoredStopwatch.totalProjectDurationMs).toBeLessThanOrEqual(26000);
    expect(restoredStopwatch.taskDurationMs).toBe(20000);
  });
});
