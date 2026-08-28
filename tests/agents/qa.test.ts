import { describe, it, expect } from 'vitest';
import { qaReportSpecSchema } from '../../src/packages/agents/roles/qa-engineer/qa.types';
import { QAAgent } from '../../src/packages/agents/roles/qa-engineer/qa-engineer.agent';
import { createAgent } from '../../src/packages/agents/manager/agent.registry';

describe('QA Engineer AI Specialist', () => {
  it('should instantiate via direct class and registry', () => {
    const directAgent = new QAAgent();
    expect(directAgent.role).toBe('QA');
    expect(directAgent.name).toBe('Quality Assurance Engineer');

    const registryAgent = createAgent('QA', 'Test QA Engineer');
    expect(registryAgent.role).toBe('QA');
    expect(registryAgent.name).toBe('Test QA Engineer');
  });

  it('should parse empty or partial object into full QA report spec with defaults', () => {
    const parsed = qaReportSpecSchema.parse({});
    expect(parsed).toBeDefined();
    expect(parsed.status).toBe('APPROVED');
    expect(parsed.unitTests).toEqual([]);
    expect(parsed.qualityReport.score).toBe(85);
    expect(parsed.coverageAnalysis.estimatedCoverage).toBe(85);
  });

  it('should parse complete QA report spec structure correctly', () => {
    const sampleInput = {
      unitTests: [{ id: 'TC-01', title: 'Test Login', type: 'unit', steps: ['Enter user', 'Enter pwd'], expectedResult: 'Token returned', priority: 'HIGH' }],
      integrationTests: [],
      e2eTests: [],
      regressionPlan: ['Verify checkout'],
      coverageAnalysis: { estimatedCoverage: 92, uncoveredAreas: ['legacy-utils'], highRiskModules: ['auth'] },
      riskMatrix: [{ risk: 'Sql injection', impact: 'High', likelihood: 'Low', mitigation: 'Prisma parameterization' }],
      bugReports: [{ id: 'BUG-01', title: 'Missing null check', severity: 'HIGH', description: 'Crashes on null email', location: 'userService.ts', reproductionSteps: ['Send null'], suggestedSolution: 'Add optional chaining' }],
      testSuites: [{ name: 'AuthSuite', testCount: 12, targetModule: 'auth' }],
      performanceTests: [],
      accessibilityTests: [],
      securityTests: [],
      qualityReport: { score: 78, verdict: 'NEEDS_REVISION', summary: 'Good but 1 high bug', recommendations: ['Fix null check'] },
      status: 'APPROVED',
    };

    const parsed = qaReportSpecSchema.parse(sampleInput);
    expect(parsed.unitTests[0]?.title).toBe('Test Login');
    expect(parsed.bugReports[0]?.severity).toBe('HIGH');
    expect(parsed.qualityReport.verdict).toBe('NEEDS_REVISION');
  });
});
