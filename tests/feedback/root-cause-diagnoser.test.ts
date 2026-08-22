import { describe, it, expect } from 'vitest';
import { RootCauseDiagnoser } from '../../src/core/feedback/root-cause-diagnoser';
import type { DefectItem } from '../../src/core/state/project-state.types';

describe('RootCauseDiagnoser & Dynamic QA Feedback Routing', () => {
  it('should route requirement gaps to PM Agent', () => {
    const defects: DefectItem[] = [
      {
        id: 'd1',
        title: 'Unimplemented Feature: Billing Checkout',
        severity: 'HIGH',
        expectedBehavior: 'Feature should be specified and implemented.',
        actualBehavior: 'No acceptance criteria or implementation found.',
        affectedArea: 'Requirements',
        evidence: 'Missing in PRD',
        rootCauseHypothesis: 'Scope omitted from requirements',
        recommendedOwner: 'PM',
        status: 'OPEN',
      },
    ];

    const result = RootCauseDiagnoser.diagnose(defects);
    expect(result.primaryOwner).toBe('PM');
    expect(result.affectedPhase).toBe('REQUIREMENTS');
    expect(result.remediationPrompt).toContain('PRD');
  });

  it('should route architectural defects to Architect Agent', () => {
    const defects: DefectItem[] = [
      {
        id: 'd2',
        title: 'Stack Mismatch: Missing PostgreSQL migration script',
        severity: 'HIGH',
        expectedBehavior: 'Database schema should define relational foreign keys.',
        actualBehavior: 'Schema does not match approved architecture.',
        affectedArea: 'Database Architecture',
        evidence: 'No prisma schema relations',
        rootCauseHypothesis: 'Architecture specification incomplete',
        recommendedOwner: 'ARCHITECT',
        status: 'OPEN',
      },
    ];

    const result = RootCauseDiagnoser.diagnose(defects);
    expect(result.primaryOwner).toBe('ARCHITECT');
    expect(result.affectedPhase).toBe('ARCHITECTURE');
  });

  it('should route syntax and compiler defects to Developer Agent', () => {
    const defects: DefectItem[] = [
      {
        id: 'd3',
        title: 'Syntax Error in src/App.tsx',
        severity: 'CRITICAL',
        expectedBehavior: 'Code should compile cleanly.',
        actualBehavior: 'Unbalanced brackets in render function.',
        affectedArea: 'src/App.tsx',
        evidence: 'Compile error on line 42',
        rootCauseHypothesis: 'Developer code generation error',
        recommendedOwner: 'DEVELOPER',
        status: 'OPEN',
      },
    ];

    const result = RootCauseDiagnoser.diagnose(defects);
    expect(result.primaryOwner).toBe('DEVELOPER');
    expect(result.affectedPhase).toBe('IMPLEMENTATION');
  });
});
