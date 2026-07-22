import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }, { status: 401 });
  }

  const { id } = await params;

  const report = await prisma.qualityReport.findFirst({ where: { projectId: id }, orderBy: { createdAt: 'desc' } });

  if (report) {
    return NextResponse.json({
      success: true,
      data: { exists: true, running: false, score: report.score, issues: report.issues, recommendations: report.recommendations, testPlan: report.testPlan },
    });
  }

  const inProgress = await prisma.document.findFirst({ where: { projectId: id, type: 'QA_IN_PROGRESS' } });
  if (inProgress) {
    return NextResponse.json({ success: true, data: { exists: false, running: true } });
  }

  return NextResponse.json({ success: true, data: { exists: false, running: false } });
}
