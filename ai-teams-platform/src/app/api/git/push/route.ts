import { NextRequest, NextResponse } from 'next/server';
import { pushToGitHub } from '@/features/git-integration/services/github.service';

export async function POST(req: NextRequest) {
  const { projectId, message, branch } = await req.json();
  if (!projectId || !message) {
    return NextResponse.json({ success: false, error: 'projectId and message required' }, { status: 400 });
  }
  const result = await pushToGitHub(projectId, message, branch);
  return NextResponse.json(result);
}
