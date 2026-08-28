import { describe, it, expect, beforeEach } from 'vitest';
import { refineRequirements, generateProductRequirementsSpec, buildHeuristicRefinedRequirements } from '@/packages/agents/roles/product-manager/product-manager.service';
import { ProjectStateManager } from '@/core/state/project-state.manager';
import { ArtifactRegistryService } from '@/core/artifacts/artifact-registry.service';
import { AgentContractRegistry } from '@/core/contracts/agent-registry';
import type { CEOAnalysis } from '@/packages/agents/roles/ceo/ceo.types';

describe('Product Manager (PM) Agent Excellence', () => {
  const projectId = 'pm-test-project-1';

  const sampleCEOAnalysis: CEOAnalysis = {
    strategy: {
      businessModel: 'B2B SaaS',
      monetization: 'Subscription',
      competitiveAdvantage: 'AI automated pipeline',
      marketOpportunity: 'High growth developer tools',
    },
    vision: {
      problemStatement: 'Developers struggle with orchestrating multiple AI agents',
      solution: 'AI Software Engineering Organization platform',
      targetAudience: 'Software Engineering Teams',
      coreValueProposition: 'Maximum reliable autonomy',
    },
    requirements: {
      features: [
        { name: 'Authentication and User Management' },
        { name: 'Mission Control Dashboard' },
        { name: 'Interactive Code Editor & Preview' },
      ],
      constraints: ['TypeScript only', 'PostgreSQL database'],
    },
    risks: [{ risk: 'Model hallucinations', mitigation: 'Deterministic validation' }],
    status: 'APPROVED',
  };

  beforeEach(async () => {
    await ProjectStateManager.getState(projectId);
  });

  it('1. Enforces strict PM contract boundaries and tools', () => {
    const contract = AgentContractRegistry.getContract('PM');
    expect(contract.role).toBe('PM');
    expect(contract.questionAnswered).toBe('WHAT are we building?');
    expect(contract.forbiddenActions).toContain('Write production implementation code');
    expect(contract.forbiddenActions).toContain('Design database schemas or API implementations');
  });

  it('2. Refines requirements into structured features and user stories', async () => {
    const result = await refineRequirements(projectId, sampleCEOAnalysis);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const { userStories, featureSpecs, nonFunctionalRequirements } = result.data;
    expect(userStories.length).toBeGreaterThan(0);
    expect(featureSpecs.length).toBeGreaterThan(0);
    expect(nonFunctionalRequirements.length).toBeGreaterThan(0);

    for (const story of userStories) {
      expect(story.id).toMatch(/^US-\d+/);
      expect(story.asA).toBeDefined();
      expect(story.iWant).toBeDefined();
      expect(story.soThat).toBeDefined();
      expect(Array.isArray(story.acceptanceCriteria)).toBe(true);
    }
  });

  it('3. Atomically updates ProjectStateManager with Single Source of Truth requirements', async () => {
    await refineRequirements(projectId, sampleCEOAnalysis);

    const state = await ProjectStateManager.getState(projectId);
    expect(state.currentStage).toBe('REQUIREMENTS');
    expect(state.requirements.approvalStatus).toBe('APPROVED');
    expect(state.requirements.features.length).toBeGreaterThan(0);
    expect(state.requirements.userStories.length).toBeGreaterThan(0);
  });

  it('4. Registers versioned envelopes in ArtifactRegistryService with quality scores', async () => {
    await refineRequirements(projectId, sampleCEOAnalysis);

    const latestArtifact = await ArtifactRegistryService.getLatestArtifact(projectId, 'PRODUCT_REQUIREMENTS_DOC');
    expect(latestArtifact).toBeDefined();
    expect(latestArtifact?.metadata.createdBy).toBe('PM');
    expect(latestArtifact?.metadata.contentHash).toBeDefined();
    expect(latestArtifact?.metadata.qualityScore.completeness).toBeGreaterThanOrEqual(80);
  });
});
