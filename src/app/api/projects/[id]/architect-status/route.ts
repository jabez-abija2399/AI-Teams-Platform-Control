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
    where: { projectId: id, type: { in: ['SYSTEM_ARCHITECTURE', 'DATABASE_DESIGN', 'API_SPECIFICATION'] } },
  });

  if (docs.length >= 3) {
    const architecture = docs.find((d) => d.type === 'SYSTEM_ARCHITECTURE');
    const database = docs.find((d) => d.type === 'DATABASE_DESIGN');
    const api = docs.find((d) => d.type === 'API_SPECIFICATION');
    if (architecture && database && api) {
      try {
        const analysis = { architecture: JSON.parse(architecture.content), database: JSON.parse(database.content), api: JSON.parse(api.content), decisions: [] };
        return NextResponse.json({ success: true, data: { exists: true, running: false, analysis } });
      } catch { /* fall through */ }
    }
  }

  const inProgress = await prisma.document.findFirst({ where: { projectId: id, type: 'ARCHITECT_IN_PROGRESS' } });
  if (inProgress) {
    return NextResponse.json({ success: true, data: { exists: false, running: true } });
  }

  return NextResponse.json({ success: true, data: { exists: false, running: false } });
}
