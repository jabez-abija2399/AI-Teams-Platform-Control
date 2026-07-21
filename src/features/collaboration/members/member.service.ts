import { prisma } from '@/lib/prisma';
import type { MemberRole } from '../types/collaboration.types';
import type { ApiResult } from '@/types/common.types';

export async function inviteHumanMember(
  organizationId: string,
  userId: string,
  role: MemberRole,
  teamId?: string,
): Promise<ApiResult<null>> {
  const existing = await prisma.membership.findFirst({ where: { organizationId, userId } });
  if (existing) return { success: false, error: { message: 'User is already a member', code: 'ALREADY_MEMBER' } };

  await prisma.membership.create({ data: { organizationId, userId, teamId, type: 'HUMAN', role } });
  return { success: true, data: null };
}

export async function removeMember(membershipId: string): Promise<void> {
  await prisma.membership.delete({ where: { id: membershipId } });
}

export async function assignAgentToOrganization(
  organizationId: string,
  agentId: string,
  role: 'AI_MANAGER' | 'AI_WORKER' = 'AI_WORKER',
): Promise<ApiResult<null>> {
  const existing = await prisma.membership.findFirst({ where: { organizationId, agentId } });
  if (existing) return { success: false, error: { message: 'Agent already assigned', code: 'ALREADY_ASSIGNED' } };

  await prisma.membership.create({ data: { organizationId, agentId, type: 'AI_AGENT', role } });
  return { success: true, data: null };
}

export async function assignAgentToTeam(teamId: string, agentId: string): Promise<void> {
  const team = await prisma.team.findUniqueOrThrow({ where: { id: teamId } });
  const membership = await prisma.membership.findFirstOrThrow({
    where: { organizationId: team.organizationId, agentId },
  });
  await prisma.membership.update({ where: { id: membership.id }, data: { teamId } });
}
