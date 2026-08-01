import { NextResponse } from 'next/server';
import { ArchitectureApprovalService } from '@/core/architecture/architecture-approval.service';

export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const projectId = params.id;
    const result = await ArchitectureApprovalService.getArchitectureProposal(projectId);

    if (!result) {
      return NextResponse.json({ error: 'Architecture proposal not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      proposal: result.proposal,
      approved: result.approved,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch architecture proposal' },
      { status: 500 }
    );
  }
}
