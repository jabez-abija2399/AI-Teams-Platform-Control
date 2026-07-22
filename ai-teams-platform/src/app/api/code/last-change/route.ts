import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();
  const projectId = new URL(request.url).searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json(
      { success: false, error: { message: 'projectId required', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const lastChange = await prisma.codeGenerationRecord.findFirst({
    where: { task: { projectId } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ success: true, data: lastChange });
}
