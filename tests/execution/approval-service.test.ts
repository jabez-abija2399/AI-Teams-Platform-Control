import { describe, it, expect, beforeEach } from 'vitest';
import { ApprovalManagementService } from '../../src/core/execution-engine/approval.service';
import { TaskManagementEngine } from '../../src/core/execution-engine/task.engine';
import { ProjectExecutionService } from '../../src/core/execution-engine/project.service';

describe('Phase 16 — Approval Management Service', () => {
  let approvalService: ApprovalManagementService;
  let taskEngine: TaskManagementEngine;
  let projectService: ProjectExecutionService;

  beforeEach(() => {
    approvalService = new ApprovalManagementService();
    taskEngine = new TaskManagementEngine();
    projectService = new ProjectExecutionService();
  });

  it('should create approval request and block task until approved', async () => {
    const project = await projectService.createProject({
      owner: 'user-1',
      name: 'Test',
      description: 'Test project',
    });

    const task = await taskEngine.createTask({
      projectId: project.id,
      agentRole: 'ARCHITECT',
      description: 'Design architecture',
      requiresApproval: true,
    });

    const approval = await approvalService.requestApproval({
      projectId: project.id,
      taskId: task.id,
      requestedBy: 'ARCHITECT',
      reason: 'Architecture document requires human review',
    });

    expect(approval.status).toBe('PENDING');

    // Task should be WAITING_APPROVAL
    const updatedTask = await taskEngine.getTask(task.id);
    expect(updatedTask?.status).toBe('WAITING_APPROVAL');

    // Approve
    const approved = await approvalService.approveRequest(approval.id, 'admin-user');
    expect(approved?.status).toBe('APPROVED');
    expect(approved?.approvedBy).toBe('admin-user');
  });

  it('should reject approval and mark task as FAILED', async () => {
    const project = await projectService.createProject({
      owner: 'user-1',
      name: 'Test',
      description: 'Test project',
    });

    const task = await taskEngine.createTask({
      projectId: project.id,
      agentRole: 'DEVOPS',
      description: 'Deploy to production',
    });

    const approval = await approvalService.requestApproval({
      projectId: project.id,
      taskId: task.id,
      requestedBy: 'DEVOPS',
      reason: 'Deployment plan requires sign-off',
    });

    const rejected = await approvalService.rejectRequest(approval.id, 'admin-user', 'Not ready for production');
    expect(rejected?.status).toBe('REJECTED');

    const updatedTask = await taskEngine.getTask(task.id);
    expect(updatedTask?.status).toBe('FAILED');
    expect(updatedTask?.error).toContain('Not ready for production');
  });

  it('should list pending approvals per project', async () => {
    const approval1 = await approvalService.requestApproval({
      projectId: 'proj-a',
      taskId: 'task-1',
      requestedBy: 'ARCHITECT',
      reason: 'Review arch doc',
    });

    await approvalService.requestApproval({
      projectId: 'proj-b',
      taskId: 'task-2',
      requestedBy: 'DEVOPS',
      reason: 'Review deployment',
    });

    const projAPending = await approvalService.getPendingApprovals('proj-a');
    expect(projAPending.length).toBe(1);

    const allPending = await approvalService.getPendingApprovals();
    expect(allPending.length).toBeGreaterThanOrEqual(2);

    // Approve one and verify
    await approvalService.approveRequest(approval1.id, 'admin');
    const projAPendingAfter = await approvalService.getPendingApprovals('proj-a');
    expect(projAPendingAfter.length).toBe(0);
  });
});
