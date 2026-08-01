import { describe, it, expect } from 'vitest';
import { ExecutivePlanner } from '../../src/core/executive/executive-planner';
import { AssignmentEngine } from '../../src/core/executive/assignment-engine';
import { DependencyEngine } from '../../src/core/executive/dependency-engine';
import { ProgressEngine } from '../../src/core/executive/progress-engine';
import { ExecutiveDashboardService } from '../../src/core/executive/executive-dashboard';

describe('Phase 26 — AI Executive Planning & Work Management Engine', () => {
  const projectId = 'proj_executive_test';

  it('1. Executive Planner converts proposals into milestones, work packages, and tasks', async () => {
    const plan = await ExecutivePlanner.planProjectWork(projectId);

    expect(plan.milestones.length).toBeGreaterThanOrEqual(3);
    expect(plan.workPackages.length).toBeGreaterThanOrEqual(2);
    expect(plan.tasks.length).toBeGreaterThanOrEqual(3);
  });

  it('2. Assignment Engine assigns tasks to specialists based on capabilities', () => {
    const dbTask = AssignmentEngine.assignTask('Design PostgreSQL Database Schema', 'Create tables');
    expect(dbTask.assignedAgent).toBe('DATABASE_ENGINEER');
    expect(dbTask.reviewerAgent).toBe('SOFTWARE_ARCHITECT');

    const feTask = AssignmentEngine.assignTask('Build React UI Component', 'CSS styling');
    expect(feTask.assignedAgent).toBe('FRONTEND_ENGINEER');
    expect(feTask.reviewerAgent).toBe('QA_ENGINEER');
  });

  it('3. Dependency Engine evaluates dependencies and flags blocked tasks', () => {
    const t1 = {
      id: 'task_a',
      projectId,
      workPackageId: 'wp_1',
      title: 'Setup DB',
      description: '',
      assignedAgent: 'DATABASE',
      reviewerAgent: 'ARCHITECT',
      priority: 'high' as const,
      status: 'pending' as const,
      estimatedTime: '1h',
      blockers: [],
      dependencyChain: [],
      completionPercentage: 0,
    };

    const t2 = {
      id: 'task_b',
      projectId,
      workPackageId: 'wp_1',
      title: 'Build API',
      description: '',
      assignedAgent: 'DEVELOPER',
      reviewerAgent: 'ARCHITECT',
      priority: 'high' as const,
      status: 'pending' as const,
      estimatedTime: '2h',
      blockers: [],
      dependencyChain: ['task_a'],
      completionPercentage: 0,
    };

    const evaluated = DependencyEngine.evaluateDependencies([t1, t2]);
    const blocked = evaluated.find((t) => t.id === 'task_b');
    expect(blocked?.status).toBe('blocked');
    expect(blocked?.blockers.length).toBeGreaterThan(0);
  });

  it('4. Progress Engine calculates milestone and project completion percentages', () => {
    const m1 = {
      id: 'm1',
      projectId,
      title: 'M1',
      description: '',
      priority: 'high' as const,
      estimatedDuration: '1d',
      dependencies: [],
      completionPercentage: 100,
      status: 'completed' as const,
    };

    const m2 = {
      id: 'm2',
      projectId,
      title: 'M2',
      description: '',
      priority: 'high' as const,
      estimatedDuration: '1d',
      dependencies: [],
      completionPercentage: 50,
      status: 'in_progress' as const,
    };

    const overallProgress = ProgressEngine.calculateProjectProgress([m1, m2]);
    expect(overallProgress).toBe(75);
  });

  it('5. Executive Dashboard computes health scores and recommendations', async () => {
    const dashboard = await ExecutiveDashboardService.getDashboardData(projectId);

    expect(dashboard.healthScore).toBeGreaterThan(0);
    expect(dashboard.milestones.length).toBeGreaterThan(0);
    expect(dashboard.agentWorkloads.length).toBeGreaterThan(0);
    expect(dashboard.recommendations.length).toBeGreaterThan(0);
  });

  it('6. Automatic Replanning adds new tasks and updates dependency graph', async () => {
    const replanned = await ExecutivePlanner.replan(projectId, 'User requested real-time WebSocket notifications');

    expect(replanned.tasks.length).toBeGreaterThan(3);
    const newTsk = replanned.tasks.find((t) => t.title.includes('Replanned Task'));
    expect(newTsk).toBeDefined();
  });
});
