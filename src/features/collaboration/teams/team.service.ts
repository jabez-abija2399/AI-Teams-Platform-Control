import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';

export async function createTeam(organizationId: string, name: string, description?: string): Promise<ApiResult<{ id: string }>> {
  const team = await prisma.team.create({ data: { organizationId, name, description } });
  return { success: true, data: { id: team.id } };
}

export async function assignProjectToTeam(teamId: string, projectId: string): Promise<void> {
  await prisma.teamProject.create({ data: { teamId, projectId } });
}

export async function listTeamMembers(teamId: string) {
  return prisma.membership.findMany({
    where: { teamId },
    include: {
      user: { select: { name: true, avatar: true } },
      agent: { select: { name: true, role: true } },
    },
  });
}
