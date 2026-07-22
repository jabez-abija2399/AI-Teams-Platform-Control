import { NextRequest, NextResponse } from 'next/server';
import { pullFromGitHub } from '@/features/git-integration/services/github.service';

export async function POST(req: NextRequest) {
  const { projectId, branch } = await req.json();
  if (!projectId) {
    return NextResponse.json({ success: false, error: 'projectId required' }, { status: 400 });
  }
  const result = await pullFromGitHub(projectId, branch);
  return NextResponse.json(result);
}
