import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PipelineManager } from '../../src/core/integration/pipeline-manager';
import { IntegrationValidator } from '../../src/core/integration/integration-validator';
import { ExecutionStateService } from '../../src/core/integration/execution-state.service';
import { CompanyEventBus } from '../../src/core/integration/event-bus';
import * as ceoService from '../../src/ai/agents/roles/ceo/ceo.service';
import * as pmService from '../../src/ai/agents/roles/product-manager/product-manager.service';
import * as archService from '../../src/ai/agents/roles/architect/architect.service';
import * as devService from '../../src/ai/agents/roles/developer/developer.service';
import * as qaService from '../../src/ai/agents/roles/qa/qa.service';
import * as reviewerService from '../../src/ai/agents/roles/reviewer/reviewer.service';

describe('Phase 30.5 — Autonomous AI Software Company End-to-End Orchestration', () => {
  const e2eProjectId = 'e2e_autonomous_company_proj_999';

  beforeEach(() => {
    ExecutionStateService.resetAll();
    CompanyEventBus.resetListeners();
    CompanyEventBus.clearHistory();

    vi.spyOn(reviewerService, 'reviewArtifact').mockResolvedValue({
      success: true,
      data: { verdict: 'APPROVED', score: 96, summary: 'Passed E2E review' } as any,
    });
  });

  it('1. Verifies entire integration system and dependencies are valid', async () => {
    const sysValidation = await IntegrationValidator.validateSystem();
    expect(sysValidation.valid).toBe(true);
    expect(sysValidation.errors).toHaveLength(0);
  });

  it('2. Executes complete autonomous software company pipeline from User Idea to Completion', async () => {
    vi.spyOn(ceoService, 'analyzeUserIdea').mockResolvedValue({
      success: true,
      data: {
        vision: { problem: 'Manual HR', solution: 'AI HR Portal' },
        requirements: [{ id: 'r1', title: 'Employee onboarding' }],
      } as any,
    });

    vi.spyOn(pmService, 'refineRequirements').mockResolvedValue({
      success: true,
      data: {
        userStories: [{ asA: 'HR Dev', iWant: 'auto onboard', soThat: 'save time', priority: 'CRITICAL' }],
        featureSpecs: [{ name: 'Onboarding API', description: 'REST API' }],
        nonFunctionalRequirements: [],
      } as any,
    });

    vi.spyOn(archService, 'designArchitecture').mockResolvedValue({
      success: true,
      data: {
        systemDesign: 'Serverless Next.js',
        databaseSchema: 'Prisma Models',
      } as any,
    });

    vi.spyOn(devService, 'implementArchitecture').mockResolvedValue({
      success: true,
      data: { filesGenerated: ['src/api/onboard.ts', 'src/components/Portal.tsx'] } as any,
    });

    vi.spyOn(qaService, 'reviewImplementation').mockResolvedValue({
      success: true,
      data: { qualityReport: { score: 98, issues: [] } } as any,
    });

    const eventsCaptured: string[] = [];
    CompanyEventBus.subscribe('*', (evt) => {
      eventsCaptured.push(evt.type);
    });

    const result = await PipelineManager.startProject(e2eProjectId, 'Build an AI-driven HR employee onboarding portal.');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.discovery.vision.solution).toBe('AI HR Portal');
      expect(result.data.execution.filesGenerated).toHaveLength(2);
      expect(result.data.review.qualityReport.score).toBe(98);
    }

    // Verify events emitted across all subsystems
    expect(eventsCaptured).toContain('PROJECT_CREATED');
    expect(eventsCaptured).toContain('DISCOVERY_COMPLETED');
    expect(eventsCaptured).toContain('PRODUCT_APPROVED');
    expect(eventsCaptured).toContain('ARCHITECTURE_APPROVED');
    expect(eventsCaptured).toContain('BUILD_COMPLETED');
    expect(eventsCaptured).toContain('REVIEW_COMPLETED');
    expect(eventsCaptured).toContain('PROJECT_COMPLETED');

    // Verify Mission Control state synchronization
    const status = PipelineManager.getStatus(e2eProjectId);
    expect(status.currentPhase).toBe('COMPLETED');
    expect(status.executionHealth).toBe('HEALTHY');
    expect(status.completedTasks).toContain('analyzeUserIdea');
    expect(status.completedTasks).toContain('refineRequirements');
    expect(status.completedTasks).toContain('designArchitecture');
    expect(status.completedTasks).toContain('implementArchitecture');
    expect(status.completedTasks).toContain('reviewImplementation');
    expect(status.recentEvents.length).toBeGreaterThan(0);

    const projValidation = await IntegrationValidator.validateProjectPipeline(e2eProjectId);
    expect(projValidation.valid).toBe(true);
  });

  it('3. Supports pausing and resuming active project execution', async () => {
    ExecutionStateService.initState(e2eProjectId, 'ARCHITECTURE');

    const pauseRes = await PipelineManager.pauseProject(e2eProjectId, 'Waiting for CEO approval');
    expect(pauseRes.success).toBe(true);
    if (pauseRes.success) {
      expect(pauseRes.data).toBe('PAUSED');
    }
    expect(PipelineManager.getStatus(e2eProjectId).isPaused).toBe(true);

    vi.spyOn(archService, 'designArchitecture').mockResolvedValue({
      success: true,
      data: { systemDesign: 'Resumed Arch' } as any,
    });

    const resumeRes = await PipelineManager.resumeProject(e2eProjectId, { pmData: { featureSpecs: [], userStories: [], nonFunctionalRequirements: [] } });
    expect(resumeRes.success).toBe(true);
    expect(PipelineManager.getCurrentStage(e2eProjectId)).toBe('ARCHITECTURE');
  });

  it('4. Supports failure recovery and automatic retry of degraded pipelines', async () => {
    ExecutionStateService.initState(e2eProjectId, 'EXECUTION');
    ExecutionStateService.updateHealth(e2eProjectId, 'FAILED', {
      message: 'Network timeout during code build',
      code: 'BUILD_TIMEOUT',
      timestamp: Date.now(),
      stage: 'EXECUTION',
      recoverable: true,
    });

    vi.spyOn(devService, 'implementArchitecture').mockResolvedValue({
      success: true,
      data: { filesGenerated: ['src/recovered.ts'] } as any,
    });

    const retryRes = await PipelineManager.retryProject(e2eProjectId, { archData: {}, requirements: [] });

    expect(retryRes.success).toBe(true);
    expect(PipelineManager.getCurrentStage(e2eProjectId)).toBe('EXECUTION');
    expect(PipelineManager.getStatus(e2eProjectId).executionHealth).toBe('HEALTHY');
  });
});
