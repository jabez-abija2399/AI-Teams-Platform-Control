import { prisma } from '@/lib/prisma';

export async function getDashboardStats(userId: string) {
  const [totalProjects, activeProjects, totalTasks, recentActivity] = await Promise.all([
    prisma.project.count({ where: { ownerId: userId } }),
    prisma.project.count({
      where: { ownerId: userId, status: 'IN_PROGRESS' },
    }),
    prisma.task.count({
      where: { project: { ownerId: userId } },
    }),
    prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return {
    totalProjects,
    activeProjects,
    totalTasks,
    recentActivity,
  };
}

export async function getRecentProjects(userId: string) {
  return prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: 'desc' },
    take: 6,
  });
}
