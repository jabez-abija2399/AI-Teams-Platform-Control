import { NextResponse } from 'next/server';
import { ExecutivePlanner } from '@/core/executive/executive-planner';

export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const projectId = params.id;
    const plan = await ExecutivePlanner.planProjectWork(projectId);

    return NextResponse.json({
      success: true,
      milestones: plan.milestones,
      workPackages: plan.workPackages,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch milestones' },
      { status: 500 }
    );
  }
}
