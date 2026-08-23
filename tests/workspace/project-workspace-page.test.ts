import { describe, it, expect, beforeEach } from 'vitest';
import { getProject } from '@/features/projects/services/project.service';
import { WorkspaceService } from '@/core/workspace/workspace.service';
import { ProjectStateManager } from '@/core/state/project-state.manager';
import { ArtifactRegistryService } from '@/core/artifacts/artifact-registry.service';
import { ArtifactManager } from '@/core/company-orchestration/artifact-manager';
import { buildHeuristicRefinedRequirements } from '@/ai/agents/roles/product-manager/product-manager.service';
import { buildHeuristicArchitecture } from '@/ai/agents/roles/architect/architect.service';
import { buildHeuristicUiDesignSpec } from '@/ai/agents/roles/ui-designer/ui-designer.service';
import { buildHeuristicImplementation } from '@/ai/agents/roles/developer/developer.service';
import { buildHeuristicQaReport } from '@/ai/agents/roles/qa/qa.service';

describe('Project Workspace Page Integration (/dashboard/projects/[id]/workspace)', () => {
  const projectId = 'cmt62tfvn000004l5y3s8ap1a';
  const ownerId = 'user_cmt62tfvn';

  beforeEach(async () => {
    await ProjectStateManager.getState(projectId);
  });

  it('1. Loads project metadata for /dashboard/projects/cmt62tfvn000004l5y3s8ap1a/workspace', async () => {
    const project = await getProject(projectId, ownerId);
    expect(project).toBeDefined();
    expect(project.id).toBe(projectId);
    expect(project.name).toBeDefined();
  });

  it('2. Initializes and manages Mission Control workspace state for the project', () => {
    const workspaceState = WorkspaceService.getWorkspaceState(projectId, 'Autonomous AI SaaS');
    expect(workspaceState.projectId).toBe(projectId);
    expect(workspaceState.timeline.length).toBeGreaterThanOrEqual(10);
    expect(workspaceState.employees.length).toBeGreaterThanOrEqual(5);

    const roles = workspaceState.employees.map((e) => e.role);
    expect(roles).toContain('PRODUCT_MANAGER');
    expect(roles).toContain('ARCHITECT');
    expect(roles).toContain('DEVELOPER');
    expect(roles).toContain('QA');
  });

  it('3. Populates Single Source of Truth ProjectState across all 5 agents for the workspace', async () => {
    const prd = buildHeuristicRefinedRequirements({ idea: 'Full stack booking portal' });
    const arch = buildHeuristicArchitecture(prd);
    const design = buildHeuristicUiDesignSpec(arch);
    const dev = buildHeuristicImplementation(arch);
    const qa = buildHeuristicQaReport(dev);

    // Atomically update state
    await ProjectStateManager.updateState(projectId, (s) => {
      s.currentStage = 'VERIFICATION';
      s.requirements.features = (prd.featureSpecs || [{ id: 'f1', name: 'Booking flow', description: 'Book items', linkedUserStories: [], acceptanceCriteria: [], dependencies: [] }]) as any;
      s.architecture.targetStack = { frontend: 'React', backend: 'Node' };
      s.design.components = (design.components || [
        {
          name: 'Header',
          filePath: 'src/components/Header.tsx',
          description: 'Navigation header',
          props: [],
          stateVariants: {},
          responsiveRules: { mobile: 'full', desktop: 'max-w-6xl' },
        },
      ]) as any;
      s.implementation.fileCount = dev.changes.length;
      s.qa.passed = qa.qualityReport.verdict === 'APPROVED';
    });

    const state = await ProjectStateManager.getState(projectId);
    expect(state.currentStage).toBe('VERIFICATION');
    expect(state.requirements.features.length).toBeGreaterThan(0);
    expect(state.design.components.length).toBeGreaterThan(0);
    expect(state.implementation.fileCount).toBeGreaterThan(0);
    expect(state.qa.passed).toBe(true);
  });

  it('4. Provides complete versioned deliverables for the Workspace Deliverables Panel', async () => {
    const prd = buildHeuristicRefinedRequirements({ idea: 'Full stack booking portal' });
    const arch = buildHeuristicArchitecture(prd);
    const design = buildHeuristicUiDesignSpec(arch);
    const dev = buildHeuristicImplementation(arch);
    const qa = buildHeuristicQaReport(dev);

    await Promise.all([
      ArtifactRegistryService.registerArtifact({
        projectId,
        type: 'PRODUCT_REQUIREMENTS_DOC',
        createdBy: 'PM',
        payload: prd,
        qualityScore: { completeness: 95, consistency: 95, requirementCoverage: 95, correctness: 95, technicalRisk: 5 },
      }),
      ArtifactRegistryService.registerArtifact({
        projectId,
        type: 'ARCHITECTURE_SPECIFICATION',
        createdBy: 'ARCHITECT',
        payload: arch,
        qualityScore: { completeness: 95, consistency: 95, requirementCoverage: 95, correctness: 95, technicalRisk: 5 },
      }),
      ArtifactRegistryService.registerArtifact({
        projectId,
        type: 'UI_DESIGN_SPECIFICATION',
        createdBy: 'DESIGNER',
        payload: design,
        qualityScore: { completeness: 95, consistency: 95, requirementCoverage: 95, correctness: 95, technicalRisk: 5 },
      }),
      ArtifactRegistryService.registerArtifact({
        projectId,
        type: 'IMPLEMENTATION_DELIVERABLE',
        createdBy: 'DEVELOPER',
        payload: dev,
        qualityScore: { completeness: 95, consistency: 95, requirementCoverage: 95, correctness: 95, technicalRisk: 5 },
      }),
      ArtifactRegistryService.registerArtifact({
        projectId,
        type: 'QA_VERIFICATION_REPORT',
        createdBy: 'QA',
        payload: qa,
        qualityScore: { completeness: 90, consistency: 90, requirementCoverage: 85, correctness: 95, technicalRisk: 10 },
      }),
      ArtifactManager.storeArtifact(projectId, {
        type: 'ArchitectureDocument',
        content: arch,
        producerRole: 'ARCHITECT',
        consumerRoles: ['DEVELOPER'],
        summary: 'Architecture Spec',
      }),
    ]);

    const prdArtifact = await ArtifactRegistryService.getLatestArtifact(projectId, 'PRODUCT_REQUIREMENTS_DOC');
    const archArtifact = await ArtifactRegistryService.getLatestArtifact(projectId, 'ARCHITECTURE_SPECIFICATION');
    const designArtifact = await ArtifactRegistryService.getLatestArtifact(projectId, 'UI_DESIGN_SPECIFICATION');
    const devArtifact = await ArtifactRegistryService.getLatestArtifact(projectId, 'IMPLEMENTATION_DELIVERABLE');
    const qaArtifact = await ArtifactRegistryService.getLatestArtifact(projectId, 'QA_VERIFICATION_REPORT');

    expect(prdArtifact).toBeDefined();
    expect(archArtifact).toBeDefined();
    expect(designArtifact).toBeDefined();
    expect(devArtifact).toBeDefined();
    expect(qaArtifact).toBeDefined();

    const amArch = await ArtifactManager.getLatestArtifact(projectId, 'ArchitectureDocument');
    expect(amArch.success).toBe(true);
    expect(amArch.data).toBeDefined();
  });
});
