import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { cancelBuild, getBuildState } from '@/ai/agents/roles/developer/developer.service';

interface Params {
  params: Promise<{ projectId: string }>;
}

export async function POST(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }, { status: 401 });
  }

  const { projectId } = await params;

  const state = getBuildState(projectId);
  if (!state) {
    return NextResponse.json({ success: false, error: { message: 'No active build to cancel', code: 'NOT_FOUND' } }, { status: 404 });
  }

  const cancelled = cancelBuild(projectId);
  return NextResponse.json({
    success: cancelled,
    data: { cancelled },
  });
}
