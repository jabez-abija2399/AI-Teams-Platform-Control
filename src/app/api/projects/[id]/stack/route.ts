import { NextResponse } from 'next/server';
import {
  clearProjectStackConfirmation,
  confirmProjectStack,
  getProjectStackState,
  requestArchitectureRegenForStack,
} from '@/core/project-stack/project-stack.service';
import type { ProjectStackId } from '@/core/project-stack/stack-catalog';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const state = await getProjectStackState(projectId);
  return NextResponse.json({ success: true, data: state });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  let body: {
    stack?: string;
    action?: string;
    regenerateArchitecture?: boolean;
  } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.action === 'clear') {
    const state = await clearProjectStackConfirmation(projectId);
    return NextResponse.json({ success: true, data: state });
  }

  const stack = body.stack as ProjectStackId | undefined;
  if (!stack || !['static-html', 'react', 'nextjs'].includes(stack)) {
    return NextResponse.json(
      { success: false, error: 'stack must be static-html | react | nextjs' },
      { status: 400 },
    );
  }

  const state = await confirmProjectStack(projectId, stack);

  let architectureRegen: { success: boolean; message: string } | null = null;
  const stackChanged =
    state.previousStack != null && state.previousStack !== stack;
  if (body.regenerateArchitecture && (stackChanged || body.regenerateArchitecture === true)) {
    architectureRegen = await requestArchitectureRegenForStack(projectId, stack);
  }

  return NextResponse.json({
    success: true,
    data: {
      ...state,
      stackChanged,
      architectureRegen,
    },
  });
}
