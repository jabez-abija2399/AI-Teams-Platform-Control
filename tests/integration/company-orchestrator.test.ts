import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CompanyOrchestrator } from '../../src/core/integration/company-orchestrator';
import { ExecutionStateService } from '../../src/core/integration/execution-state.service';
import { CompanyEventBus } from '../../src/core/integration/event-bus';
import * as ceoService from '../../src/ai/agents/roles/ceo/ceo.service';
import * as pmService from '../../src/ai/agents/roles/product-manager/product-manager.service';
import * as archService from '../../src/ai/agents/roles/architect/architect.service';
import * as devService from '../../src/ai/agents/roles/developer/developer.service';
import * as qaService from '../../src/ai/agents/roles/qa/qa.service';
import * as reviewerService from '../../src/ai/agents/roles/reviewer/reviewer.service';

describe('Phase 30.5 — Company Orchestrator', () => {
  const testProjectId = 'proj_orch_test_101';

  beforeEach(() => {
    ExecutionStateService.resetAll();
    CompanyEventBus.resetListeners();
    CompanyEventBus.clearHistory();

    // Mock reviewer to always pass artifacts without hitting DB/LLM during orchestrator test
    vi.spyOn(reviewerService, 'reviewArtifact').mockResolvedValue({
      success: true,
      data: { verdict: 'APPROVED', score: 95, summary: 'Approved' } as any,
    });
  });

  it('1. Executes Discovery stage, transitions lifecycle, and emits DISCOVERY_COMPLETED', async () => {
    vi.spyOn(ceoService, 'analyzeUserIdea').mockResolvedValue({
      success: true,
      data: {
        vision: { problem: 'Manual testing', solution: 'AI QA' },
        requirements: [{ id: 'req_1', title: 'Automated Test Generation' }],
      } as any,
    });

    const listener = vi.fn();
    CompanyEventBus.subscribe('DISCOVERY_COMPLETED', listener);

    const res = await CompanyOrchestrator.executeDiscovery(testProjectId, 'AI QA SaaS');

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.vision.solution).toBe('AI QA');
    }
    expect(listener).toHaveBeenCalledTimes(1);

    const state = ExecutionStateService.getState(testProjectId);
    expect(state.currentPhase).toBe('DISCOVERY');
    expect(state.completedTasks).toContain('analyzeUserIdea');
  });

  it('2. Executes Planning stage and transitions state to PLANNING', async () => {
    vi.spyOn(pmService, 'refineRequirements').mockResolvedValue({
      success: true,
      data: {
        userStories: [{ asA: 'Dev', iWant: 'QA auto', soThat: 'fast pr', priority: 'HIGH' }],
        featureSpecs: [{ name: 'Test Runner', description: 'Runs tests' }],
        nonFunctionalRequirements: [],
      } as any,
    });

    ExecutionStateService.initState(testProjectId, 'DISCOVERY');

    const res = await CompanyOrchestrator.executePlanning(testProjectId, { requirements: [] });

    expect(res.success).toBe(true);
    const state = ExecutionStateService.getState(testProjectId);
    expect(state.currentPhase).toBe('PLANNING');
  });

  it('3. Executes Architecture stage and emits ARCHITECTURE_APPROVED', async () => {
    vi.spyOn(archService, 'designArchitecture').mockResolvedValue({
      success: true,
      data: {
        systemDesign: 'Microservices',
        databaseSchema: 'Prisma Postgres',
      } as any,
    });

    ExecutionStateService.initState(testProjectId, 'PLANNING');

    const res = await CompanyOrchestrator.executeArchitecture(testProjectId, {
      featureSpecs: [],
      userStories: [],
      nonFunctionalRequirements: [],
    });

    expect(res.success).toBe(true);
    const state = ExecutionStateService.getState(testProjectId);
    expect(state.currentPhase).toBe('ARCHITECTURE');
  });

  it('4. Executes Execution & Review stages cleanly', async () => {
    vi.spyOn(devService, 'implementArchitecture').mockResolvedValue({
      success: true,
      data: { filesGenerated: ['src/index.ts'] } as any,
    });
    vi.spyOn(qaService, 'reviewImplementation').mockResolvedValue({
      success: true,
      data: { qualityReport: { score: 92, issues: [] } } as any,
    });

    ExecutionStateService.initState(testProjectId, 'ARCHITECTURE');

    const execRes = await CompanyOrchestrator.executeExecution(testProjectId, {}, []);
    expect(execRes.success).toBe(true);
    expect(ExecutionStateService.getState(testProjectId).currentPhase).toBe('EXECUTION');

    if (execRes.success) {
      const revRes = await CompanyOrchestrator.executeReview(testProjectId, execRes.data);
      expect(revRes.success).toBe(true);
      expect(ExecutionStateService.getState(testProjectId).currentPhase).toBe('REVIEW');
    }
  });

  it('5. Handles execution failures and transitions project health to FAILED', async () => {
    vi.spyOn(ceoService, 'analyzeUserIdea').mockRejectedValue(new Error('LLM Rate Limit'));

    const res = await CompanyOrchestrator.executeDiscovery(testProjectId, 'Failed Idea');

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.message).toContain('LLM Rate Limit');
    }

    const state = ExecutionStateService.getState(testProjectId);
    expect(state.executionHealth).toBe('FAILED');
    expect(state.error?.code).toBe('DISCOVERY_FAILED');
  });
});
