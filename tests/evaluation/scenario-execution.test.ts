import { describe, it, expect, beforeEach } from 'vitest';
import { getEvaluatorEngine, getScenario, getScoringEngine } from '../../src/ai/evaluation';
import { getAgentAnalyticsService } from '../../src/features/agent-analytics';

describe('Phase 15 Scenario Execution & Production Metrics Validation', () => {
  beforeEach(() => {
    // reset metrics for clean test state if needed
  });

  it('should successfully evaluate Scenario 1 — Portfolio Website', async () => {
    const evaluator = getEvaluatorEngine();
    const scenario = getScenario('portfolio_website');
    expect(scenario).toBeDefined();

    if (scenario) {
      const res = await evaluator.evaluateScenario(scenario);
      expect(res.success).toBe(true);
      expect(res.workflowSelected).toBe('SIMPLE_WEBSITE');
      expect(res.agentsExecuted).toEqual(['CEO', 'FRONTEND', 'QA']);
      expect(res.averageQualityScore).toBeGreaterThan(80);
      expect(res.errorsDetected).toHaveLength(0);
    }
  });

  it('should successfully evaluate Scenario 2 — SaaS Platform', async () => {
    const evaluator = getEvaluatorEngine();
    const scenario = getScenario('saas_platform');
    expect(scenario).toBeDefined();

    if (scenario) {
      const res = await evaluator.evaluateScenario(scenario);
      expect(res.success).toBe(true);
      expect(res.workflowSelected).toBe('LARGE_SAAS');
      expect(res.agentsExecuted).toHaveLength(9);
      expect(res.averageQualityScore).toBeGreaterThan(80);
    }
  });

  it('should evaluate Scenario 3 — Failure Recovery and record retry metrics', async () => {
    const evaluator = getEvaluatorEngine();
    const scenario = getScenario('failure_recovery');
    expect(scenario).toBeDefined();

    if (scenario) {
      const res = await evaluator.evaluateScenario(scenario);
      expect(res.success).toBe(true);
      expect(res.retriesTriggered).toBeGreaterThan(0);
    }
  });

  it('should record production metrics (time, token usage, retry count, quality score) and generate agent dashboard analytics', async () => {
    const analyticsService = getAgentAnalyticsService();
    const summary = analyticsService.getAgentSummary('FRONTEND');
    
    expect(summary.tasksCompleted).toBeGreaterThan(0);
    expect(summary.averageQualityScore).toBeGreaterThan(0);

    const platformStats = analyticsService.getOverallPlatformSuccessRate();
    expect(platformStats.totalTasks).toBeGreaterThan(0);
    expect(platformStats.successRate).toBeGreaterThan(0);
  });
});
