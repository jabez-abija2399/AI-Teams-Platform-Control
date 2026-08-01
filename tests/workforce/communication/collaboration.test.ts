import { describe, it, expect } from 'vitest';
import { ConversationEngine } from '../../../src/core/workforce/communication/conversation.engine';
import { ConflictResolutionEngine } from '../../../src/core/workforce/communication/conflict-resolution.engine';

describe('Phase 28 Step 4 — Agent Collaboration & Conflict Resolution', () => {
  const projectId = 'proj_collab_test';

  it('1. Agents start a conversation thread and post messages', async () => {
    const conv = await ConversationEngine.startConversation(
      'REST API response format',
      ['FRONTEND_ENGINEER', 'BACKEND_ENGINEER'],
      projectId
    );

    expect(conv.id).toBeDefined();
    expect(conv.topic).toBe('REST API response format');
    expect(conv.participants).toContain('FRONTEND_ENGINEER');
    expect(conv.status).toBe('active');

    await ConversationEngine.postMessage(conv.id, 'FRONTEND_ENGINEER', 'API response format is unclear.', 'QUESTION');
    await ConversationEngine.postMessage(conv.id, 'BACKEND_ENGINEER', 'We use standard REST envelope.', 'ANSWER');

    const conversations = await ConversationEngine.getConversations(projectId);
    const found = conversations.find((c) => c.id === conv.id);
    expect(found?.messages.length).toBeGreaterThanOrEqual(2);
  });

  it('2. Conversation resolves and records decision in collaboration memory', async () => {
    const conv = await ConversationEngine.startConversation(
      'Database indexing strategy',
      ['DATABASE_ENGINEER', 'SOFTWARE_ARCHITECT'],
      projectId
    );

    await ConversationEngine.postMessage(conv.id, 'DATABASE_ENGINEER', 'Composite indexes on foreign keys', 'REQUEST');
    const resolved = await ConversationEngine.resolveConversation(
      conv.id,
      'Use composite indexes on all foreign key columns',
      'SOFTWARE_ARCHITECT'
    );

    expect(resolved?.status).toBe('resolved');
    const lastMsg = resolved?.messages[resolved.messages.length - 1];
    expect(lastMsg?.content).toContain('RESOLVED');
  });

  it('3. Conflict Resolution Engine detects disagreement and creates a decision', async () => {
    const result = await ConflictResolutionEngine.resolveConflict({
      projectId,
      topic: 'State management approach',
      conflictingRoles: ['FRONTEND_ENGINEER', 'SOFTWARE_ARCHITECT'],
      proposals: [
        { role: 'FRONTEND_ENGINEER', solution: 'Use Redux for global state' },
        { role: 'SOFTWARE_ARCHITECT', solution: 'Use server state only via React Server Components' },
      ],
    });

    expect(result.conflictId).toBeDefined();
    expect(result.winningResolution).toBe('Use server state only via React Server Components');
    expect(result.rationale).toContain('SOFTWARE_ARCHITECT');
  });
});
