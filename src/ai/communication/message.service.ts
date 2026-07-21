import type { Message, Conversation, MessageType } from './message.types';

const messageStore = new Map<string, Message>();
const conversationStore = new Map<string, Conversation>();

export function createConversation(
  projectId: string,
  title: string,
  workflowId?: string,
): Conversation {
  const conversation: Conversation = {
    id: crypto.randomUUID(),
    projectId,
    workflowId,
    title,
    participants: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  conversationStore.set(conversation.id, conversation);
  return conversation;
}

export function getConversation(id: string): Conversation | undefined {
  return conversationStore.get(id);
}

export function getProjectConversations(projectId: string): Conversation[] {
  return Array.from(conversationStore.values()).filter((c) => c.projectId === projectId);
}

export function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  senderRole: string,
  type: MessageType,
  content: string,
  metadata?: Record<string, unknown>,
): Message {
  const message: Message = {
    id: crypto.randomUUID(),
    conversationId,
    senderId,
    senderName,
    senderRole,
    type,
    content,
    metadata,
    createdAt: new Date(),
  };
  messageStore.set(message.id, message);

  const conversation = conversationStore.get(conversationId);
  if (conversation) {
    conversation.updatedAt = new Date();
    if (!conversation.participants.includes(senderId)) {
      conversation.participants.push(senderId);
    }
  }

  return message;
}

export function getConversationMessages(conversationId: string, limit = 50): Message[] {
  return Array.from(messageStore.values())
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .slice(-limit);
}
