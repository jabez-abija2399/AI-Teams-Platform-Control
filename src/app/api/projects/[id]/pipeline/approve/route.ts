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
    const { approvalType, action = 'approve', comments } = body as {
      approvalType?: string;
      action?: 'approve' | 'request_changes';
      comments?: string;
    };

    if (!approvalType) {
      return NextResponse.json(
        { success: false, error: { message: 'approvalType is required', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      );
    }

    const reviewedBy = session.user.name || session.user.email || session.user.id;

    if (action === 'request_changes') {
      const feedback = typeof comments === 'string' ? comments.trim() : '';
      if (feedback.length < 3) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Please add a short comment describing what to change.',
              code: 'FEEDBACK_REQUIRED',
            },
          },
          { status: 400 },
        );
      }

      const result = await ProjectLifecycleService.resumeLifecycle(
        projectId,
        approvalType as any,
        'CHANGES_REQUESTED',
        reviewedBy,
        feedback,
      );

      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        data: { regenerating: true, approvalType },
      });
    }

    const result = await ProjectLifecycleService.resumeLifecycle(
      projectId,
      approvalType as any,
      'APPROVED',
      reviewedBy,
      comments || `Approved by ${reviewedBy}`,
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
