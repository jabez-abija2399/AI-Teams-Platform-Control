import { generate } from '@/ai/services/ai.service';
import type { ApiResult } from '@/types/common.types';

export interface ConversationInfo {
  id: string;
  customerId: string;
  status: string;
  createdAt: Date;
}

export interface MessageInfo {
  id: string;
  conversationId: string;
  sender: string;
  content: string;
  createdAt: Date;
}

export async function startConversation(
  customerId: string,
): Promise<ApiResult<ConversationInfo>> {
  const { prisma } = await import('@/lib/prisma');

  const conversation = await prisma.supportConversation.create({
    data: { customerId, status: 'OPEN' },
  });

  return {
    success: true,
    data: {
      id: conversation.id,
      customerId: conversation.customerId,
      status: conversation.status,
      createdAt: conversation.createdAt,
    },
  };
}

async function searchRelevantKnowledge(
  projectId: string,
  query: string,
): Promise<string[]> {
  const { prisma } = await import('@/lib/prisma');

  const items = await prisma.knowledgeItem.findMany({
    where: {
      projectId,
      content: { contains: query, mode: 'insensitive' },
    },
    take: 5,
    orderBy: { createdAt: 'desc' },
  });

  return items.map((item) => item.content);
}

export async function respondToCustomer(
  projectId: string,
  conversationId: string,
  customerMessage: string,
): Promise<ApiResult<MessageInfo>> {
  const { prisma } = await import('@/lib/prisma');

  const conversation = await prisma.supportConversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    return {
      success: false,
      error: { message: 'Conversation not found', code: 'NOT_FOUND' },
    };
  }

  await prisma.supportMessage.create({
    data: {
      conversationId,
      sender: 'customer',
      content: customerMessage,
    },
  });

  const previousMessages = await prisma.supportMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });

  const knowledgeSnippets = await searchRelevantKnowledge(projectId, customerMessage);
  const knowledgeContext =
    knowledgeSnippets.length > 0
      ? `\n\nRelevant knowledge base entries:\n${knowledgeSnippets.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
      : '';

  const conversationHistory = previousMessages
    .map((m) => `${m.sender === 'customer' ? 'Customer' : 'Agent'}: ${m.content}`)
    .join('\n');

  const result = await generate(
    {
      messages: [
        {
          role: 'user',
          content: `You are a helpful customer support agent. Respond professionally and empathetically.\n\nConversation history:\n${conversationHistory}${knowledgeContext}`,
        },
      ],
      systemPrompt:
        'You are a senior customer support agent for a software platform. Be helpful, clear, and professional. If you reference knowledge base articles, do so naturally.',
      provider: 'gemini',
    },
    { projectId },
  );

  if (!result.success) {
    return {
      success: false,
      error: { message: result.error.message, code: result.error.code },
    };
  }

  const agentReply = result.data.content;

  const agentMessage = await prisma.supportMessage.create({
    data: {
      conversationId,
      sender: 'agent',
      content: agentReply,
    },
  });

  return {
    success: true,
    data: {
      id: agentMessage.id,
      conversationId: agentMessage.conversationId,
      sender: agentMessage.sender,
      content: agentMessage.content,
      createdAt: agentMessage.createdAt,
    },
  };
}
