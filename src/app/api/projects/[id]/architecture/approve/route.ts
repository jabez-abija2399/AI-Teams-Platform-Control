import { NextResponse } from 'next/server';
import { ArchitectureApprovalService } from '@/core/architecture/architecture-approval.service';

export async function POST(
  request: Request,
  { params }: any
) {
  try {
    const projectId = params.id;
    const result = await ArchitectureApprovalService.approveArchitecture(projectId);

    return NextResponse.json({
      success: true,
      status: result.status,
      message: 'Architecture proposal approved successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to approve architecture proposal' },
      { status: 500 }
    );
  }
}
