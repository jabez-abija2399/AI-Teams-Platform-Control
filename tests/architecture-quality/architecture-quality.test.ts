import { describe, it, expect } from 'vitest';
import { ArchitectureScorer } from '../../src/core/architecture-quality/architecture-scorer';

describe('Phase 27 — Architecture Quality Engine', () => {
  it('should calculate architecture score and grade across 10 core dimensions', () => {
    const fileMap = { 'src/index.ts': 'console.log("hello");' };
    const report = ArchitectureScorer.calculateArchitectureQuality('proj-arch-1', fileMap);

    expect(report.metrics.length).toBe(10);
    expect(report.overallScore).toBeGreaterThan(90);
    expect(report.overallGrade).toMatch(/A\+?|B/);
    expect(report.technicalDebtDays).toBeLessThan(1);
    expect(report.improvementSuggestions.length).toBeGreaterThan(0);
  });
});
