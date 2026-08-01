import { NextResponse } from 'next/server';
import { ExecutionScheduler } from '@/core/autonomous/execution-scheduler';

export async function POST(
  request: Request,
  { params }: any
) {
  try {
    const projectId = params.id;
    const status = await ExecutionScheduler.tick(projectId);

    return NextResponse.json({
      success: true,
      message: 'Autonomous scheduler tick executed successfully',
      status,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to dispatch tasks' },
      { status: 500 }
    );
  }
}
