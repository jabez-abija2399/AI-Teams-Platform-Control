import { NextResponse } from 'next/server';
import {
  acceptAllPendingFiles,
  reviewWorkspaceFile,
} from '@/features/workspace/explorer/services/workspace-sync.service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  let body: { path?: string; action?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const action = body.action;
  if (action === 'accept-all') {
    const { count } = await acceptAllPendingFiles(projectId);
    return NextResponse.json({ success: true, data: { count } });
  }

  if ((action === 'accept' || action === 'reject') && body.path) {
    const result = await reviewWorkspaceFile(projectId, body.path, action);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.message }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: result });
  }

  return NextResponse.json(
    { success: false, error: 'Expected action accept|reject|accept-all' },
    { status: 400 },
  );
}
