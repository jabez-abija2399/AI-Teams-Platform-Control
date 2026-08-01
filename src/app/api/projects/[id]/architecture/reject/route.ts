import { NextResponse } from 'next/server';
import { ArchitectureApprovalService } from '@/core/architecture/architecture-approval.service';

export async function POST(
  request: Request,
  { params }: any
) {
  try {
    const projectId = params.id;
    const result = await ArchitectureApprovalService.rejectArchitecture(projectId);

    return NextResponse.json({
      success: true,
      status: result.status,
      message: 'Architecture proposal rejected',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reject architecture proposal' },
      { status: 500 }
    );
  }
}
