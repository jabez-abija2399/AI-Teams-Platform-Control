import { prisma } from '@/lib/prisma';
import type { AgentMessage, MessageType, MessagePriority } from './communication.types';
import type { CompanyRole } from '../types';
import { ActivityService } from '../../workspace/activity.service';

const inMemoryMessages = new Map<string, AgentMessage[]>();

export class MessageService {
  /**
   * Sends an agent-to-agent message
   */
  public static async sendMessage(params: {
    projectId?: string;
    senderRole: CompanyRole;
    receiverRole?: CompanyRole;
    messageType: MessageType;
    content: string;
    priority?: MessagePriority;
  }): Promise<AgentMessage> {
    const key = params.projectId || 'global';
    const message: AgentMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      projectId: params.projectId,
      senderRole: params.senderRole,
      receiverRole: params.receiverRole,
      messageType: params.messageType,
      content: params.content,
      priority: params.priority || 'medium',
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const existing = inMemoryMessages.get(key) || [];
    existing.push(message);
    inMemoryMessages.set(key, existing);

    // Non-blocking Prisma record creation
    prisma.agentMessageRecord.create({
      data: {
        projectId: params.projectId,
        senderRole: params.senderRole,
        receiverRole: params.receiverRole,
        messageType: params.messageType,
        content: params.content,
      },
    }).catch(() => null);

    if (params.projectId) {
      ActivityService.recordActivity(
        params.projectId,
        params.senderRole,
        params.senderRole,
        `[${params.messageType}] ${params.content}`,
        'update'
      );
    }

    return message;
  }

  /**
   * Retrieves messages for a project or specific receiver role
   */
  public static async getMessages(projectId?: string, receiverRole?: CompanyRole): Promise<AgentMessage[]> {
    const key = projectId || 'global';
    let messages = inMemoryMessages.get(key) || [];

    if (receiverRole) {
      messages = messages.filter((m) => m.receiverRole === receiverRole || !m.receiverRole);
    }

    return messages;
  }

  /**
   * Retrieves unread messages for an AI employee role
   */
  public static async getUnreadMessages(receiverRole: CompanyRole, projectId?: string): Promise<AgentMessage[]> {
    const messages = await this.getMessages(projectId, receiverRole);
    return messages.filter((m) => !m.isRead);
  }

  /**
   * Marks messages as read
   */
  public static async markAsRead(messageIds: string[], projectId?: string): Promise<void> {
    const key = projectId || 'global';
    const messages = inMemoryMessages.get(key) || [];
    for (const msg of messages) {
      if (messageIds.includes(msg.id)) {
        msg.isRead = true;
      }
    }
  }
}
