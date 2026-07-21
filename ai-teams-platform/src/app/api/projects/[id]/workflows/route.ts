import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  listProjectWorkflows,
  startSoftwareProjectWorkflow,
} from '@/ai/workflows/execution/workflow.manager';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workflows = listProjectWorkflows(id);

  const progressData = workflows.map((wf) => ({
    workflowId: wf.id,
    status: wf.status,
    currentStep: wf.currentStepIndex,
    totalSteps: wf.steps.length,
    completedSteps: wf.steps.filter((s) => s.status === 'COMPLETED').length,
    failedSteps: wf.steps.filter((s) => s.status === 'FAILED').length,
    percentComplete: Math.round(
      (wf.steps.filter((s) => s.status === 'COMPLETED').length / wf.steps.length) * 100,
    ),
    steps: wf.steps.map((s) => ({
      name: s.name,
      status: s.status,
      agentRole: s.agentRole,
      output: s.output,
      error: s.error,
    })),
  }));

  return NextResponse.json({ workflows: progressData });
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
