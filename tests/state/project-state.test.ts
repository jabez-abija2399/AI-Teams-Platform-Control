import { describe, it, expect } from 'vitest';
import { ProjectStateManager, createInitialProjectState } from '../../src/core/state/project-state.manager';

describe('ProjectStateManager & Single Source of Truth', () => {
  const projectId = 'proj_state_test_1';

  it('should initialize clean project state with all required domain layers', async () => {
    const state = await ProjectStateManager.getState(projectId);
    expect(state).toBeDefined();
    expect(state.projectId).toBe(projectId);
    expect(state.status).toBe('INITIALIZING');
    expect(state.requirements).toBeDefined();
    expect(state.architecture).toBeDefined();
    expect(state.design).toBeDefined();
    expect(state.implementation).toBeDefined();
    expect(state.qa).toBeDefined();
    expect(state.budget).toBeDefined();
  });

  it('should transition project stage and increment version', async () => {
    const updated = await ProjectStateManager.transitionStage(projectId, 'REQUIREMENTS', 'Starting requirements phase');
    expect(updated.currentStage).toBe('REQUIREMENTS');
    expect(updated.status).toBe('REQUIREMENTS');
    expect(updated.version).toBeGreaterThanOrEqual(2);
    expect(updated.checkpoints.length).toBeGreaterThanOrEqual(1);
  });

  it('should record checkpoints and allow checkpoint restoration', async () => {
    const cp = await ProjectStateManager.createCheckpoint(projectId, 'ARCHITECTURE', 'Architecture spec finalized');
    expect(cp.id).toBeDefined();
    expect(cp.checkpointNumber).toBeGreaterThan(0);

    const restored = await ProjectStateManager.restoreCheckpoint(projectId, cp.id);
    expect(restored).toBeDefined();
    expect(restored?.currentStage).toBe('ARCHITECTURE');
  });

  it('should accurately track token and cost consumption in budget tracker', async () => {
    await ProjectStateManager.recordUsage(projectId, 1200, 350, 0.015);
    const state = await ProjectStateManager.getState(projectId);
    expect(state.budget.promptTokens).toBe(1200);
    expect(state.budget.completionTokens).toBe(350);
    expect(state.budget.totalTokensUsed).toBe(1550);
    expect(state.budget.totalCostUsd).toBe(0.015);
    expect(state.budget.modelInvocations).toBe(1);
  });
});
