import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ProjectLifecycleService } from '@/core/company-orchestration/project-lifecycle.service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      );
    }

    const { id: projectId } = await params;
    const body = await request.json().catch(() => ({}));
    const { approvalType } = body;

    if (!approvalType) {
      return NextResponse.json(
        { success: false, error: { message: 'approvalType is required', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      );
    }

    const result = await ProjectLifecycleService.resumeLifecycle(
      projectId,
      approvalType,
      'APPROVED',
      session.user.id,
      `Approved by ${session.user.name || 'User'}`,
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({ success: true, data: { approved: true, approvalType } });
  } catch (error: any) {
    console.error('[Pipeline Approve] Error:', error);
    return NextResponse.json(
      { success: false, error: { message: error?.message || 'Failed to approve', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}
