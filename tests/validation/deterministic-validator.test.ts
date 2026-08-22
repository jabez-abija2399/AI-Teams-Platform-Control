import { describe, it, expect } from 'vitest';
import { DeterministicValidator } from '../../src/core/validation/deterministic-validator';

describe('DeterministicValidator & Objective Verification', () => {
  it('should pass validation for clean, strictly-typed code files', () => {
    const files = {
      'src/index.ts': 'export const add = (a: number, b: number): number => a + b;\n',
      'src/types.ts': 'export interface User { id: string; name: string; }\n',
    };

    const report = DeterministicValidator.validateCodebase({
      files,
      expectedFilePaths: ['src/index.ts'],
    });

    expect(report.isValid).toBe(true);
    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(report.evidence.typeCheckPassed).toBe(true);
    expect(report.evidence.lintPassed).toBe(true);
    expect(report.defects.length).toBe(0);
  });

  it('should detect syntax errors, missing files, and unsafe eval() calls', () => {
    const files = {
      'src/index.ts': 'export const broken = () => { if (true) { return 1; };\n', // unbalanced brace
      'src/eval.ts': 'export const execute = (str: string) => eval(str);\n',
    };

    const report = DeterministicValidator.validateCodebase({
      files,
      expectedFilePaths: ['src/index.ts', 'src/missing.ts'],
    });

    expect(report.isValid).toBe(false);
    expect(report.score).toBeLessThan(60);
    expect(report.defects.some((d) => d.title.includes('Syntax Error'))).toBe(true);
    expect(report.defects.some((d) => d.title.includes('Missing Required File'))).toBe(true);
    expect(report.defects.some((d) => d.title.includes('Unsafe Code Execution'))).toBe(true);
  });

  it('should calculate requirement coverage percentage accurately', () => {
    const files = {
      'src/components/Auth.tsx': 'export function Auth() { return <div>Authentication Form</div>; }\n',
    };

    const requirements = {
      version: 1,
      productScope: { problem: '', targetUsers: [], goals: [], nonGoals: [], assumptions: [], constraints: [], openQuestions: [] },
      features: [
        { id: 'f1', name: 'Auth Form', description: 'User login', linkedUserStories: [], acceptanceCriteria: ['Login exists'], dependencies: [] },
        { id: 'f2', name: 'Payment Billing Gateway', description: 'Stripe charges', linkedUserStories: [], acceptanceCriteria: ['Charge works'], dependencies: [] },
      ],
      userStories: [],
      nonFunctionalRequirements: [],
      approvalStatus: 'APPROVED' as const,
    };

    const report = DeterministicValidator.validateCodebase({
      files,
      requirements,
    });

    expect(report.evidence.requirementCoveragePercentage).toBe(50);
    expect(report.defects.some((d) => d.title.includes('Unimplemented Feature: Payment Billing Gateway'))).toBe(true);
  });
});
