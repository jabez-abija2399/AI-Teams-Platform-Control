import { NextRequest, NextResponse } from 'next/server';
import { connectGitHub, getIntegration, disconnectGitHub } from '@/features/git-integration/services/github.service';

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ success: false, error: 'projectId required' }, { status: 400 });
  }
  const result = await getIntegration(projectId);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { projectId, code } = await req.json();
  if (!projectId || !code) {
    return NextResponse.json({ success: false, error: 'projectId and code required' }, { status: 400 });
  }
  const result = await connectGitHub(projectId, code);
  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ success: false, error: 'projectId required' }, { status: 400 });
  }
  const result = await disconnectGitHub(projectId);
  return NextResponse.json(result);
}
