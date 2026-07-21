import { prisma } from '@/lib/prisma';

export async function getOrganizationCost(organizationId: string, since: Date): Promise<number> {
  const result = await prisma.aIUsageLog.aggregate({
    where: {
      createdAt: { gte: since },
      project: {
        teamProjects: {
          some: {
            team: {
              organizationId,
            },
          },
        },
      },
    },
    _sum: { costUsd: true },
  });

  return result._sum.costUsd ?? 0;
}

export async function getProjectCost(projectId: string, since: Date): Promise<number> {
  const result = await prisma.aIUsageLog.aggregate({
    where: {
      projectId,
      createdAt: { gte: since },
    },
    _sum: { costUsd: true },
  });

  return result._sum.costUsd ?? 0;
}
