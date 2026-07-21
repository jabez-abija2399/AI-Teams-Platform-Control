import type { Conversation, Message } from './message.types';
import {
  createConversation,
  getConversation,
  getProjectConversations,
  sendMessage,
  getConversationMessages,
} from './message.service';

export class ConversationManager {
  createConversation(projectId: string, title: string, workflowId?: string): Conversation {
    return createConversation(projectId, title, workflowId);
  }

  getConversation(id: string): Conversation | undefined {
    return getConversation(id);
  }

  getProjectConversations(projectId: string): Conversation[] {
    return getProjectConversations(projectId);
  }

  addMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    senderRole: string,
    content: string,
    metadata?: Record<string, unknown>,
  ): Message {
    return sendMessage(
      conversationId,
      senderId,
      senderName,
      senderRole,
      'agent',
      content,
      metadata,
    );
  }

  getMessages(conversationId: string, limit?: number): Message[] {
    return getConversationMessages(conversationId, limit);
  }
}

let conversationManagerInstance: ConversationManager | null = null;

export function getConversationManager(): ConversationManager {
  if (!conversationManagerInstance) {
    conversationManagerInstance = new ConversationManager();
  }
  return conversationManagerInstance;
}
