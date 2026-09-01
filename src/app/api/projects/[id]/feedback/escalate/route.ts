import { NextRequest, NextResponse } from 'next/server';
import { ControlledFeedbackEngine } from '@/core/feedback/controlled-feedback.engine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const result = await ControlledFeedbackEngine.getEscalations(projectId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: err?.message || 'Server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    const result = await ControlledFeedbackEngine.escalateFeedback({
      projectId,
      fromAgentRole: body.fromAgentRole,
      toAgentRole: body.toAgentRole,
      issueType: body.issueType,
      description: body.description,
      targetArtifactType: body.targetArtifactType,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: err?.message || 'Server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}
