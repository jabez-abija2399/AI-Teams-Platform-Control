import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HandoffManager } from '@/core/company-orchestration';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    artifactLifecycleRecord: {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({ id: 'art-1', version: 1 }),
    },
    document: {
      create: vi.fn().mockResolvedValue({ id: 'doc-1' }),
    },
    agentHandoffRecord: {
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'handoff-1', ...data })),
      findMany: vi.fn().mockResolvedValue([
        { id: 'handoff-1', fromAgentRole: 'CEO', toAgentRole: 'PRODUCT_MANAGER', status: 'SUCCESS' },
      ]),
    },
  },
}));

vi.mock('@/ai/agents/memory/memory.manager', () => ({
  getMemoryManager: () => ({
    remember: vi.fn().mockResolvedValue(true),
  }),
}));

vi.mock('@/core/integration/event-bus', () => ({
  companyEventBus: {
    publish: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('@/features/ai-workspace/services/timeline.service', () => ({
  recordTimelineEvent: vi.fn().mockResolvedValue(true),
}));

describe('HandoffManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes an automatic handoff from one department to the next', async () => {
    const res = await HandoffManager.executeHandoff({
      projectId: 'proj-1',
      fromAgentRole: 'CEO',
      toAgentRole: 'PRODUCT_MANAGER',
      fromPhase: 'STRATEGY_RUNNING',
      toPhase: 'PRODUCT_RUNNING',
      artifact: {
        type: 'BusinessStrategy',
        content: { vision: 'Autonomous SaaS', targetMarket: 'Enterprise' },
        producerRole: 'CEO',
      },
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.handoffId).toBe('handoff-1');
      expect(res.data.artifactId).toBe('art-1');
    }
  });

  it('retrieves the handoff history for a project', async () => {
    const res = await HandoffManager.getHandoffHistory('proj-1');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.length).toBe(1);
      expect(res.data[0].fromAgentRole).toBe('CEO');
    }
  });
});
