import { NextResponse } from 'next/server';
import { ExecutionTimelineService } from '@/core/autonomous/execution-timeline.service';

export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const projectId = params.id;
    const timeline = ExecutionTimelineService.getTimeline(projectId);

    return NextResponse.json({
      success: true,
      timeline,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch execution timeline' },
      { status: 500 }
    );
  }
}
