import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { ExecutionQueueWorker } from '../../src/core/execution-engine/queue.worker';
import { TaskManagementEngine } from '../../src/core/execution-engine/task.engine';
import { AgentRole } from '../../src/packages/agents/core/agent.types';

describe('Phase 18 Gap 1 - Queue Locking Concurrency', () => {
  const projectId = `proj-concurrency-${Date.now()}`;
  const engine = new TaskManagementEngine();

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: `test-${Date.now()}@example.com`, name: 'Test User' }
    });
    await prisma.project.create({
      data: { id: projectId, name: 'Concurrency Test', ownerId: user.id }
    });

    await prisma.projectExecution.create({
      data: { id: projectId, projectId: projectId, workflowId: 'default', status: 'RUNNING' }
    });

    // Create 100 tasks
    const tasks = [];
    for (let i = 0; i < 100; i++) {
      tasks.push({
        id: `task-${projectId}-${i}`,
        executionId: projectId,
        agentRole: 'DEVELOPER' as AgentRole,
        taskType: 'agent_task',
        description: `Task ${i}`,
        status: 'PENDING',
      });
    }

    await prisma.executionTask.createMany({ data: tasks });
  });

  afterAll(async () => {
    await prisma.project.delete({ where: { id: projectId } });
  });

  it('should prevent duplicate execution across 10 workers for 100 tasks', async () => {
    // We mock executeTask to just mark it as COMPLETED to simulate quick work
    const mockWorkers = Array.from({ length: 10 }).map(() => {
      const worker = new ExecutionQueueWorker();
      // @ts-ignore - mock the execution
      worker.executeTask = async (taskId) => {
        await prisma.executionTask.updateMany({
          where: { id: taskId },
          data: { status: 'COMPLETED' }
        });
      };
      return worker;
    });

    const runWorkerLoopOnce = async (worker: ExecutionQueueWorker) => {
      let active = true;
      let processed = 0;
      while (active) {
        // @ts-ignore - access private method
        const didWork = await worker.processNextTask();
        if (didWork) processed++;
        else active = false; // no more tasks
      }
      return processed;
    };

    // Start all 10 workers concurrently
    const results = await Promise.all(mockWorkers.map(w => runWorkerLoopOnce(w)));
    
    const totalProcessed = results.reduce((sum, count) => sum + count, 0);
    expect(totalProcessed).toBe(100);

    const remainingPending = await prisma.executionTask.count({
      where: { executionId: projectId, status: 'PENDING' }
    });
    expect(remainingPending).toBe(0);

    const completed = await prisma.executionTask.count({
      where: { executionId: projectId, status: 'COMPLETED' }
    });
    expect(completed).toBe(100);

    // Verify exactly once (if any task was claimed twice, totalProcessed would be < 100 
    // because some worker would get a task, and another worker would get the same, 
    // but there are 100 tasks, so if totalProcessed == 100 and remaining == 0, it's exactly once)
  }, 30000);
});
