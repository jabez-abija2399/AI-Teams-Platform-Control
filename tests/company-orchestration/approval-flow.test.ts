import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApprovalManager } from '@/core/company-orchestration';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    approvalHistory: {
      findFirst: vi.fn().mockImplementation(({ where }) => {
        if (where?.status === 'PENDING' && where?.approvalType === 'Product Approval') {
          return Promise.resolve({ id: 'app-1', status: 'PENDING', approvalType: 'Product Approval' });
        }
        return Promise.resolve(null);
      }),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'app-new', ...data })),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'app-1', ...data })),
      findMany: vi.fn().mockResolvedValue([
        { id: 'app-1', approvalType: 'Product Approval', status: 'APPROVED', createdAt: new Date() },
      ]),
    },
    projectWorkflowState: {
      findUnique: vi.fn().mockResolvedValue({
        projectId: 'proj-1',
        currentPhase: 'PAUSED',
        waitingApprovals: ['Product Approval'],
      }),
      update: vi.fn().mockResolvedValue({ projectId: 'proj-1' }),
    },
  },
}));

vi.mock('@/core/integration/event-bus', () => ({
  companyEventBus: {
    publish: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('@/features/ai-workspace/services/timeline.service', () => ({
  recordTimelineEvent: vi.fn().mockResolvedValue(true),
}));

describe('ApprovalFlow (ApprovalManager)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests an approval gate and pauses the pipeline', async () => {
    const res = await ApprovalManager.requestApproval('proj-1', 'Architecture Approval', 'ARCHITECTURE_RUNNING', 'ArchitectureDocument', 'doc-arch');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.approvalId).toBe('app-new');
    }
  });

  it('resolves a pending approval when granted by a human executive', async () => {
    const res = await ApprovalManager.resolveApproval('proj-1', 'Product Approval', 'APPROVED', 'Executive Reviewer', 'Looks great');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.status).toBe('APPROVED');
    }
  });

  it('retrieves the approval history for a project', async () => {
    const res = await ApprovalManager.getApprovalHistory('proj-1');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.length).toBe(1);
      expect(res.data[0].approvalType).toBe('Product Approval');
    }
  });
});
