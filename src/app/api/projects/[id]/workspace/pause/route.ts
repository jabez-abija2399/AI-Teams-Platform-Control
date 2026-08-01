import { NextResponse } from 'next/server';
import { WorkspaceService } from '@/core/workspace/workspace.service';

export async function POST(
  request: Request,
  { params }: any
) {
  try {
    const projectId = params.id;
    const isPaused = WorkspaceService.togglePause(projectId);

    return NextResponse.json({
      success: true,
      isPaused,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to toggle pause' },
      { status: 500 }
    );
  }
}
