import { NextResponse } from 'next/server';
import { ExecutivePlanner } from '@/core/executive/executive-planner';

export async function POST(
  request: Request,
  { params }: any
) {
  try {
    const projectId = params.id;
    const body = await request.json();

    const plan = await ExecutivePlanner.replan(projectId, body.reason || 'Requirement adjustment');

    return NextResponse.json({
      success: true,
      milestones: plan.milestones,
      workPackages: plan.workPackages,
      tasks: plan.tasks,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute replanning' },
      { status: 500 }
    );
  }
}
