import { prisma } from '@/lib/prisma';

export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      createdAt: true,
    },
  });
}

export async function updateUserProfile(userId: string, data: { name?: string; avatar?: string }) {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}
