import { NextResponse } from 'next/server';
import { ArchitectureApprovalService } from '@/core/architecture/architecture-approval.service';

export async function POST(
  request: Request,
  { params }: any
) {
  try {
    const projectId = params.id;
    const body = await request.json();

    const result = await ArchitectureApprovalService.updateArchitecture(projectId, body);

    return NextResponse.json({
      success: true,
      proposal: result.proposal,
      scores: result.scores,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update architecture proposal' },
      { status: 500 }
    );
  }
}
