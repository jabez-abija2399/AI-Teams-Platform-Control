import { describe, it, expect, beforeEach } from 'vitest';
import { generateUiDesignSpec, buildHeuristicUiDesignSpec } from '@/ai/agents/roles/ui-designer/ui-designer.service';
import { ProjectStateManager } from '@/core/state/project-state.manager';
import { ArtifactRegistryService } from '@/core/artifacts/artifact-registry.service';
import { AgentContractRegistry } from '@/core/contracts/agent-registry';

describe('Designer (UI/UX) Agent Excellence', () => {
  const projectId = 'designer-test-project-1';

  const sampleUserJourneys = {
    title: 'Financial Analytics Suite',
    screens: [
      { name: 'Dashboard Overview', description: 'Interactive portfolio graphs and real-time metric cards' },
      { name: 'Transaction History', description: 'Filterable data table with pagination and search' },
    ],
  };

  beforeEach(async () => {
    await ProjectStateManager.getState(projectId);
  });

  it('1. Enforces strict Designer contract boundaries and responsibilities', () => {
    const contract = AgentContractRegistry.getContract('DESIGNER');
    expect(contract.role).toBe('DESIGNER');
    expect(contract.questionAnswered).toBe('HOW should the user experience the product?');
    expect(contract.forbiddenActions).toContain('Write backend logic or database queries');
    expect(contract.forbiddenActions).toContain('Contradict technical framework constraints specified by Architect');
    expect(contract.outputArtifactType).toBe('UI_DESIGN_SPECIFICATION');
  });

  it('2. Generates comprehensive design tokens, component hierarchy, and responsive layouts', async () => {
    const result = await generateUiDesignSpec(projectId, sampleUserJourneys);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const spec = result.data;
    expect(spec.designTokens.colors.length).toBeGreaterThan(0);
    expect(spec.designTokens.typography.length).toBeGreaterThan(0);
    expect(spec.componentHierarchy.length).toBeGreaterThan(0);
    expect(spec.responsiveLayouts.length).toBeGreaterThan(0);
    expect(spec.cssVariablesManifest).toContain('--color');

    for (const comp of spec.componentHierarchy) {
      expect(comp.id).toBeDefined();
      expect(comp.name).toBeDefined();
      expect(comp.states).toBeDefined();
    }
  });

  it('3. Atomically updates ProjectStateManager with Design Tokens and Components', async () => {
    await generateUiDesignSpec(projectId, sampleUserJourneys);

    const state = await ProjectStateManager.getState(projectId);
    expect(state.currentStage).toBe('DESIGN');
    expect(state.design.designSystemName).toBeDefined();
    expect(Object.keys(state.design.designTokens.colors).length).toBeGreaterThan(0);
    expect(state.design.components.length).toBeGreaterThan(0);
    expect(state.design.cssVariablesManifest).toBeDefined();
  });

  it('4. Registers versioned envelopes in ArtifactRegistryService with quality scores', async () => {
    await generateUiDesignSpec(projectId, sampleUserJourneys);

    const latestArtifact = await ArtifactRegistryService.getLatestArtifact(projectId, 'UI_DESIGN_SPECIFICATION');
    expect(latestArtifact).toBeDefined();
    expect(latestArtifact?.metadata.createdBy).toBe('DESIGNER');
    expect(latestArtifact?.metadata.contentHash).toBeDefined();
    expect(latestArtifact?.metadata.qualityScore.completeness).toBeGreaterThanOrEqual(80);
    expect(latestArtifact?.metadata.qualityScore.verdict).toBe('APPROVED');
  });
});
