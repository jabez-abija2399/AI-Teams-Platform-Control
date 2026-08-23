import { describe, it, expect, beforeEach } from 'vitest';
import { implementFromArchitectureTodos, buildHeuristicImplementation } from '@/ai/agents/roles/developer/developer.service';
import { ProjectStateManager } from '@/core/state/project-state.manager';
import { ArtifactRegistryService } from '@/core/artifacts/artifact-registry.service';
import { AgentContractRegistry } from '@/core/contracts/agent-registry';
import { persistDeliveryPlan } from '@/core/company-orchestration/implementation-todo.store';

describe('Developer Agent Excellence', () => {
  const projectId = 'developer-test-project-1';

  const sampleArchitecture = {
    title: 'Customer Relationship Portal',
    architecture: {
      frontend: 'React + Vite SPA with responsive dashboard',
      backend: 'Express.js REST API with authentication',
      database: 'PostgreSQL database with Customers and Deals tables',
      infrastructure: 'Docker containers on Cloud Run',
      security: 'JWT token auth with rate limiting',
    },
    database: {
      entities: [
        { name: 'Customer', fields: [{ name: 'id', type: 'string' }, { name: 'email', type: 'string' }] },
      ],
      relationships: [],
      indexes: [],
      constraints: [],
    },
    api: {
      endpoints: [
        { path: '/api/customers', method: 'GET', request: '', response: 'Customer[]' },
      ],
    },
    decisions: [
      { technology: 'Vite', reason: 'Fast HMR', alternative: 'Webpack', tradeoff: 'Modern tooling only' },
    ],
    fileStructure: [
      { path: 'src/App.tsx', purpose: 'Main UI app component' },
      { path: 'src/main.tsx', purpose: 'Client entry point' },
      { path: 'index.html', purpose: 'Root HTML file' },
    ],
    implementationTodos: [
      { id: 'todo-1', title: 'Setup Root HTML', file: 'index.html', dependsOn: [] },
      { id: 'todo-2', title: 'Setup App Component', file: 'src/App.tsx', dependsOn: ['todo-1'] },
    ],
    qaTodos: [
      { id: 'qa-1', title: 'Verify Root HTML renders' },
    ],
  };

  beforeEach(async () => {
    await ProjectStateManager.getState(projectId);
    await persistDeliveryPlan(projectId, {
      fileStructure: sampleArchitecture.fileStructure,
      implementationTodos: sampleArchitecture.implementationTodos,
      qaTodos: sampleArchitecture.qaTodos,
    });
  });

  it('1. Enforces strict Developer contract boundaries and tool permissions', () => {
    const contract = AgentContractRegistry.getContract('DEVELOPER');
    expect(contract.role).toBe('DEVELOPER');
    expect(contract.questionAnswered).toBe('HOW do we implement the approved product?');
    expect(contract.forbiddenActions).toContain('Blindly rewrite the entire project from scratch');
    expect(contract.forbiddenActions).toContain('Hardcode credentials or secrets in client-side code');
    expect(contract.outputArtifactType).toBe('IMPLEMENTATION_DELIVERABLE');
  });

  it('2. Implements code incrementally from architecture todos', async () => {
    const result = await implementFromArchitectureTodos(projectId, sampleArchitecture as any);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const output = result.data;
    expect(output.changes.length).toBeGreaterThan(0);
    expect(output.report.completed).toBe(true);
    expect(output.report.changedFiles.length).toBeGreaterThan(0);

    for (const change of output.changes) {
      expect(change.file).toBeDefined();
      expect(change.code).toBeDefined();
    }
  });

  it('3. Atomically updates ProjectStateManager with Implementation Files and Completed Todos', async () => {
    await implementFromArchitectureTodos(projectId, sampleArchitecture as any);

    const state = await ProjectStateManager.getState(projectId);
    expect(state.currentStage).toBe('DEVELOPMENT');
    expect(state.implementation.completedTodos.length).toBeGreaterThan(0);
    expect(state.implementation.pendingTodos.length).toBe(0);
    expect(Object.keys(state.implementation.files).length).toBeGreaterThan(0);
  });

  it('4. Registers versioned envelopes in ArtifactRegistryService with quality scores', async () => {
    await implementFromArchitectureTodos(projectId, sampleArchitecture as any);

    const latestArtifact = await ArtifactRegistryService.getLatestArtifact(projectId, 'IMPLEMENTATION_DELIVERABLE');
    expect(latestArtifact).toBeDefined();
    expect(latestArtifact?.metadata.createdBy).toBe('DEVELOPER');
    expect(latestArtifact?.metadata.contentHash).toBeDefined();
    expect(latestArtifact?.metadata.qualityScore.completeness).toBeGreaterThanOrEqual(80);
    expect(latestArtifact?.metadata.qualityScore.verdict).toBe('APPROVED');
  });
});
