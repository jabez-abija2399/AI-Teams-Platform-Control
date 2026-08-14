import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowManager, PIPELINE_PHASE_DEFINITIONS } from '@/core/company-orchestration';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findUnique: vi.fn().mockResolvedValue({ id: 'test-project', status: 'PLANNING' }),
    },
    projectWorkflowState: {
      findUnique: vi.fn().mockResolvedValue({
        projectId: 'test-project',
        currentPhase: 'CREATED',
        completedPhases: [],
        activeAgent: 'SYSTEM',
        currentArtifact: null,
        progress: 0,
        nextAction: 'Ready to start Product Discovery',
        waitingApprovals: [],
        risks: [],
      }),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'state-id', ...data })),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ projectId: 'test-project', ...data })),
    },
    artifactLifecycleRecord: {
      findFirst: vi.fn().mockResolvedValue({
        id: 'art-1',
        projectId: 'test-project',
        artifactType: 'ProjectIdea',
        status: 'VALIDATED',
        version: 1,
        metadata: { content: { name: 'Test' } },
      }),
    },
    approvalHistory: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'app-1' }),
    },
  },
}));

describe('WorkflowEngine (WorkflowManager)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes workflow state correctly', async () => {
    const res = await WorkflowManager.getOrInitState('test-project');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.currentPhase).toBe('CREATED');
      expect(res.data.progress).toBe(0);
    }
  });

  it('validates state transitions accurately according to strict rules', () => {
    expect(WorkflowManager.canTransition('CREATED', 'DISCOVERY_RUNNING')).toBe(true);
    expect(WorkflowManager.canTransition('DISCOVERY_RUNNING', 'CLARIFICATION_RUNNING')).toBe(true);
    expect(WorkflowManager.canTransition('CREATED', 'DEPLOYMENT_RUNNING')).toBe(false);
  });

  it('evaluates prerequisites for a target phase', async () => {
    const res = await WorkflowManager.evaluatePrerequisites('test-project', 'DISCOVERY_RUNNING');
    expect(res.success).toBe(true);
  });

  it('handles phase completion and pauses when an approval gate is required after a phase', async () => {
    // PROPOSAL_RUNNING requires 'Product Approval' after completion
    const res = await WorkflowManager.onPhaseCompleted('test-project', 'PROPOSAL_RUNNING', 'ProductProposal', 'art-proposal');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.action).toBe('PAUSE_FOR_APPROVAL');
      expect(res.data.approvalType).toBe('Product Approval');
    }
  });

  it('advances to next state automatically when no approval gate is required', async () => {
    // DISCOVERY_RUNNING advances to CLARIFICATION_RUNNING without approval
    const res = await WorkflowManager.onPhaseCompleted('test-project', 'DISCOVERY_RUNNING', 'ProductSpecification', 'art-spec');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.action).toBe('PROCEED');
      expect(res.data.nextPhase).toBe('CLARIFICATION_RUNNING');
    }
  });
});
