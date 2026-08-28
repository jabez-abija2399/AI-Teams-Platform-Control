import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  listProjectWorkflows,
  startSoftwareProjectWorkflow,
} from '@/ai/workflows/execution/workflow.manager';

import { ExecutionStateService } from '@/core/integration/execution-state.service';
import { ApiResponseSchema } from '@/packages/schema';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const state = ExecutionStateService.getState(id);
  const currentPhase = state.currentPhase;
  
  const stepsDef = [
    { name: 'Planning', phase: 'PLANNING', agentRole: 'PRODUCT_MANAGER' },
    { name: 'Architecture', phase: 'ARCHITECTURE', agentRole: 'ARCHITECT' },
    { name: 'UI Design', phase: 'DESIGN', agentRole: 'UI_DESIGNER' },
    { name: 'Execution', phase: 'EXECUTION', agentRole: 'DEVELOPER' },
    { name: 'Code Debate', phase: 'DEBATE', agentRole: 'ARCHITECT' }
  ];

  let currentStepIndex = stepsDef.findIndex(s => s.phase === currentPhase);
  if (currentPhase === 'COMPLETED' || currentPhase === 'DEPLOYMENT_READY') {
    currentStepIndex = stepsDef.length;
  } else if (currentStepIndex === -1) {
    currentStepIndex = 0;
  }

  const steps = stepsDef.map((s, i) => {
    let sStatus = 'PENDING';
    if (i < currentStepIndex) sStatus = 'COMPLETED';
    else if (i === currentStepIndex) {
      if (state.executionHealth === 'PAUSED') sStatus = 'PAUSED';
      else if (state.executionHealth === 'FAILED') sStatus = 'FAILED';
      else sStatus = 'RUNNING';
    }
    return {
      name: s.name,
      status: sStatus,
      agentRole: s.agentRole,
      output: {},
      error: undefined
    };
  });

  const progressData = [{
    workflowId: `pipe_${id}`,
    status: state.currentPhase === 'COMPLETED' ? 'COMPLETED' : state.executionHealth,
    currentStep: currentStepIndex,
    totalSteps: steps.length,
    percentComplete: Math.round((currentStepIndex / steps.length) * 100),
    steps
  }];

  // Validate the data against our strict Zod schema before sending it to the client.
  // This guarantees the frontend will never crash due to unexpected backend data shapes.
  const validatedResponse = ApiResponseSchema.parse({ workflows: progressData });

  return NextResponse.json(validatedResponse);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as {
    projectName?: string;
    input?: string;
  };

  const workflow = startSoftwareProjectWorkflow(
    id,
    body.projectName ?? 'Project',
    body.input ?? '',
  );

  return NextResponse.json({ workflow }, { status: 201 });
}
