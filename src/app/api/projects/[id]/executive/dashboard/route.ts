import { NextResponse } from 'next/server';
import { ExecutiveDashboardService } from '@/core/executive/executive-dashboard';

export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const projectId = params.id;
    const dashboard = await ExecutiveDashboardService.getDashboardData(projectId);

    return NextResponse.json({
      success: true,
      dashboard,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch executive dashboard' },
      { status: 500 }
    );
  }
}
