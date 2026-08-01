import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PipelineOrchestrator } from '../../src/core/execution-engine/pipeline.orchestrator';

describe('ExpenseFlow E2E Workflow Test', () => {
  const e2eProjectId = 'expense-flow-e2e-test';

  it('should execute all 13+ phases of the autonomous company pipeline', async () => {
    const result = await PipelineOrchestrator.executeIdea({
      owner: e2eProjectId,
      name: 'ExpenseFlow',
      idea: `I want to build a simple personal expense tracker web application. Users should be able to create expenses, add expense categories, view spending history, and see monthly spending summaries. The application should be simple, fast, and easy for students to use. Build this as an MVP first.`,
      autoApprove: true,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      const { status, timeline } = result.data;

      expect(status).toBe('COMPLETED');

      const phaseNames = timeline.map((e: any) => e.phase);

      expect(phaseNames).toContain('DISCOVERY_RUNNING');
      expect(phaseNames).toContain('CLARIFICATION_RUNNING');
      expect(phaseNames).toContain('PROPOSAL_RUNNING');
      expect(phaseNames).toContain('STRATEGY_RUNNING');
      expect(phaseNames).toContain('PRODUCT_RUNNING');
      expect(phaseNames).toContain('ANALYSIS_RUNNING');
      expect(phaseNames).toContain('DESIGN_RUNNING');
      expect(phaseNames).toContain('ARCHITECTURE_RUNNING');
      expect(phaseNames).toContain('PLANNING_RUNNING');
      expect(phaseNames).toContain('DEVELOPMENT_RUNNING');
      expect(phaseNames).toContain('TESTING_RUNNING');
      expect(phaseNames).toContain('REVIEW_RUNNING');
      expect(phaseNames).toContain('SECURITY_RUNNING');
      expect(phaseNames).toContain('DEPLOYMENT_RUNNING');
      expect(phaseNames).toContain('MONITORING');
    }
  });
});
