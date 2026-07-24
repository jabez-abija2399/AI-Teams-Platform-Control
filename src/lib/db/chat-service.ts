import { prisma } from '@/lib/prisma';

export interface ChatMessageRecord {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  metadata?: any;
  createdAt: Date;
}

/**
 * Persists an array of agent/user conversation messages into the database.
 */
export async function saveAgentConversation(
  sessionId: string,
  messages: Array<{ role: string; content: string; metadata?: any }>
): Promise<void> {
  if (messages.length === 0) return;

  await prisma.$transaction(
    messages.map((m) =>
      prisma.chatMessage.create({
        data: {
          sessionId,
          role: m.role,
          content: m.content,
          metadata: m.metadata || null,
        },
      })
    )
  );
}

/**
 * Retrieves conversation history for a given agent session ordered chronologically.
 */
export async function getAgentConversation(sessionId: string): Promise<ChatMessageRecord[]> {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });

  return messages.map((m) => ({
    id: m.id,
    sessionId: m.sessionId,
    role: m.role,
    content: m.content,
    metadata: m.metadata || undefined,
    createdAt: m.createdAt,
  }));
}
