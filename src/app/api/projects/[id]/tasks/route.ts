import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createTask, listTasks } from '@/features/projects/services/task.service';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';

interface Params {
  params: Promise<{ id: string }>;
}

import { ExecutionStateService } from '@/core/integration/execution-state.service';

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  
  const state = ExecutionStateService.getState(id);
  const currentPhase = state.currentPhase;
  
  const tasksDef = [
    { id: 't1', title: 'Define Product Requirements', phase: 'PLANNING', assignedRole: 'PRODUCT_MANAGER' },
    { id: 't2', title: 'Design System Architecture', phase: 'ARCHITECTURE', assignedRole: 'ARCHITECT' },
    { id: 't3', title: 'Create UI/UX Design System', phase: 'DESIGN', assignedRole: 'UI_DESIGNER' },
    { id: 't4', title: 'Implement Architecture', phase: 'EXECUTION', assignedRole: 'DEVELOPER' },
    { id: 't5', title: 'Debate Code Implementation', phase: 'DEBATE', assignedRole: 'ARCHITECT' }
  ];

  let currentStepIndex = tasksDef.findIndex(t => t.phase === currentPhase);
  if (currentPhase === 'COMPLETED' || currentPhase === 'DEPLOYMENT_READY') {
    currentStepIndex = tasksDef.length;
  } else if (currentStepIndex === -1) {
    currentStepIndex = 0;
  }

  const tasks = tasksDef.map((t, i) => {
    let tStatus = 'TODO';
    if (i < currentStepIndex) tStatus = 'DONE';
    else if (i === currentStepIndex) {
      if (state.executionHealth === 'PAUSED') tStatus = 'BLOCKED';
      else if (state.executionHealth === 'FAILED') tStatus = 'BLOCKED';
      else tStatus = 'IN_PROGRESS';
    }
    
    return {
      id: t.id,
      title: t.title,
      status: tStatus,
      assignedRole: t.assignedRole,
      priority: 'HIGH'
    };
  });

  return NextResponse.json({
    success: true,
    tasks // return tasks directly to fix the UI task-board bug
  });
}

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  const body = await request.json();
  const result = await createTask(id, session.user.id, body);
  return toResponse(result, 201);
}
