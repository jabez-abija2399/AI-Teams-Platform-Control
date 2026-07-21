import { prisma } from '@/lib/prisma';

export async function createNotification(userId: string, type: string, message: string, link?: string): Promise<void> {
  await prisma.notification.create({ data: { userId, type, message, link } });
}

export async function markRead(notificationId: string): Promise<void> {
  await prisma.notification.update({ where: { id: notificationId }, data: { read: true } });
}

export async function listNotifications(userId: string, unreadOnly = false) {
  return prisma.notification.findMany({
    where: { userId, ...(unreadOnly ? { read: false } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
