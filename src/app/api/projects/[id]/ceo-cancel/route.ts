import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unauthorizedResponse } from '@/lib/api-response';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id: projectId } = await params;

  await prisma.document.deleteMany({
    where: { projectId, type: 'CEO_IN_PROGRESS' },
  });

  return NextResponse.json({ success: true, data: { cancelled: true } });
}
