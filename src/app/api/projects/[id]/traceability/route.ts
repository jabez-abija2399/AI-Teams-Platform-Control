import { NextRequest, NextResponse } from 'next/server';
import { TraceabilityService } from '@/core/traceability/traceability.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    if (!projectId) {
      return NextResponse.json({ success: false, error: { message: 'Project ID required' } }, { status: 400 });
    }

    const result = await TraceabilityService.getMatrix(projectId);
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

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

    if (body.type === 'ADR') {
      const res = await TraceabilityService.recordADR({
        projectId,
        title: body.title,
        decision: body.decision,
        reason: body.reason,
        alternatives: body.alternatives,
      });
      return NextResponse.json(res);
    } else if (body.type === 'DES') {
      const res = await TraceabilityService.recordDES({
        projectId,
        title: body.title,
        decision: body.decision,
        reason: body.reason,
        alternatives: body.alternatives,
      });
      return NextResponse.json(res);
    } else {
      const res = await TraceabilityService.registerRequirement({
        projectId,
        requirementId: body.requirementId,
        title: body.title,
        ceoSpecVersion: body.ceoSpecVersion,
        architectAdrId: body.architectAdrId,
        designerDesId: body.designerDesId,
        sourceFiles: body.sourceFiles,
        testCases: body.testCases,
        verificationStatus: body.verificationStatus,
      });
      return NextResponse.json(res);
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: err?.message || 'Server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}
