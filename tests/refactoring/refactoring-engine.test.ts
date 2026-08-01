import { describe, it, expect } from 'vitest';
import { AutonomousRefactoringEngine } from '../../src/core/refactoring/refactoring-engine';

describe('Phase 28 — Autonomous Refactoring Engine', () => {
  it('should identify refactoring candidates and verify behavior preservation', () => {
    const largeFile = Array(280).fill('const item = true;').join('\n');
    const fileMap = {
      'src/LargeComponent.tsx': largeFile,
    };

    const report = AutonomousRefactoringEngine.analyzeAndRefactor('proj-ref-1', fileMap);
    expect(report.candidates.length).toBeGreaterThan(0);
    expect(report.behaviorPreserved).toBe(true);
    expect(report.typeScriptClean).toBe(true);
  });
});
