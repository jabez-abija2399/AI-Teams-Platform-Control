import { NextResponse } from 'next/server';
import { ExecutivePlanner } from '@/core/executive/executive-planner';
import { ParallelExecutionEngine } from '@/core/autonomous/parallel-execution.engine';

export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const projectId = params.id;
    const { tasks } = await ExecutivePlanner.planProjectWork(projectId);
    const activeWorkers = ParallelExecutionEngine.getActiveWorkers();

    return NextResponse.json({
      success: true,
      queue: tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress'),
      activeWorkers,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch execution queue' },
      { status: 500 }
    );
  }
}
