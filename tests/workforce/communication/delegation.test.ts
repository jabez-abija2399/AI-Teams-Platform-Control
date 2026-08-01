import { describe, it, expect } from 'vitest';
import { DelegationEngine } from '../../../src/core/workforce/communication/delegation.engine';
import { ConversationEngine } from '../../../src/core/workforce/communication/conversation.engine';

describe('Phase 28 Step 4 — Agent Delegation Engine', () => {
  const projectId = 'proj_deleg_test';

  it('1. Agent delegates subtask and delegation record is created', async () => {
    const result = await DelegationEngine.delegateSubtask({
      parentTaskId: 'task_auth_system',
      fromAgent: 'SOFTWARE_ARCHITECT',
      toAgent: 'DATABASE_ENGINEER',
      subtaskTitle: 'Create user authentication schema',
      subtaskDescription: 'Design users table with password hash and session tokens',
      projectId,
    });

    expect(result.success).toBe(true);
    expect(result.delegation).toBeDefined();
    expect(result.delegation?.fromAgent).toBe('SOFTWARE_ARCHITECT');
    expect(result.delegation?.toAgent).toBe('DATABASE_ENGINEER');
    expect(result.delegation?.status).toBe('assigned');
  });

  it('2. Delegations are retrievable by parent task ID', async () => {
    await DelegationEngine.delegateSubtask({
      parentTaskId: 'task_api_routes',
      fromAgent: 'SOFTWARE_ARCHITECT',
      toAgent: 'BACKEND_ENGINEER',
      subtaskTitle: 'Implement REST endpoints',
      subtaskDescription: 'Create CRUD route handlers',
      projectId,
    });

    const delegations = await DelegationEngine.getDelegationsForTask('task_api_routes');
    expect(delegations.length).toBeGreaterThan(0);
    expect(delegations[0]?.parentTaskId).toBe('task_api_routes');
  });

  it('3. Delegation status can be updated to completed', async () => {
    const result = await DelegationEngine.delegateSubtask({
      parentTaskId: 'task_ui_build',
      fromAgent: 'FRONTEND_ENGINEER',
      toAgent: 'UI_ENGINEER',
      subtaskTitle: 'Design glassmorphism panel',
      subtaskDescription: 'CSS styling for dashboard cards',
      projectId,
    });

    const updated = await DelegationEngine.updateDelegationStatus(result.delegation!.id, 'completed');
    expect(updated?.status).toBe('completed');
  });
});
