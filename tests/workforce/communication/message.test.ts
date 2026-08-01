import { describe, it, expect } from 'vitest';
import { MessageService } from '../../../src/core/workforce/communication/message.service';

describe('Phase 28 Step 4 — Agent Messaging Service', () => {
  const projectId = 'proj_msg_test';

  it('1. Agent sends a message and it is stored', async () => {
    const msg = await MessageService.sendMessage({
      projectId,
      senderRole: 'BACKEND_ENGINEER',
      receiverRole: 'DATABASE_ENGINEER',
      messageType: 'QUESTION',
      content: 'Should users table have soft delete?',
      priority: 'high',
    });

    expect(msg.id).toBeDefined();
    expect(msg.senderRole).toBe('BACKEND_ENGINEER');
    expect(msg.receiverRole).toBe('DATABASE_ENGINEER');
    expect(msg.messageType).toBe('QUESTION');
    expect(msg.content).toBe('Should users table have soft delete?');
    expect(msg.priority).toBe('high');
    expect(msg.isRead).toBe(false);
  });

  it('2. Agent retrieves messages filtered by receiver role', async () => {
    await MessageService.sendMessage({
      projectId,
      senderRole: 'FRONTEND_ENGINEER',
      receiverRole: 'QA_ENGINEER',
      messageType: 'REQUEST',
      content: 'Please review dashboard component',
    });

    const qaMessages = await MessageService.getMessages(projectId, 'QA_ENGINEER');
    expect(qaMessages.length).toBeGreaterThan(0);
    const found = qaMessages.find((m) => m.content.includes('dashboard component'));
    expect(found).toBeDefined();
  });

  it('3. Unread messages are tracked and can be marked as read', async () => {
    const msg = await MessageService.sendMessage({
      projectId,
      senderRole: 'SECURITY_ENGINEER',
      receiverRole: 'BACKEND_ENGINEER',
      messageType: 'WARNING',
      content: 'JWT token expiry too long',
    });

    const unread = await MessageService.getUnreadMessages('BACKEND_ENGINEER', projectId);
    expect(unread.some((m) => m.id === msg.id)).toBe(true);

    await MessageService.markAsRead([msg.id], projectId);
    const afterMark = await MessageService.getUnreadMessages('BACKEND_ENGINEER', projectId);
    expect(afterMark.some((m) => m.id === msg.id)).toBe(false);
  });
});
