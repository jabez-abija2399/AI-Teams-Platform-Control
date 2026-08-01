import { NextResponse } from 'next/server';
import { ExecutiveDashboardService } from '@/features/analytics/services/executive-dashboard.service';

export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const projectId = params.id;
    const report = await ExecutiveDashboardService.generateExecutiveReport(projectId);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate executive report' },
      { status: 500 }
    );
  }
}
