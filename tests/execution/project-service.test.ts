import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectExecutionService } from '../../src/core/execution-engine/project.service';

describe('Phase 16 — Project Execution Service', () => {
  let service: ProjectExecutionService;

  beforeEach(() => {
    service = new ProjectExecutionService();
  });

  it('should create a project with CREATED status', async () => {
    const project = await service.createProject({
      owner: 'user-1',
      name: 'My Portfolio',
      description: 'Build a modern portfolio website',
    });

    expect(project.id).toBeDefined();
    expect(project.name).toBe('My Portfolio');
    expect(project.status).toBe('CREATED');
    expect(project.owner).toBe('user-1');
    expect(project.currentWorkflow).toBe('SIMPLE_WEBSITE');
    expect(project.assignedAgents).toEqual(['CEO', 'FRONTEND', 'QA']);
  });

  it('should update project status through execution lifecycle', async () => {
    const project = await service.createProject({
      owner: 'user-1',
      name: 'SaaS App',
      description: 'Build an inventory SaaS',
      workflowId: 'LARGE_SAAS',
      assignedAgents: ['CEO', 'PRODUCT_MANAGER', 'ARCHITECT', 'DATABASE', 'BACKEND', 'FRONTEND', 'SECURITY', 'QA', 'DEVOPS'],
    });

    // Walk through project lifecycle
    const statuses = ['PLANNING', 'ARCHITECTURE', 'DEVELOPMENT', 'TESTING', 'DEPLOYMENT', 'COMPLETED'] as const;
    for (const status of statuses) {
      const updated = await service.updateProjectStatus(project.id, status);
      expect(updated?.status).toBe(status);
    }
  });

  it('should list projects by owner', async () => {
    await service.createProject({ owner: 'user-a', name: 'Project A', description: 'desc A' });
    await service.createProject({ owner: 'user-b', name: 'Project B', description: 'desc B' });
    await service.createProject({ owner: 'user-a', name: 'Project C', description: 'desc C' });

    const userAProjects = await service.listProjects('user-a');
    expect(userAProjects.length).toBe(2);

    const allProjects = await service.listProjects();
    expect(allProjects.length).toBeGreaterThanOrEqual(3);
  });
});
