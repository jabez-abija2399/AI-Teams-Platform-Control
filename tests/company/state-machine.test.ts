import { describe, it, expect, beforeEach } from 'vitest';
import { CompanyStateMachine, CompanyEventBus } from '../../src/core/company';

describe('Phase 34 — Company State Machine', () => {
  const projectId = 'proj_sm_test_101';

  beforeEach(() => {
    CompanyStateMachine.resetAll();
    CompanyEventBus.clearHistory();
    CompanyEventBus.resetListeners();
  });

  it('1. Initializes project state to CREATED by default', () => {
    const state = CompanyStateMachine.initProject(projectId);
    expect(state).toBe('CREATED');
    expect(CompanyStateMachine.getState(projectId)).toBe('CREATED');
  });

  it('2. Permits valid sequential lifecycle transitions', async () => {
    CompanyStateMachine.initProject(projectId, 'CREATED');

    await CompanyStateMachine.transition(projectId, 'DISCOVERY');
    expect(CompanyStateMachine.getState(projectId)).toBe('DISCOVERY');

    await CompanyStateMachine.transition(projectId, 'CLARIFICATION');
    expect(CompanyStateMachine.getState(projectId)).toBe('CLARIFICATION');

    await CompanyStateMachine.transition(projectId, 'PRODUCT_APPROVAL');
    expect(CompanyStateMachine.getState(projectId)).toBe('PRODUCT_APPROVAL');

    await CompanyStateMachine.transition(projectId, 'ARCHITECTURE');
    expect(CompanyStateMachine.getState(projectId)).toBe('ARCHITECTURE');
  });

  it('3. Supports PAUSED state and remembers previous state for resumption', async () => {
    CompanyStateMachine.initProject(projectId, 'EXECUTION');

    await CompanyStateMachine.transition(projectId, 'PAUSED', 'Waiting on API key');
    expect(CompanyStateMachine.getState(projectId)).toBe('PAUSED');
    expect(CompanyStateMachine.getPreviousState(projectId)).toBe('EXECUTION');

    const history = CompanyEventBus.getHistory(projectId, 'EXECUTION_PAUSED');
    expect(history).toHaveLength(1);
    expect(history[0]!.payload.from).toBe('EXECUTION');

    await CompanyStateMachine.transition(projectId, 'EXECUTION', 'Resuming');
    expect(CompanyStateMachine.getState(projectId)).toBe('EXECUTION');
  });

  it('4. Throws error on invalid state transitions', async () => {
    CompanyStateMachine.initProject(projectId, 'CREATED');

    await expect(CompanyStateMachine.transition(projectId, 'COMPLETED')).rejects.toThrow(
      /Invalid company state transition/
    );
  });
});
