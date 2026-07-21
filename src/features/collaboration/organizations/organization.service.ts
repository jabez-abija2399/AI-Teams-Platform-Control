import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function createOrganization(ownerId: string, name: string): Promise<ApiResult<{ id: string }>> {
  const slug = slugify(name);
  const org = await prisma.organization.create({ data: { name, slug, ownerId } });
  await prisma.membership.create({
    data: { organizationId: org.id, userId: ownerId, type: 'HUMAN', role: 'OWNER' },
  });
  return { success: true, data: { id: org.id } };
}

export async function listUserOrganizations(userId: string) {
  return prisma.organization.findMany({
    where: { members: { some: { userId } } },
    include: { _count: { select: { teams: true, members: true } } },
  });
}

export async function getOrganizationMembers(organizationId: string) {
  return prisma.membership.findMany({
    where: { organizationId },
    include: {
      user: { select: { name: true, email: true, avatar: true } },
      agent: { select: { name: true, role: true } },
    },
  });
}
