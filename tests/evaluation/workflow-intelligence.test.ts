import { describe, it, expect } from 'vitest';
import { selectWorkflowForInput } from '../../src/ai/router/workflow.selector';

describe('Phase 15 Workflow Intelligence Validation', () => {
  it('should select Simple Website Workflow for landing page prompt', () => {
    const res = selectWorkflowForInput('Create a landing page');
    expect(res.workflowId).toBe('SIMPLE_WEBSITE');
    expect(res.agents).toEqual(['CEO', 'FRONTEND', 'QA']);
  });

  it('should select Simple Website Workflow for personal portfolio prompt', () => {
    const res = selectWorkflowForInput('Create a personal portfolio website.');
    expect(res.workflowId).toBe('SIMPLE_WEBSITE');
    expect(res.agents).toEqual(['CEO', 'FRONTEND', 'QA']);
  });

  it('should select Enterprise Workflow (LARGE_SAAS) for banking platform prompt', () => {
    const res = selectWorkflowForInput('Create a banking platform');
    expect(res.workflowId).toBe('LARGE_SAAS');
    expect(res.agents).toEqual(['CEO', 'PRODUCT_MANAGER', 'ARCHITECT', 'DATABASE', 'BACKEND', 'FRONTEND', 'SECURITY', 'QA', 'DEVOPS']);
  });

  it('should select Enterprise Workflow for inventory management SaaS prompt', () => {
    const res = selectWorkflowForInput('Create an inventory management SaaS.');
    expect(res.workflowId).toBe('LARGE_SAAS');
    expect(res.agents).toEqual(['CEO', 'PRODUCT_MANAGER', 'ARCHITECT', 'DATABASE', 'BACKEND', 'FRONTEND', 'SECURITY', 'QA', 'DEVOPS']);
  });
});
