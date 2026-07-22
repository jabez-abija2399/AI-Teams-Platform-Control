import { NextRequest, NextResponse } from 'next/server';
import { createPullRequest } from '@/features/git-integration/services/github.service';

export async function POST(req: NextRequest) {
  const { projectId, title, body, head, base } = await req.json();
  if (!projectId || !title || !head) {
    return NextResponse.json({ success: false, error: 'projectId, title, head required' }, { status: 400 });
  }
  const result = await createPullRequest(projectId, title, body || '', head, base);
  return NextResponse.json(result);
}
