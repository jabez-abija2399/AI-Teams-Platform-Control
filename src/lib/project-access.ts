import { prisma } from './prisma';

export async function checkProjectAccess(
  projectId: string,
  userId: string,
): Promise<{ hasAccess: boolean; role?: string }> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, organizationId: true },
  });

  if (!project) {
    return { hasAccess: false };
  }

  if (project.ownerId === userId) {
    return { hasAccess: true, role: 'owner' };
  }

  if (project.organizationId) {
    const membership = await prisma.membership.findFirst({
      where: {
        organizationId: project.organizationId,
        userId,
      },
      select: { role: true },
    });

    if (membership) {
      return { hasAccess: true, role: membership.role };
    }
  }

  return { hasAccess: false };
}