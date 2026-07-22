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

  const docs = await prisma.document.findMany({
    where: { projectId: id, type: { in: ['VISION', 'REQUIREMENTS', 'PLAN'] } },
  });

  if (docs.length >= 3) {
    const vision = docs.find((d) => d.type === 'VISION');
    const requirements = docs.find((d) => d.type === 'REQUIREMENTS');
    const plan = docs.find((d) => d.type === 'PLAN');
    if (vision && requirements && plan) {
      try {
        const analysis = { vision: JSON.parse(vision.content), requirements: JSON.parse(requirements.content), plan: JSON.parse(plan.content) };
        return NextResponse.json({ success: true, data: { exists: true, running: false, analysis } });
      } catch { /* fall through */ }
    }
  }

  const inProgress = await prisma.document.findFirst({ where: { projectId: id, type: 'CEO_IN_PROGRESS' } });
  if (inProgress) {
    return NextResponse.json({ success: true, data: { exists: false, running: true } });
  }

  return NextResponse.json({ success: true, data: { exists: false, running: false } });
}
