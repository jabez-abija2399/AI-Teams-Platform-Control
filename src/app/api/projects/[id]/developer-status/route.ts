import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getBuildState } from '@/ai/agents/roles/developer/developer.service';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }, { status: 401 });
  }

  const { id } = await params;

  // Check in-memory build state first (fast path)
  const buildState = getBuildState(id);
  if (buildState) {
    return NextResponse.json({
      success: true,
      data: {
        exists: false,
        running: true,
        progress: buildState.progress,
      },
    });
  }

  // Fall back to DB for completed builds
  const doc = await prisma.document.findFirst({ where: { projectId: id, type: 'DEVELOPMENT_SUMMARY' } });

  if (doc) {
    const tasks = await prisma.developmentTask.findMany({ where: { projectId: id }, include: { codeChanges: true } });
    return NextResponse.json({
      success: true,
      data: {
        exists: true,
        running: false,
        summary: doc.content,
        taskCount: tasks.length,
        changeCount: tasks.reduce((sum, t) => sum + t.codeChanges.length, 0),
        files: [...new Set(tasks.flatMap((t) => t.codeChanges.map((c) => c.file)))],
      },
    });
  }

  return NextResponse.json({ success: true, data: { exists: false, running: false } });
}
