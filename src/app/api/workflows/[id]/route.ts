import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getWorkflowById,
  getWorkflowProgressById,
  pauseWorkflowById,
  resumeWorkflowById,
  cancelWorkflowById,
} from '@/ai/workflows/execution/workflow.manager';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const progress = getWorkflowProgressById(id);

  if (!progress) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }

  return NextResponse.json({ workflow: progress });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as { action: string };

  const workflow = getWorkflowById(id);
  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }

  switch (body.action) {
    case 'pause':
      pauseWorkflowById(id);
      break;
    case 'resume':
      resumeWorkflowById(id);
      break;
    case 'cancel':
      cancelWorkflowById(id);
      break;
    default:
      return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
