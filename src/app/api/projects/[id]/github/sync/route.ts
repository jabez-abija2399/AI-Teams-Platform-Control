import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pushCodeToGitHub } from '@/lib/github/git-sync';

const githubSyncSchema = z.object({
  accessToken: z.string().min(1, 'accessToken is required'),
  repoOwner: z.string().min(1, 'repoOwner is required'),
  repoName: z.string().min(1, 'repoName is required'),
  branch: z.string().default('main'),
  commitMessage: z.string().default('Update project code via AI Teams Platform'),
  files: z.record(z.string(), z.string()),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await req.json();
    const validation = githubSyncSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid GitHub sync payload', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { accessToken, repoOwner, repoName, branch, commitMessage, files } = validation.data;

    const commitSha = await pushCodeToGitHub(
      accessToken,
      repoOwner,
      repoName,
      branch,
      files,
      commitMessage
    );

    return NextResponse.json({
      success: true,
      projectId,
      commitSha,
      repoUrl: `https://github.com/${repoOwner}/${repoName}/commit/${commitSha}`,
    });
  } catch (error) {
    console.error('[API GitHub Sync] POST Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'GitHub sync failed' },
      { status: 500 }
    );
  }
}
