import { NextResponse } from 'next/server';
import { ActivityService } from '@/core/workspace/activity.service';

export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const projectId = params.id;
    const activities = ActivityService.getActivityFeed(projectId);

    return NextResponse.json({
      success: true,
      activities,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch activity feed' },
      { status: 500 }
    );
  }
}
