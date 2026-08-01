import { describe, it, expect, beforeEach } from 'vitest';
import { getWorkflow, getAllWorkflows } from '../../src/core/workflow-engine/workflow.registry';
import { createWorkflowState, getWorkflowState, updateWorkflowState, clearWorkflowState } from '../../src/core/workflow-engine/workflow.state';

describe('Workflow Engine & Orchestrator', () => {
  const testProjectId = 'test-project-123';

  beforeEach(() => {
    clearWorkflowState(testProjectId);
  });

  it('should have SIMPLE_WEBSITE and LARGE_SAAS preset workflows registered', () => {
    const simple = getWorkflow('SIMPLE_WEBSITE');
    const saas = getWorkflow('LARGE_SAAS');

    expect(simple).toBeDefined();
    expect(simple?.initialStep).toBe('ceo_vision');
    expect(simple?.steps?.['ceo_vision']?.next).toBe('frontend_implementation');
    expect(simple?.steps?.['frontend_implementation']?.next).toBe('qa_review');

    expect(saas).toBeDefined();
    expect(saas?.initialStep).toBe('ceo_vision');
    expect(saas?.steps?.['pm_requirements']?.next).toBe('architecture_design');
    expect(saas?.steps?.['architecture_design']?.next).toBe('database_design');
  });

  it('should manage workflow execution state across transitions', () => {
    const state = createWorkflowState('SIMPLE_WEBSITE', testProjectId, 'ceo_vision');
    expect(state.workflowId).toBe('SIMPLE_WEBSITE');
    expect(state.currentStep).toBe('ceo_vision');
    expect(state.status).toBe('RUNNING');

    const updated = updateWorkflowState(testProjectId, {
      currentStep: 'frontend_implementation',
      stepResults: { ceo_vision: { vision: 'Landing page' } },
    });

    expect(updated?.currentStep).toBe('frontend_implementation');
    expect(updated?.stepResults['ceo_vision']).toEqual({ vision: 'Landing page' });

    const retrieved = getWorkflowState(testProjectId);
    expect(retrieved?.currentStep).toBe('frontend_implementation');
  });

  it('should clear workflow state when cleared', () => {
    createWorkflowState('SIMPLE_WEBSITE', testProjectId, 'ceo_vision');
    expect(getWorkflowState(testProjectId)).toBeDefined();
    clearWorkflowState(testProjectId);
    expect(getWorkflowState(testProjectId)).toBeUndefined();
  });
});
