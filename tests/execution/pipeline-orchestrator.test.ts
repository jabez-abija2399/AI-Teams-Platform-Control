import { describe, it, expect } from 'vitest';
import { createPipelineOrchestrator } from '../../src/core/execution-engine/pipeline.orchestrator';
import { getExecutionVisibilityService } from '../../src/core/execution-engine/visibility.service';
import type { AgentRole } from '../../src/packages/agents/core/agent.types';

describe('Phase 16 — Pipeline Orchestrator (Full Workflow)', () => {
  it('should execute a Simple Website workflow end-to-end (CEO → Frontend → QA)', async () => {
    const executionLog: string[] = [];

    const orchestrator = createPipelineOrchestrator(async (params) => {
      executionLog.push(`${params.role}:${params.description}`);
      return {
        success: true,
        output: { role: params.role, generated: `[${params.role}] output for: ${params.description}` },
        qualityScore: 90,
      };
    });

    const result = await orchestrator.executeIdea({
      owner: 'user-test',
      name: 'Personal Portfolio',
      idea: 'Create a personal portfolio website with dark mode',
      autoApprove: true,
    });

    expect(result.status).toBe('COMPLETED');
    expect(result.tasksCompleted).toBe(3); // CEO, FRONTEND, QA
    expect(result.artifactsProduced).toBe(3);
    expect(result.tasksFailed).toBe(0);

    // Verify execution order
    expect(executionLog[0]).toContain('CEO');
    expect(executionLog[1]).toContain('FRONTEND');
    expect(executionLog[2]).toContain('QA');
  });

  it('should execute an Enterprise SaaS workflow end-to-end (9 steps)', async () => {
    const executionLog: AgentRole[] = [];

    const orchestrator = createPipelineOrchestrator(async (params) => {
      executionLog.push(params.role);
      return {
        success: true,
        output: { role: params.role, content: `${params.role} output` },
        qualityScore: 92,
      };
    });

    const result = await orchestrator.executeIdea({
      owner: 'user-enterprise',
      name: 'Inventory SaaS',
      idea: 'Create inventory management SaaS with authentication, roles, stock tracking, reports, and dashboard',
      autoApprove: true,
    });

    expect(result.status).toBe('COMPLETED');
    expect(result.tasksCompleted).toBe(9); // CEO, PM, ARCH, DB, BACKEND, FRONTEND, SECURITY, QA, DEVOPS
    expect(result.tasksFailed).toBe(0);

    // Verify DAG ordering
    expect(executionLog).toEqual([
      'CEO',
      'PRODUCT_MANAGER',
      'ARCHITECT',
      'DATABASE',
      'BACKEND',
      'FRONTEND',
      'SECURITY',
      'QA',
      'DEVOPS',
    ]);
  });

  it('should handle agent failure and retry logic', async () => {
    let frontendAttempts = 0;

    const orchestrator = createPipelineOrchestrator(async (params) => {
      if (params.role === 'FRONTEND') {
        frontendAttempts++;
        if (frontendAttempts < 3) {
          return { success: false, error: 'Missing responsive layout classes' };
        }
      }
      return {
        success: true,
        output: { role: params.role, content: 'Output OK' },
        qualityScore: 88,
      };
    });

    const result = await orchestrator.executeIdea({
      owner: 'user-retry',
      name: 'Retry Test',
      idea: 'Create a personal portfolio website',
      autoApprove: true,
    });

    expect(result.status).toBe('COMPLETED');
    expect(frontendAttempts).toBe(3); // Failed 2x, succeeded 3rd
    expect(result.tasksCompleted).toBe(3);
  });

  it('should produce Creator Mode visibility events', async () => {
    const visibilityService = getExecutionVisibilityService();

    const orchestrator = createPipelineOrchestrator(async (params) => ({
      success: true,
      output: { role: params.role },
      qualityScore: 90,
    }));

    const result = await orchestrator.executeIdea({
      owner: 'user-visibility',
      name: 'Visibility Test',
      idea: 'Build a simple blog website',
      autoApprove: true,
    });

    const creatorEvents = visibilityService.getCreatorModeEvents(result.projectId);
    expect(creatorEvents.length).toBeGreaterThan(0);

    // Creator Mode should have user-friendly messages only
    const messages = creatorEvents.map((e) => e.message);
    expect(messages.some((m) => m.includes('AI is'))).toBe(true);

    // Developer timeline
    const devTimeline = visibilityService.getDeveloperTimeline(result.projectId);
    expect(devTimeline.length).toBe(3); // 3 completed tasks
    expect(devTimeline.every((e) => e.status === 'COMPLETED')).toBe(true);
  });

  it('should handle complete failure when all retries are exhausted', async () => {
    const orchestrator = createPipelineOrchestrator(async (params) => {
      if (params.role === 'CEO') {
        return { success: false, error: 'LLM API rate limit exceeded' };
      }
      return { success: true, output: {}, qualityScore: 90 };
    });

    const result = await orchestrator.executeIdea({
      owner: 'user-fail',
      name: 'Failure Test',
      idea: 'Create a simple landing page website',
      autoApprove: true,
    });

    expect(result.status).toBe('FAILED');
    expect(result.tasksFailed).toBeGreaterThan(0);
  });
});
