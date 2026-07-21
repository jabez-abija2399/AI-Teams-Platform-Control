import { prisma } from '@/lib/prisma';
import { createNotification } from '../notifications/notification.service';

const MENTION_PATTERN = /@([\w\s]+?)(?=[\s.,!?]|$)/g;

export async function createComment(
  authorType: 'HUMAN' | 'AI_AGENT',
  authorId: string,
  targetType: string,
  targetId: string,
  content: string,
): Promise<{ id: string }> {
  const comment = await prisma.comment.create({
    data: { authorType, authorId, targetType, targetId, content },
  });

  const mentions = [...content.matchAll(MENTION_PATTERN)].map((m) => m[1]?.trim()).filter(Boolean);
  for (const name of mentions) {
    if (!name) continue;
    const agent = await prisma.agent.findFirst({
      where: { name: { contains: name, mode: 'insensitive' } },
    });
    if (agent) {
      await prisma.mention.create({
        data: { commentId: comment.id, targetType: 'AGENT', targetId: agent.id },
      });
    } else {
      const user = await prisma.user.findFirst({
        where: { name: { contains: name, mode: 'insensitive' } },
      });
      if (user) {
        await prisma.mention.create({
          data: { commentId: comment.id, targetType: 'USER', targetId: user.id },
        });
        await createNotification(user.id, 'MENTION', `You were mentioned: "${content.slice(0, 80)}"`);
      }
    }
  }

  return { id: comment.id };
}

export async function getComments(targetType: string, targetId: string) {
  return prisma.comment.findMany({
    where: { targetType, targetId },
    orderBy: { createdAt: 'asc' },
  });
}
