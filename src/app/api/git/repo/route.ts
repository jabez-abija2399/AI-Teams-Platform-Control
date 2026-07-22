import { NextRequest, NextResponse } from 'next/server';
import {
  createRemoteRepo,
  linkExistingRepo,
  listRemoteRepos,
} from '@/features/git-integration/services/github.service';

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ success: false, error: 'projectId required' }, { status: 400 });
  }
  const result = await listRemoteRepos(projectId);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { projectId, name, description, private: isPrivate, repoFullName } = await req.json();
  if (!projectId) {
    return NextResponse.json({ success: false, error: 'projectId required' }, { status: 400 });
  }

  if (repoFullName) {
    const result = await linkExistingRepo(projectId, repoFullName);
    return NextResponse.json(result);
  }

  if (!name) {
    return NextResponse.json({ success: false, error: 'repo name required' }, { status: 400 });
  }

  const result = await createRemoteRepo(projectId, { name, description, private: isPrivate });
  return NextResponse.json(result);
}
