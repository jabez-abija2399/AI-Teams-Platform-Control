import { describe, it, expect } from 'vitest';
import { CoreOrchestratorEngine } from '../../src/core/orchestrator/orchestrator.engine';
import { ProjectStateManager } from '../../src/core/state/project-state.manager';

describe('CoreOrchestratorEngine Autonomous Execution', () => {
  const projectId = 'proj_orch_test_1';

  it('should autonomously execute a software engineering mission through all stages', async () => {
    const result = await CoreOrchestratorEngine.executeMission({
      projectId,
      mission: 'Build an interactive customer feedback analytics dashboard with category breakdown',
      autoApprove: true,
    });

    expect(result.status).toBe('COMPLETED');
    expect(result.stagesCompleted).toContain('REQUIREMENTS');
    expect(result.stagesCompleted).toContain('ARCHITECTURE');
    expect(result.stagesCompleted).toContain('DESIGN');
    expect(result.stagesCompleted).toContain('VERIFICATION');
    expect(result.qualityScore).toBeGreaterThanOrEqual(80);

    const state = await ProjectStateManager.getState(projectId);
    expect(state.status).toBe('COMPLETED');
    expect(state.requirements.features.length).toBeGreaterThan(0);
    expect(state.architecture.fileStructure.length).toBeGreaterThan(0);
    expect(state.design.components.length).toBeGreaterThan(0);
    expect(state.implementation.fileCount).toBeGreaterThanOrEqual(5);
    expect(state.qa.passed).toBe(true);
  });

  it('should pause at WAITING_FOR_APPROVAL when autoApprove is false', async () => {
    const approvalProjectId = 'proj_orch_approval_test';
    const result = await CoreOrchestratorEngine.executeMission({
      projectId: approvalProjectId,
      mission: 'Build an e-commerce checkout flow',
      autoApprove: false,
    });

    expect(result.status).toBe('WAITING_FOR_APPROVAL');
    const state = await ProjectStateManager.getState(approvalProjectId);
    expect(state.status).toBe('WAITING_FOR_APPROVAL');
  });
});
