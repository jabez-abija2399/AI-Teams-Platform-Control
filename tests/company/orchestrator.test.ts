import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ContinuousCompanyOrchestrator,
  CompanyEventBus,
  CompanyStateMachine,
  CompanyStopwatch,
  CompanyHealthService,
  CompanyHeartbeat,
  CompanySupervisor,
  CompanyCheckpointService,
} from '../../src/core/company';
import { CompanyOrchestrator as IntegrationOrchestrator } from '../../src/core/integration/company-orchestrator';

describe('Phase 34 — Continuous Autonomous Company Orchestrator', () => {
  const testProjectId = 'proj_cont_orch_505';

  beforeEach(() => {
    ContinuousCompanyOrchestrator.resetAll();
    CompanyEventBus.clearHistory();
    CompanyEventBus.resetListeners();
    CompanyStateMachine.resetAll();
    CompanyStopwatch.resetAll();
    CompanyHealthService.resetAll();
    CompanyHeartbeat.resetAll();
    CompanySupervisor.resetAll();
    CompanyCheckpointService.resetAll();

    // Mock underlying integration orchestrator methods for reliable fast test execution
    vi.spyOn(IntegrationOrchestrator, 'executeDiscovery').mockResolvedValue({
      success: true,
      data: { vision: { problem: 'Manual DevOps', solution: 'AI Cloud Platform' } },
    } as any);

    vi.spyOn(IntegrationOrchestrator, 'executePlanning').mockResolvedValue({
      success: true,
      data: { requirements: ['Req 1', 'Req 2'], userStories: [] },
    } as any);

    vi.spyOn(IntegrationOrchestrator, 'executeArchitecture').mockResolvedValue({
      success: true,
      data: { systemDesign: 'Serverless Edge Architecture', databaseSchema: 'Postgres' },
    } as any);

    vi.spyOn(IntegrationOrchestrator, 'executeExecution').mockResolvedValue({
      success: true,
      data: { filesGenerated: ['src/index.ts', 'src/app.ts'], buildStatus: 'SUCCESS' },
    } as any);

    vi.spyOn(IntegrationOrchestrator, 'executeReview').mockResolvedValue({
      success: true,
      data: { verdict: 'APPROVED', score: 98, summary: 'Passed all tests and design checks' },
    } as any);

    vi.spyOn(IntegrationOrchestrator, 'executeComplete').mockResolvedValue({
      success: true,
      data: { status: 'COMPLETE' },
    } as any);
  });

  it('1. Automatically progresses from project creation to completion via event-driven cascade', async () => {
    const eventsCaptured: string[] = [];
    CompanyEventBus.subscribe('*', (evt) => {
      eventsCaptured.push(evt.type);
    });

    const initialStatus = await ContinuousCompanyOrchestrator.startProject(
      testProjectId,
      'Build an autonomous cloud deployment platform.'
    );

    expect(initialStatus.projectId).toBe(testProjectId);

    // Allow asynchronous event cascade to complete
    await new Promise((resolve) => setTimeout(resolve, 200));

    const finalStatus = ContinuousCompanyOrchestrator.getStatus(testProjectId);

    // Verify state progressed all the way to COMPLETED without manual intervention
    expect(finalStatus.currentState).toBe('COMPLETED');
    expect(finalStatus.companyStatus).toContain('COMPLETED successfully');
    expect(finalStatus.health).toBe('HEALTHY');

    // Verify all lifecycle events were fired in sequence
    expect(eventsCaptured).toContain('PROJECT_CREATED');
    expect(eventsCaptured).toContain('DISCOVERY_COMPLETED');
    expect(eventsCaptured).toContain('CLARIFICATION_COMPLETED');
    expect(eventsCaptured).toContain('PRODUCT_APPROVED');
    expect(eventsCaptured).toContain('ARCHITECTURE_APPROVED');
    expect(eventsCaptured).toContain('PLAN_READY');
    expect(eventsCaptured).toContain('TASK_STARTED');
    expect(eventsCaptured).toContain('TASK_COMPLETED');
    expect(eventsCaptured).toContain('REVIEW_STARTED');
    expect(eventsCaptured).toContain('REVIEW_COMPLETED');
    expect(eventsCaptured).toContain('DEPLOYMENT_STARTED');
    expect(eventsCaptured).toContain('DEPLOYMENT_COMPLETED');
    expect(eventsCaptured).toContain('PROJECT_FINISHED');
  });

  it('2. Supports pausing and resuming autonomous execution', async () => {
    const pauseProjId = 'proj_pause_test_606';
    ContinuousCompanyOrchestrator.setupSubscription();
    CompanyStateMachine.initProject(pauseProjId, 'ARCHITECTURE');

    const pausedStatus = await ContinuousCompanyOrchestrator.pauseProject(pauseProjId, 'Awaiting user verification');
    expect(pausedStatus.currentState).toBe('PAUSED');
    expect(pausedStatus.companyStatus).toContain('PAUSED');

    const resumedStatus = await ContinuousCompanyOrchestrator.resumeProject(pauseProjId);
    expect(resumedStatus.currentState).toBe('ARCHITECTURE');
  });

  it('3. Provides comprehensive telemetry for Mission Control live dashboards', async () => {
    const telemetryProjId = 'proj_telemetry_test_707';
    await ContinuousCompanyOrchestrator.startProject(telemetryProjId, 'Test App');
    await new Promise((resolve) => setTimeout(resolve, 200));

    const status = ContinuousCompanyOrchestrator.getStatus(telemetryProjId);

    expect(status.runningWorkers).toHaveLength(7); // CEO, PM, ARCH, DEV1, DEV2, QA, DEVOPS
    expect(status.timeline.length).toBeGreaterThan(0);
    expect(status.stopwatch).toBeDefined();
    expect(status.heartbeat).toBeDefined();
    expect(status.recommendations).toBeDefined();
  });
});
