import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CompanyEventBus } from '../../src/core/integration/event-bus';
import type { CompanyEvent } from '../../src/core/integration/integration.types';

describe('Phase 30.5 — Company Event Bus', () => {
  beforeEach(() => {
    CompanyEventBus.resetListeners();
    CompanyEventBus.clearHistory();
  });

  it('1. Publishes events and triggers subscribed listeners', async () => {
    const listener = vi.fn();
    const unsubscribe = CompanyEventBus.subscribe('PROJECT_CREATED', listener);

    const evt = await CompanyEventBus.publish('PROJECT_CREATED', 'proj_123', { name: 'Test App' }, 'TestRunner');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      id: evt.id,
      type: 'PROJECT_CREATED',
      projectId: 'proj_123',
      payload: { name: 'Test App' },
    }));

    unsubscribe();
  });

  it('2. Triggers wildcard (*) listeners for any event type', async () => {
    const wildcardListener = vi.fn();
    CompanyEventBus.subscribe('*', wildcardListener);

    await CompanyEventBus.publish('DISCOVERY_COMPLETED', 'proj_abc', { score: 95 });
    await CompanyEventBus.publish('TASK_STARTED', 'proj_abc', { task: 'build' });

    expect(wildcardListener).toHaveBeenCalledTimes(2);
  });

  it('3. Maintains event history and filters by projectId or type', async () => {
    await CompanyEventBus.publish('PROJECT_CREATED', 'proj_A', { a: 1 });
    await CompanyEventBus.publish('TASK_CREATED', 'proj_A', { task: '1' });
    await CompanyEventBus.publish('PROJECT_CREATED', 'proj_B', { b: 2 });

    const allA = CompanyEventBus.getHistory('proj_A');
    expect(allA).toHaveLength(2);

    const createdEvents = CompanyEventBus.getHistory(undefined, 'PROJECT_CREATED');
    expect(createdEvents).toHaveLength(2);

    const aCreated = CompanyEventBus.getHistory('proj_A', 'PROJECT_CREATED');
    expect(aCreated).toHaveLength(1);
    expect(aCreated[0]!.payload).toEqual({ a: 1 });
  });

  it('4. Resiliently handles errors thrown in listeners without breaking publication', async () => {
    const faultyListener = vi.fn().mockImplementation(() => {
      throw new Error('Listener crash');
    });
    const goodListener = vi.fn();

    CompanyEventBus.subscribe('REVIEW_COMPLETED', faultyListener);
    CompanyEventBus.subscribe('REVIEW_COMPLETED', goodListener);

    const evt = await CompanyEventBus.publish('REVIEW_COMPLETED', 'proj_err', { ok: true });

    expect(evt).toBeDefined();
    expect(faultyListener).toHaveBeenCalled();
    expect(goodListener).toHaveBeenCalled();
  });
});
