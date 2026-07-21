import { prisma } from '@/lib/prisma';

export async function requestApproval(workflowId: string, stepId: string, type: string): Promise<string> {
  const approval = await prisma.approvalRequest.create({
    data: { workflowId, stepId, type, status: 'PENDING' },
  });
  return approval.id;
}

export async function resolveApproval(approvalId: string, approved: boolean): Promise<void> {
  await prisma.approvalRequest.update({
    where: { id: approvalId },
    data: { status: approved ? 'APPROVED' : 'REJECTED' },
  });
}

export async function getPendingApprovals(workflowId: string) {
  return prisma.approvalRequest.findMany({
    where: { workflowId, status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
  });
}
