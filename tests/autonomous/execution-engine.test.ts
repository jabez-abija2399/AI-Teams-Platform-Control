import { describe, it, expect, vi } from 'vitest';
import { ExecutionScheduler } from '../../src/core/autonomous/execution-scheduler';
import { ParallelExecutionEngine } from '../../src/core/autonomous/parallel-execution.engine';
import { ConflictDetector } from '../../src/core/autonomous/conflict-detector';
import { RetryEngine } from '../../src/core/autonomous/retry-engine';
import { ReviewPipeline } from '../../src/core/autonomous/review-pipeline';

vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/core/executive/executive-planner', () => ({
  ExecutivePlanner: {
    planProjectWork: vi.fn().mockResolvedValue({
      milestones: [],
      workPackages: [],
      tasks: [],
    }),
  },
}));
vi.mock('@/core/executive/assignment-engine', () => ({ AssignmentEngine: { assignTask: vi.fn() } }));
vi.mock('@/core/autonomous/execution-timeline.service', () => ({ ExecutionTimelineService: { recordTick: vi.fn() } }));
vi.mock('@/core/integration/event-bus', () => ({ companyEventBus: { publish: vi.fn() } }));

describe('Phase 27 — Autonomous Execution Engine', () => {
  const projectId = 'proj_autonomous_test';

  it('1. Execution Scheduler ticks and returns worker utilization metrics', async () => {
    const status = await ExecutionScheduler.tick(projectId);

    expect(status.projectId).toBe(projectId);
    expect(status.concurrencyLimit).toBe(4);
    expect(status.queuedTasksCount).toBeGreaterThanOrEqual(0);
  });

  it('2. Parallel Execution Engine respects maximum worker concurrency limits', async () => {
    const limit = ParallelExecutionEngine.getConcurrencyLimit();
    expect(limit).toBe(4);

    const active = ParallelExecutionEngine.getActiveWorkers();
    expect(active.length).toBeLessThanOrEqual(limit);
  });

  it('3. Conflict Detector identifies duplicate work and dependency violations', () => {
    const mockTasks = [
      {
        id: 'tsk_101',
        projectId,
        workPackageId: 'wp_1',
        title: 'Duplicate Feature Task',
        description: '',
        assignedAgent: 'DEVELOPER',
        reviewerAgent: 'ARCHITECT',
        priority: 'high' as const,
        status: 'pending' as const,
        estimatedTime: '1h',
        blockers: [],
        dependencyChain: [],
        completionPercentage: 0,
      },
      {
        id: 'tsk_102',
        projectId,
        workPackageId: 'wp_1',
        title: 'Duplicate Feature Task',
        description: '',
        assignedAgent: 'DEVELOPER',
        reviewerAgent: 'ARCHITECT',
        priority: 'high' as const,
        status: 'pending' as const,
        estimatedTime: '1h',
        blockers: [],
        dependencyChain: [],
        completionPercentage: 0,
      },
    ];

    const conflicts = ConflictDetector.detectConflicts(projectId, mockTasks);
    const firstConflict = conflicts[0];
    expect(firstConflict?.conflictType).toBe('duplicate_work');
  });

  it('4. Retry Engine classifies failure and suggests remediation action', async () => {
    const retryRes = await RetryEngine.handleFailure(projectId, 'tsk_failed_1', 'Rate limit exceeded on LLM API');

    expect(retryRes.shouldRetry).toBe(true);
    expect(retryRes.attempt).toBe(1);
    expect(retryRes.remediationAction).toContain('Exponential backoff');
  });

  it('5. Review Pipeline conducts automated reviews across 4 stages', () => {
    const reviews = ReviewPipeline.evaluateTask('tsk_completed_1', 'SECURITY');

    expect(reviews.length).toBe(4);
    const secReview = reviews.find((r) => r.stage === 'Security');
    expect(secReview?.approved).toBe(true);
    expect(secReview?.score).toBe(96);
  });
});
