import { describe, it, expect } from 'vitest';
import { RootCauseDiagnoser } from '@/core/root-cause/root-cause-diagnoser';

describe('Root Cause Diagnoser', () => {
  it('routes requirement ambiguities to PM Agent', () => {
    const diagnosis = RootCauseDiagnoser.diagnose({
      failureReason: 'Missing user story and acceptance criteria unfulfilled for checkout flow',
    });
    expect(diagnosis.category).toBe('REQUIREMENT');
    expect(diagnosis.responsibleRole).toBe('PM');
    expect(diagnosis.remediationPhase).toBe('PRODUCT_RUNNING');
  });

  it('routes database schema mismatches to Architect Agent', () => {
    const diagnosis = RootCauseDiagnoser.diagnose({
      failureReason: 'Database migration error: schema conflict in User table relations',
    });
    expect(diagnosis.category).toBe('ARCHITECTURE');
    expect(diagnosis.responsibleRole).toBe('ARCHITECT');
    expect(diagnosis.remediationPhase).toBe('ARCHITECTURE_RUNNING');
  });

  it('routes UI layout & contrast defects to Designer Agent', () => {
    const diagnosis = RootCauseDiagnoser.diagnose({
      failureReason: 'Broken layout: color contrast failure and component token mismatch',
    });
    expect(diagnosis.category).toBe('DESIGN');
    expect(diagnosis.responsibleRole).toBe('DESIGNER');
    expect(diagnosis.remediationPhase).toBe('DESIGN_RUNNING');
  });

  it('routes code syntax and type errors to Developer Agent', () => {
    const diagnosis = RootCauseDiagnoser.diagnose({
      failureReason: 'TypeScript compilation failed in src/app/page.tsx: Property does not exist',
    });
    expect(diagnosis.category).toBe('IMPLEMENTATION');
    expect(diagnosis.responsibleRole).toBe('DEVELOPER');
    expect(diagnosis.remediationPhase).toBe('DEVELOPMENT_RUNNING');
  });
});
