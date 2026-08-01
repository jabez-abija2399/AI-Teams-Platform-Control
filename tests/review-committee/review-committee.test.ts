import { describe, it, expect } from 'vitest';
import { ReviewCommittee } from '../../src/core/review-committee/review-committee';

describe('Phase 25 — AI Review Committee', () => {
  it('should evaluate codebase across 7 reviewer roles and produce approval decision', () => {
    const fileMap = {
      'src/api.ts': 'export const api = true;',
    };

    const report = ReviewCommittee.evaluateCodebase('proj-rev-1', fileMap);
    expect(report.individualReviews.length).toBe(7);
    expect(report.overallScore).toBeGreaterThan(80);
    expect(report.decision).toBe('APPROVED');
    expect(report.isApproved).toBe(true);
  });

  it('should request changes when security or senior engineer violations occur', () => {
    const fileMap = {
      'src/unsafe.ts': 'const bad = eval("1+1"); const x: any = 5;',
    };

    const report = ReviewCommittee.evaluateCodebase('proj-rev-2', fileMap);
    expect(report.isApproved).toBe(false);
    expect(report.decision).toBe('CHANGES_REQUESTED');
    expect(report.requiredActionItems.length).toBeGreaterThan(0);
  });
});
