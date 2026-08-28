import type { ApprovalRequest } from './types';
import type { AgentRole } from '@/packages/agents/core/agent.types';
import { getTaskManagementEngine } from './task.engine';
import { getProjectExecutionService } from './project.service';

const approvalStore = new Map<string, ApprovalRequest>();

export class ApprovalManagementService {
  async requestApproval(params: {
    id?: string;
    projectId: string;
    taskId: string;
    artifactId?: string;
    requestedBy: AgentRole;
    reason: string;
  }): Promise<ApprovalRequest> {
    const id = params.id ?? `appr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();

    const req: ApprovalRequest = {
      id,
      projectId: params.projectId,
      taskId: params.taskId,
      artifactId: params.artifactId,
      requestedBy: params.requestedBy,
      reason: params.reason,
      status: 'PENDING',
      date: now,
    };

    approvalStore.set(id, req);

    // Update task to WAITING_APPROVAL
    const taskEngine = getTaskManagementEngine();
    await taskEngine.updateTaskStatus(params.taskId, 'WAITING_APPROVAL', {
      approvalReason: params.reason,
    });

    // Update project to APPROVAL_REQUIRED
    const projectService = getProjectExecutionService();
    await projectService.updateProjectStatus(params.projectId, 'APPROVAL_REQUIRED');

    return req;
  }

  async approveRequest(approvalId: string, approvedBy: string): Promise<ApprovalRequest | undefined> {
    const req = approvalStore.get(approvalId);
    if (!req || req.status !== 'PENDING') return undefined;

    req.status = 'APPROVED';
    req.approvedBy = approvedBy;
    approvalStore.set(approvalId, req);

    // Unblock the task: mark as COMPLETED so dependent tasks in the queue can proceed!
    const taskEngine = getTaskManagementEngine();
    await taskEngine.updateTaskStatus(req.taskId, 'COMPLETED');

    // Resume project status to DEVELOPMENT
    const projectService = getProjectExecutionService();
    await projectService.updateProjectStatus(req.projectId, 'DEVELOPMENT');

    return req;
  }

  async rejectRequest(approvalId: string, rejectedBy: string, reason: string): Promise<ApprovalRequest | undefined> {
    const req = approvalStore.get(approvalId);
    if (!req || req.status !== 'PENDING') return undefined;

    req.status = 'REJECTED';
    req.approvedBy = rejectedBy; // store who rejected
    approvalStore.set(approvalId, req);

    // Mark task as FAILED due to rejection
    const taskEngine = getTaskManagementEngine();
    await taskEngine.updateTaskStatus(req.taskId, 'FAILED', {
      error: `Approval rejected by ${rejectedBy}: ${reason}`,
    });

    // Update project status to REVIEW or FAILED
    const projectService = getProjectExecutionService();
    await projectService.updateProjectStatus(req.projectId, 'REVIEW');

    return req;
  }

  async getPendingApprovals(projectId?: string): Promise<ApprovalRequest[]> {
    return Array.from(approvalStore.values()).filter(
      (r) => r.status === 'PENDING' && (!projectId || r.projectId === projectId),
    );
  }

  async getApprovalByTaskId(taskId: string): Promise<ApprovalRequest | undefined> {
    return Array.from(approvalStore.values()).find((r) => r.taskId === taskId);
  }

  async getApproval(id: string): Promise<ApprovalRequest | undefined> {
    return approvalStore.get(id);
  }

  async clearProjectApprovals(projectId: string): Promise<void> {
    for (const [id, req] of approvalStore.entries()) {
      if (req.projectId === projectId) {
        approvalStore.delete(id);
      }
    }
  }
}

let instance: ApprovalManagementService | null = null;
export function getApprovalManagementService(): ApprovalManagementService {
  if (!instance) {
    instance = new ApprovalManagementService();
  }
  return instance;
}
