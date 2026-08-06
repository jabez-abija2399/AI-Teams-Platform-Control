import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: { findUnique: vi.fn().mockResolvedValue(null) },
    creditAccount: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));

vi.mock('@/core/company-orchestration/workflow-state-access', () => ({
  findWorkflowScalars: vi.fn(),
  updateWorkflowScalars: vi.fn(),
}));

vi.mock('@/core/memory/company-memory.service', () => ({
  CompanyMemoryService: {
    getMemory: vi.fn().mockResolvedValue({ data: { userPreferences: {} } }),
    updateMemory: vi.fn().mockResolvedValue(undefined),
  },
}));

import { findWorkflowScalars, updateWorkflowScalars } from '@/core/company-orchestration/workflow-state-access';
import {
  assertCreditsAvailable,
  getProjectCreditSnapshot,
  setProjectPipelineSettings,
} from '@/core/billing/project-credits';

describe('credits stop → add → resume gate', () => {
  let meta: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    meta = { credits: { balance: 0, strictMode: false }, creditBalance: 0 };
    vi.mocked(findWorkflowScalars).mockImplementation(async () => ({ metadata: { ...meta } }) as any);
    vi.mocked(updateWorkflowScalars).mockImplementation(async (_id, update: any) => {
      meta = { ...meta, ...(update.metadata || {}) };
      return undefined as any;
    });
  });

  it('stops when balance is 0', async () => {
    await expect(assertCreditsAvailable('proj_1')).rejects.toThrow(/402|credit/i);
    const snap = await getProjectCreditSnapshot('proj_1');
    expect(snap.balance).toBe(0);
    expect(snap.lowBalance).toBe(true);
  });

  it('clears the gate after adding credits (Resume path)', async () => {
    const snap = await setProjectPipelineSettings('proj_1', { creditBalance: 50 });
    expect(snap.balance).toBe(50);
    expect(updateWorkflowScalars).toHaveBeenCalled();
    await expect(assertCreditsAvailable('proj_1')).resolves.toBeUndefined();
  });
});
