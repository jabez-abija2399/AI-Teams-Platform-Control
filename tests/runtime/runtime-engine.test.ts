import { describe, it, expect } from 'vitest';
import { AIRuntimeEngine } from '../../src/core/runtime/ai-runtime.engine';
import { TokenTrackerService } from '../../src/core/runtime/token-tracker.service';
import { CostTrackerService } from '../../src/core/runtime/cost-tracker.service';

describe('Phase 29 — AI Runtime Engine', () => {
  const projectId = 'proj_runtime_test';

  it('1. Creates execution, selects model, and returns completed result', async () => {
    const result = await AIRuntimeEngine.executeTask({
      projectId,
      agentRole: 'BACKEND_ENGINEER',
      taskId: 'task_auth_api',
      taskTitle: 'Create authentication API',
      taskDescription: 'Implement JWT login endpoints',
      systemPrompt: 'You are Backend Engineer AI. Implement auth API.',
    });

    expect(result.executionId).toBeDefined();
    expect(result.status).toBe('completed');
    expect(result.content).toContain('BACKEND_ENGINEER');
    expect(result.inputTokens).toBeGreaterThan(0);
    expect(result.outputTokens).toBeGreaterThan(0);
    expect(result.cost).toBeGreaterThan(0);
  });

  it('2. Stores execution and can retrieve it', async () => {
    const result = await AIRuntimeEngine.executeTask({
      projectId,
      agentRole: 'DATABASE_ENGINEER',
      taskId: 'task_schema',
      taskTitle: 'Design database schema',
      taskDescription: 'Create Prisma models for users',
      systemPrompt: 'You are Database Engineer AI.',
    });

    const stored = AIRuntimeEngine.getExecution(result.executionId);
    expect(stored).toBeDefined();
    expect(stored?.status).toBe('completed');
  });

  it('3. Tracks token usage across multiple executions', async () => {
    const pid = 'proj_token_track';
    await AIRuntimeEngine.executeTask({
      projectId: pid,
      agentRole: 'FRONTEND_ENGINEER',
      taskId: 'task_ui_1',
      taskTitle: 'Build dashboard component',
      taskDescription: 'React component',
      systemPrompt: 'You are Frontend Engineer AI.',
    });

    const usage = TokenTrackerService.getUsage(pid);
    expect(usage.totalInputTokens).toBeGreaterThan(0);
    expect(usage.totalOutputTokens).toBeGreaterThan(0);
    expect(usage.executionCount).toBeGreaterThanOrEqual(1);
  });

  it('4. Tracks cost per project', async () => {
    const pid = 'proj_cost_track';
    await AIRuntimeEngine.executeTask({
      projectId: pid,
      agentRole: 'QA_ENGINEER',
      taskId: 'task_test_1',
      taskTitle: 'Run Vitest suite',
      taskDescription: 'Automated tests',
      systemPrompt: 'You are QA Engineer AI.',
    });

    const cost = CostTrackerService.getProjectCost(pid);
    expect(cost).toBeGreaterThan(0);
  });
});
