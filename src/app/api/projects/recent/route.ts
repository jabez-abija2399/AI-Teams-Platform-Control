import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unauthorizedResponse } from '@/lib/api-response';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const projects = await prisma.project.findMany({
    where: { ownerId: session.user.id, status: { not: 'ARCHIVED' } },
    include: { _count: { select: { tasks: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json({ success: true, data: projects });
}
