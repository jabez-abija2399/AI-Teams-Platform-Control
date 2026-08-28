import { describe, it, expect, beforeEach } from 'vitest';
import { designArchitecture, buildHeuristicArchitecture } from '@/packages/agents/roles/architect/architect.service';
import { ProjectStateManager } from '@/core/state/project-state.manager';
import { ArtifactRegistryService } from '@/core/artifacts/artifact-registry.service';
import { AgentContractRegistry } from '@/core/contracts/agent-registry';

describe('Architect Agent Excellence', () => {
  const projectId = 'architect-test-project-1';

  const sampleRequirements = {
    title: 'Cloud Analytics Platform',
    features: [
      { name: 'User Authentication', description: 'Secure JWT authentication' },
      { name: 'Analytics Dashboard', description: 'Real-time telemetry and graphs' },
    ],
    constraints: ['TypeScript', 'PostgreSQL'],
  };

  beforeEach(async () => {
    await ProjectStateManager.getState(projectId);
  });

  it('1. Enforces strict Architect contract boundaries and responsibilities', () => {
    const contract = AgentContractRegistry.getContract('ARCHITECT');
    expect(contract.role).toBe('ARCHITECT');
    expect(contract.forbiddenActions).toContain('Write production application code or component implementations');
    expect(contract.forbiddenActions).toContain('Contradict approved PM requirements without explicit justification');
    expect(contract.outputArtifactType).toBe('ARCHITECTURE_SPECIFICATION');
  });

  it('2. Designs comprehensive architecture with database schema, API, and ADRs', async () => {
    const result = await designArchitecture(projectId, sampleRequirements);
    if (!result.success) console.error('[Architect Test 2 Error]', result);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const analysis = result.data;
    expect(analysis.architecture.frontend).toBeDefined();
    expect(analysis.architecture.backend).toBeDefined();
    expect(analysis.architecture.database).toBeDefined();
    expect(analysis.database.entities.length).toBeGreaterThan(0);
    expect(analysis.api.endpoints.length).toBeGreaterThan(0);
    expect(analysis.decisions.length).toBeGreaterThan(0);

    for (const decision of analysis.decisions) {
      expect(decision.technology).toBeDefined();
      expect(decision.reason).toBeDefined();
    }
  });

  it('3. Atomically updates ProjectStateManager with Architecture State and Stack Intent', async () => {
    await designArchitecture(projectId, sampleRequirements);

    const state = await ProjectStateManager.getState(projectId);
    expect(state.currentStage).toBe('ARCHITECTURE');
    expect(state.architecture.systemOverview).toBeDefined();
    expect(state.architecture.targetStack.frontend).toBeDefined();
    expect(state.architecture.techDecisions.length).toBeGreaterThan(0);
    expect(state.architecture.databaseSchema.entities.length).toBeGreaterThan(0);
    expect(state.architecture.apiDesign.endpoints.length).toBeGreaterThan(0);
  });

  it('4. Registers versioned envelopes in ArtifactRegistryService with quality scores', async () => {
    await designArchitecture(projectId, sampleRequirements);

    const latestArtifact = await ArtifactRegistryService.getLatestArtifact(projectId, 'ARCHITECTURE_SPECIFICATION');
    expect(latestArtifact).toBeDefined();
    expect(latestArtifact?.metadata.createdBy).toBe('ARCHITECT');
    expect(latestArtifact?.metadata.contentHash).toBeDefined();
    expect(latestArtifact?.metadata.qualityScore.completeness).toBeGreaterThanOrEqual(80);
    expect(latestArtifact?.metadata.qualityScore.verdict).toBe('APPROVED');
  });
});
