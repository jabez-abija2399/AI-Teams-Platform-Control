export type MessageType = 'user' | 'agent' | 'system' | 'task-result';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  type: MessageType;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  projectId: string;
  workflowId?: string;
  title: string;
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
}
