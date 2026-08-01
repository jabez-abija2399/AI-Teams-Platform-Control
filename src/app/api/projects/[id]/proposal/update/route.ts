import { NextResponse } from 'next/server';
import { DiscoveryApprovalService } from '@/core/discovery/approval.service';

export async function POST(
  request: Request,
  { params }: any
) {
  try {
    const projectId = params.id;
    const body = await request.json();

    const result = await DiscoveryApprovalService.updateProposal(projectId, body);

    return NextResponse.json({
      success: true,
      proposal: result.proposal,
      score: result.score,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update proposal' },
      { status: 500 }
    );
  }
}
