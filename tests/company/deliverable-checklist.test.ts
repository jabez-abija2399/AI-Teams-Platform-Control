import { describe, expect, it } from 'vitest';
import {
  buildDeliverableChecklist,
  buildDeliverableChecklistForState,
} from '@/core/company-orchestration/deliverable-checklist';
import { isBlockingProviderError } from '@/core/company-orchestration/phase-gate';

describe('deliverable-checklist', () => {
  it('marks completed phases with artifacts as done', () => {
    const items = buildDeliverableChecklist({
      lifecyclePhase: 'PRODUCT_RUNNING',
      completedPhases: ['STRATEGY_RUNNING'],
      artifactTypes: ['BusinessStrategy'],
    });
    const strategy = items.find((i) => i.phase === 'STRATEGY_RUNNING');
    const product = items.find((i) => i.phase === 'PRODUCT_RUNNING');
    expect(strategy?.status).toBe('done');
    expect(product?.status).toBe('active');
  });

  it('highlights blocked resume phase when FAILED', () => {
    const items = buildDeliverableChecklistForState({
      lifecyclePhase: 'FAILED',
      blockedPhase: 'DEVELOPMENT_RUNNING',
      completedPhases: ['STRATEGY_RUNNING', 'PRODUCT_RUNNING'],
      artifactTypes: ['BusinessStrategy', 'PRD'],
    });
    const blocked = items.find((i) => i.phase === 'DEVELOPMENT_RUNNING');
    expect(blocked?.status).toBe('blocked');
  });
});

describe('credits smoke path (classification)', () => {
  it('credits error is a hard stop signal for Resume', () => {
    const msg = '402 Insufficient credit balance — add credits, then Resume this step.';
    expect(isBlockingProviderError(msg)).toBe(true);
  });
});
