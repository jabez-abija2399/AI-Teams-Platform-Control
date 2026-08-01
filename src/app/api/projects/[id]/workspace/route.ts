import { NextRequest, NextResponse } from 'next/server';
import { WorkspaceService } from '@/core/workspace/workspace.service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const state = WorkspaceService.getWorkspaceState(projectId);

    return NextResponse.json({
      success: true,
      state,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch workspace state' },
      { status: 500 }
    );
  }
}
