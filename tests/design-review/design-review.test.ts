import { describe, it, expect } from 'vitest';
import { DesignReviewer } from '../../src/core/design-review/design-reviewer';

describe('Phase 26 — AI Design Review Engine', () => {
  it('should evaluate UI components across spacing, typography, contrast, accessibility, and touch targets', () => {
    const fileMap = {
      'src/Button.tsx': '<button className="px-4 py-2 bg-blue-600 text-white rounded">Click</button>',
    };

    const report = DesignReviewer.evaluateUI('proj-des-1', fileMap);
    expect(report.designScore).toBeGreaterThan(90);
    expect(report.accessibilityScore).toBeGreaterThan(90);
    expect(report.evaluations.length).toBe(11);
    expect(report.improvementSuggestions.length).toBeGreaterThan(0);
  });
});
