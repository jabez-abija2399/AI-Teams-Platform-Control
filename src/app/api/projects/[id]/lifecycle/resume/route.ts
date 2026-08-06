import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { ProjectLifecycleService } from '@/core/company-orchestration';
import type { ApprovalGateType } from '@/core/company-orchestration/types';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  let approvalType: ApprovalGateType | undefined;
  let status: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED' = 'APPROVED';
  let reviewedBy: string = session.user.name || session.user.email || 'Executive Reviewer';
  let comments: string | undefined;

  try {
    const body = await request.json();
    if (body) {
      approvalType = body.approvalType;
      if (
        body.status === 'REJECTED' ||
        body.status === 'APPROVED' ||
        body.status === 'CHANGES_REQUESTED'
      ) {
        status = body.status;
      }
      if (body.action === 'request_changes') status = 'CHANGES_REQUESTED';
      if (body.reviewedBy) reviewedBy = body.reviewedBy;
      comments = body.comments;
    }
  } catch {
    // Optional body
  }

  if ((status === 'REJECTED' || status === 'CHANGES_REQUESTED') && !approvalType) {
    return toResponse({
      success: false,
      error: {
        message: 'approvalType is required when rejecting or requesting changes',
        code: 'VALIDATION_ERROR',
      },
    });
  }

  const result = await ProjectLifecycleService.resumeLifecycle(
    id,
    approvalType,
    status,
    reviewedBy,
    comments,
  );
  return toResponse(result);
}
