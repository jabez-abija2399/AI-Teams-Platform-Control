import { NextResponse } from 'next/server';
import { CollaborationStreamService } from '@/features/collaboration/services/collaboration-stream.service';

export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const projectId = params.id;
    const stream = await CollaborationStreamService.getLiveCollaborationFeed(projectId);

    return NextResponse.json({
      success: true,
      stream,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch collaboration stream' },
      { status: 500 }
    );
  }
}
