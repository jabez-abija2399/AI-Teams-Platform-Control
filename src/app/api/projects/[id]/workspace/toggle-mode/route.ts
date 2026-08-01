import { NextResponse } from 'next/server';
import { WorkspaceService } from '@/core/workspace/workspace.service';

export async function POST(
  request: Request,
  { params }: any
) {
  try {
    const projectId = params.id;
    const newMode = WorkspaceService.toggleMode(projectId);

    return NextResponse.json({
      success: true,
      mode: newMode,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to toggle mode' },
      { status: 500 }
    );
  }
}
