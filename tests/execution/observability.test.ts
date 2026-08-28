import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { ObservabilityService } from '../../src/core/execution-engine/observability.service';
import { AgentRole } from '../../src/packages/agents/core/agent.types';

describe('Phase 19 - Observability Service', () => {
  const projectId = `proj-obs-${Date.now()}`;
  const service = new ObservabilityService();

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: `obs-${Date.now()}@example.com`, name: 'Obs User' }
    });
    
    await prisma.project.create({
      data: { id: projectId, name: 'Observability Test', ownerId: user.id }
    });

    const exec = await prisma.projectExecution.create({
      data: { id: projectId, projectId, workflowId: 'default', status: 'RUNNING' }
    });

    const task = await prisma.executionTask.create({
      data: {
        id: `task-${projectId}`,
        executionId: exec.id,
        agentRole: 'FRONTEND',
        taskType: 'agent_task',
        description: 'Build UI',
        status: 'COMPLETED',
      }
    });

    await prisma.agentRun.create({
      data: {
        taskId: task.id,
        agentRole: 'FRONTEND',
        modelUsed: 'test-model',
        promptTokens: 1000,
        completionTokens: 500,
        status: 'SUCCESS',
        duration: 2000,
      }
    });
  });

  afterAll(async () => {
    await prisma.project.delete({ where: { id: projectId } });
  });

  it('should return correct project dashboard status', async () => {
    const dash = await service.getProjectDashboard(projectId);
    expect(dash.status).toBe('RUNNING');
    expect(dash.completedTasks).toBe(1);
    expect((dash as any).totalTasks).toBeUndefined(); // we didn't return totalTasks directly, wait
    expect(dash.progress).toBe(100);
  });

  it('should return correct agent analytics metrics', async () => {
    const analytics = await service.getAgentAnalytics(projectId);
    expect(analytics.length).toBe(1);
    const frontendStats = analytics[0];
    expect(frontendStats).toBeDefined();
    expect(frontendStats?.role).toBe('FRONTEND');
    expect(frontendStats?.tasksCompleted).toBe(1);
    expect(frontendStats?.successRate).toBe(100);
    expect(frontendStats?.averageDuration).toBe(2000);
    expect(frontendStats?.tokenUsage).toBe(1500);
    expect(frontendStats?.cost).toBe((1500 / 1000) * 0.02);
  });
});
