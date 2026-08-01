import { NextResponse } from 'next/server';
import { DiscoveryApprovalService } from '@/core/discovery/approval.service';

export async function POST(
  request: Request,
  { params }: any
) {
  try {
    const projectId = params.id;
    const result = await DiscoveryApprovalService.approveProject(projectId);

    return NextResponse.json({
      success: true,
      status: result.status,
      message: 'Product proposal approved successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to approve proposal' },
      { status: 500 }
    );
  }
}
