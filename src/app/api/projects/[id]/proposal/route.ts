import { NextResponse } from 'next/server';
import { DiscoveryApprovalService } from '@/core/discovery/approval.service';

export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const projectId = params.id;
    const result = await DiscoveryApprovalService.getProposal(projectId);

    if (!result) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        proposal: result.proposal,
        score: result.score,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch proposal' },
      { status: 500 }
    );
  }
}
