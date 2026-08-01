import { prisma } from '@/lib/prisma';
import type { AgentConversationState, AgentMessage } from './communication.types';
import type { CompanyRole } from '../types';
import { MessageService } from './message.service';
import { CollaborationMemoryService } from './collaboration-memory.service';

const inMemoryConversations = new Map<string, AgentConversationState>();

export class ConversationEngine {
  /**
   * Starts a new conversation thread between AI employees
   */
  public static async startConversation(
    topic: string,
    participants: CompanyRole[],
    projectId?: string
  ): Promise<AgentConversationState> {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const conversation: AgentConversationState = {
      id: conversationId,
      projectId,
      topic,
      participants,
      status: 'active',
      messages: [],
      createdAt: new Date().toISOString(),
    };

    inMemoryConversations.set(conversationId, conversation);

    // Non-blocking Prisma insertion
    prisma.agentConversation.create({
      data: {
        id: conversationId,
        projectId,
        topic,
        participants: JSON.stringify(participants),
        status: 'active',
      },
    }).catch(() => null);

    return conversation;
  }

  /**
   * Posts a message into a conversation thread
   */
  public static async postMessage(
    conversationId: string,
    senderRole: CompanyRole,
    content: string,
    messageType: AgentMessage['messageType'] = 'QUESTION'
  ): Promise<AgentMessage> {
    const conversation = inMemoryConversations.get(conversationId);
    const msg = await MessageService.sendMessage({
      projectId: conversation?.projectId,
      senderRole,
      messageType,
      content,
    });

    if (conversation) {
      conversation.messages.push(msg);
      if (!conversation.participants.includes(senderRole)) {
        conversation.participants.push(senderRole);
      }
    }

    return msg;
  }

  /**
   * Resolves a conversation and records decision in collaboration memory
   */
  public static async resolveConversation(
    conversationId: string,
    finalDecision: string,
    resolvedByRole: CompanyRole
  ): Promise<AgentConversationState | undefined> {
    const conversation = inMemoryConversations.get(conversationId);
    if (!conversation) return undefined;

    conversation.status = 'resolved';
    await this.postMessage(
      conversationId,
      resolvedByRole,
      `[RESOLVED]: ${finalDecision}`,
      'APPROVAL'
    );

    if (conversation.projectId) {
      await CollaborationMemoryService.recordDecision(
        conversation.projectId,
        conversation.topic,
        finalDecision,
        resolvedByRole
      );
    }

    return conversation;
  }

  /**
   * Retrieves active conversations for a project
   */
  public static async getConversations(projectId?: string): Promise<AgentConversationState[]> {
    const all = Array.from(inMemoryConversations.values());
    return projectId ? all.filter((c) => c.projectId === projectId) : all;
  }
}
