import { describe, it, expect } from 'vitest';
import { TaskManagementEngine } from '../../src/core/execution-engine/task.engine';

describe('Phase 16 — Task Management Engine', () => {
  it('should create tasks with PENDING status and resolve dependencies', async () => {
    const engine = new TaskManagementEngine();
    const projectId = `proj-deps-${Date.now()}`;

    const ceoTask = await engine.createTask({
      projectId,
      agentRole: 'CEO',
      description: 'Define product vision',
      priority: 'HIGH',
    });

    const archTask = await engine.createTask({
      projectId,
      agentRole: 'ARCHITECT',
      description: 'Design architecture',
      dependencies: [ceoTask.id],
    });

    expect(ceoTask.status).toBe('PENDING');
    expect(archTask.dependencies).toEqual([ceoTask.id]);

    // CEO task should be ready (no dependencies)
    const ready1 = await engine.getReadyTasks(projectId);
    expect(ready1.length).toBe(1);
    expect(ready1[0]?.agentRole).toBe('CEO');

    // Complete CEO task
    await engine.updateTaskStatus(ceoTask.id, 'COMPLETED');

    // Now ARCHITECT should be ready
    const ready2 = await engine.getReadyTasks(projectId);
    expect(ready2.length).toBe(1);
    expect(ready2[0]?.agentRole).toBe('ARCHITECT');
  });

  it('should track task state transitions correctly', async () => {
    const engine = new TaskManagementEngine();
    const projectId = `proj-transitions-${Date.now()}`;

    const task = await engine.createTask({
      projectId,
      agentRole: 'FRONTEND',
      description: 'Build UI',
    });

    await engine.updateTaskStatus(task.id, 'ASSIGNED');
    let updated = await engine.getTask(task.id);
    expect(updated?.status).toBe('ASSIGNED');

    await engine.updateTaskStatus(task.id, 'RUNNING');
    updated = await engine.getTask(task.id);
    expect(updated?.status).toBe('RUNNING');

    await engine.updateTaskStatus(task.id, 'COMPLETED');
    updated = await engine.getTask(task.id);
    expect(updated?.status).toBe('COMPLETED');
    expect(updated?.completedAt).toBeDefined();
  });

  it('should sort ready tasks by priority', async () => {
    const engine = new TaskManagementEngine();
    const projectId = `proj-priority-${Date.now()}`;

    await engine.createTask({
      projectId,
      agentRole: 'QA',
      description: 'Run tests',
      priority: 'LOW',
    });

    await engine.createTask({
      projectId,
      agentRole: 'SECURITY',
      description: 'Security audit',
      priority: 'URGENT',
    });

    await engine.createTask({
      projectId,
      agentRole: 'FRONTEND',
      description: 'Build UI',
      priority: 'MEDIUM',
    });

    const ready = await engine.getReadyTasks(projectId);
    expect(ready.length).toBe(3);
    expect(ready[0]?.priority).toBe('URGENT');
    expect(ready[1]?.priority).toBe('MEDIUM');
    expect(ready[2]?.priority).toBe('LOW');
  });

  it('should correctly detect all tasks completed', async () => {
    const engine = new TaskManagementEngine();
    const projectId = `proj-complete-${Date.now()}`;

    const t1 = await engine.createTask({ projectId, agentRole: 'CEO', description: 'CEO task' });
    const t2 = await engine.createTask({ projectId, agentRole: 'QA', description: 'QA task', dependencies: [t1.id] });

    expect(await engine.areAllTasksCompleted(projectId)).toBe(false);

    await engine.updateTaskStatus(t1.id, 'COMPLETED');
    expect(await engine.areAllTasksCompleted(projectId)).toBe(false);

    await engine.updateTaskStatus(t2.id, 'COMPLETED');
    expect(await engine.areAllTasksCompleted(projectId)).toBe(true);
  });
});
