import { describe, it, expect } from 'vitest';
import { getWorkflow } from '../../src/core/workflow-engine/workflow.registry';
import { createWorkflowState, updateWorkflowState, getWorkflowState } from '../../src/core/workflow-engine/workflow.state';
import type { WorkflowStep } from '../../src/core/workflow-engine/workflow.types';

describe('E2E Full Agent Workflow Execution', () => {
  const e2eProjectId = 'e2e-inventory-saas-project';

  it('should step through the complete 9-step LARGE_SAAS workflow from CEO to DevOps', async () => {
    const saasWorkflow = getWorkflow('LARGE_SAAS');
    expect(saasWorkflow).toBeDefined();

    // 1. Initialize State with CEO Vision step
    const state = createWorkflowState('LARGE_SAAS', e2eProjectId, saasWorkflow!.initialStep);
    expect(state.currentStep).toBe('ceo_vision');

    // Expected sequence of steps for LARGE_SAAS pipeline
    const expectedSequence = [
      { step: 'ceo_vision', agent: 'CEO', expectedTask: 'Define SaaS Product Vision and Strategic Plan' },
      { step: 'pm_requirements', agent: 'PRODUCT_MANAGER', expectedTask: 'Refine Requirements and User Stories' },
      { step: 'architecture_design', agent: 'ARCHITECT', expectedTask: 'Design Complete SaaS Architecture and Database Schema' },
      { step: 'database_design', agent: 'DATABASE', expectedTask: 'Optimize Prisma Schema and Migration Plan' },
      { step: 'backend_implementation', agent: 'BACKEND', expectedTask: 'Implement Secure API Endpoints and Business Logic' },
      { step: 'frontend_implementation', agent: 'FRONTEND', expectedTask: 'Implement Responsive SaaS Dashboard UI Components' },
      { step: 'security_audit', agent: 'SECURITY', expectedTask: 'Conduct Security and Vulnerability Audit' },
      { step: 'qa_review', agent: 'QA', expectedTask: 'Execute Test Cases and Verify Acceptance Criteria' },
      { step: 'devops_deploy', agent: 'DEVOPS', expectedTask: 'Generate CI/CD Pipeline and Deployment Configurations' },
    ];

    let currentStepId: string | undefined = saasWorkflow!.initialStep;

    for (const expected of expectedSequence) {
      expect(currentStepId).toBe(expected.step);
      const stepDef: WorkflowStep | undefined = saasWorkflow!.steps[currentStepId!];
      expect(stepDef).toBeDefined();
      expect(stepDef?.agent).toBe(expected.agent);
      expect(stepDef?.taskTitle).toBe(expected.expectedTask);

      // Simulate successful agent task completion and artifact generation
      const simulatedOutput = {
        title: `${expected.agent} Artifact for Inventory Management SaaS`,
        status: 'APPROVED',
        qualityScore: { overall: 9, verdict: 'APPROVED' },
      };

      state.stepResults[currentStepId!] = simulatedOutput;
      state.history.push({
        step: currentStepId!,
        agent: stepDef!.agent,
        status: 'SUCCESS',
        timestamp: new Date(),
      });

      updateWorkflowState(e2eProjectId, {
        currentStep: stepDef?.next ?? 'DONE',
        stepResults: state.stepResults,
        history: state.history,
      });

      currentStepId = stepDef?.next;
    }

    // Verify workflow completes
    expect(currentStepId).toBeUndefined();
    updateWorkflowState(e2eProjectId, { status: 'COMPLETED' });

    const finalState = getWorkflowState(e2eProjectId);
    expect(finalState?.status).toBe('COMPLETED');
    expect(finalState?.history).toHaveLength(9);
    expect(finalState?.stepResults['ceo_vision']).toBeDefined();
    expect(finalState?.stepResults['pm_requirements']).toBeDefined();
    expect(finalState?.stepResults['architecture_design']).toBeDefined();
    expect(finalState?.stepResults['backend_implementation']).toBeDefined();
    expect(finalState?.stepResults['qa_review']).toBeDefined();
  });
});
