import { describe, it, expect } from 'vitest';
import { WorkspaceService } from '../../src/core/workspace/workspace.service';
import { ActivityService } from '../../src/core/workspace/activity.service';

describe('Phase 24 — AI Company Workspace (Mission Control)', () => {
  const projectId = 'proj_workspace_test';

  it('1. Initializes AI Company Workspace state with timeline and active employees', () => {
    const state = WorkspaceService.getWorkspaceState(projectId, 'Test AI SaaS');

    expect(state.projectId).toBe(projectId);
    expect(state.projectName).toBe('Test AI SaaS');
    expect(state.currentPhase).toBe('Discovery');
    expect(state.timeline.length).toBeGreaterThanOrEqual(10);
    expect(state.employees.length).toBeGreaterThanOrEqual(6);
    expect(state.mode).toBe('creator');
  });

  it('2. Toggles between Creator Mode and Developer Mode', () => {
    const initialMode = WorkspaceService.getWorkspaceState(projectId).mode;
    expect(initialMode).toBe('creator');

    const newMode = WorkspaceService.toggleMode(projectId);
    expect(newMode).toBe('developer');

    const revertedMode = WorkspaceService.toggleMode(projectId);
    expect(revertedMode).toBe('creator');
  });

  it('3. Pauses and resumes workspace execution', () => {
    const isPaused = WorkspaceService.togglePause(projectId);
    expect(isPaused).toBe(true);

    const resumed = WorkspaceService.togglePause(projectId);
    expect(resumed).toBe(false);
  });

  it('4. Updates active AI employee task, progress, and status', () => {
    const updatedState = WorkspaceService.updateEmployeeStatus(
      projectId,
      'DEVELOPER',
      'Completed',
      'Software engineering implementation complete',
      100,
      'Implementation complete.'
    );

    const devEmp = updatedState.employees.find((e) => e.role === 'DEVELOPER');
    expect(devEmp).toBeDefined();
    expect(devEmp?.status).toBe('Completed');
    expect(devEmp?.progress).toBe(100);
  });

  it('5. Records and fetches humanized company activities', () => {
    ActivityService.recordActivity(
      projectId,
      'FRONTEND',
      'Lead Frontend AI',
      'Started building responsive dashboard components.',
      'update'
    );

    const feed = ActivityService.getActivityFeed(projectId);
    expect(feed.length).toBeGreaterThan(0);
    expect(feed.some((f) => f.message.includes('responsive dashboard'))).toBe(true);
  });
});
