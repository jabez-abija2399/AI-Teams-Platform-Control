import { describe, it, expect, beforeAll } from 'vitest';
import { createProject, getProject } from '@/features/projects/services/project.service';
import { WorkspaceService } from '@/core/workspace/workspace.service';
import { ProjectStateManager } from '@/core/state/project-state.manager';
import { ArtifactRegistryService } from '@/core/artifacts/artifact-registry.service';
import { ArtifactManager } from '@/core/company-orchestration/artifact-manager';
import { buildHeuristicCEOAnalysis } from '@/ai/agents/roles/ceo/ceo.service';
import { buildHeuristicRefinedRequirements } from '@/ai/agents/roles/product-manager/product-manager.service';
import { buildHeuristicArchitecture } from '@/ai/agents/roles/architect/architect.service';
import { buildHeuristicUiDesignSpec } from '@/ai/agents/roles/ui-designer/ui-designer.service';
import { buildHeuristicImplementation } from '@/ai/agents/roles/developer/developer.service';
import { buildHeuristicQaReport } from '@/ai/agents/roles/qa/qa.service';
import { ReviewCommittee } from '@/core/review-committee/review-committee';

describe('End-to-End Project Journey (Creation → Strategy → PRD → Architecture → Design → Code → QA → Release)', () => {
  const userId = 'user_e2e_owner';
  let projectId: string;
  let idea: string;

  beforeAll(async () => {
    idea = 'A complete real-time collaborative whiteboard app for engineering teams';
  });

  it('Step 1: Creates project from idea and stack catalog', async () => {
    const createRes = await createProject(userId, {
      name: 'CollabBoard AI',
      description: idea,
      stack: 'react',
    });

    expect(createRes.success).toBe(true);
    expect(createRes.data).toBeDefined();
    projectId = createRes.data!.id;
    expect(projectId).toBeDefined();

    // Verify project can be retrieved
    const fetched = await getProject(projectId, userId);
    expect(fetched.id).toBe(projectId);
    expect(fetched.name).toBe('CollabBoard AI');
  });

  it('Step 2: Initializes Mission Control workspace state & employee roster', () => {
    const wsState = WorkspaceService.getWorkspaceState(projectId, 'CollabBoard AI');
    expect(wsState.projectId).toBe(projectId);
    expect(wsState.timeline.length).toBeGreaterThanOrEqual(10);
    expect(wsState.employees.length).toBeGreaterThanOrEqual(5);

    // Verify active AI roles
    const employeeRoles = wsState.employees.map((e) => e.role);
    expect(employeeRoles).toContain('PRODUCT_MANAGER');
    expect(employeeRoles).toContain('ARCHITECT');
    expect(employeeRoles).toContain('DEVELOPER');
    expect(employeeRoles).toContain('QA');
  });

  it('Step 3: CEO Agent formulates Executive Strategy & Business Analysis', async () => {
    const ceoAnalysis = buildHeuristicCEOAnalysis(idea);
    expect(ceoAnalysis.vision).toBeDefined();
    expect(ceoAnalysis.requirements.features.length).toBeGreaterThan(0);
    expect(ceoAnalysis.plan.phases.length).toBeGreaterThan(0);

    await ArtifactManager.storeArtifact(projectId, {
      type: 'BusinessStrategy',
      content: ceoAnalysis,
      producerRole: 'CEO',
      consumerRoles: ['PRODUCT_MANAGER'],
      summary: 'Executive Strategy and Core Vision',
    });

    const stored = await ArtifactManager.getLatestArtifact(projectId, 'BusinessStrategy');
    expect(stored.success).toBe(true);
  });

  it('Step 4: PM Agent generates PRD & registers PRODUCT_REQUIREMENTS_DOC', async () => {
    const prd = buildHeuristicRefinedRequirements({ idea });
    expect(prd.featureSpecs.length).toBeGreaterThan(0);
    expect(prd.userStories.length).toBeGreaterThan(0);

    // Register typed artifact envelope
    const envelope = await ArtifactRegistryService.registerArtifact({
      projectId,
      type: 'PRODUCT_REQUIREMENTS_DOC',
      createdBy: 'PM',
      payload: prd,
      qualityScore: { completeness: 95, consistency: 95, requirementCoverage: 95, correctness: 95, technicalRisk: 5 },
    });
    expect(envelope.metadata.artifactId).toBeDefined();
    expect(envelope.metadata.qualityScore.completeness).toBe(95);

    // Sync Single Source of Truth
    await ProjectStateManager.updateState(projectId, (s) => {
      s.currentStage = 'ANALYSIS';
      s.requirements.features = prd.featureSpecs as any;
      s.requirements.userStories = prd.userStories as any;
    });

    const state = await ProjectStateManager.getState(projectId);
    expect(state.requirements.features.length).toBeGreaterThan(0);
  });

  it('Step 5: Software Architect Agent designs Architecture, File Structure, Schema & API', async () => {
    const prd = buildHeuristicRefinedRequirements({ idea });
    const arch = buildHeuristicArchitecture(prd);

    expect(arch.fileStructure.length).toBeGreaterThan(0);
    expect(arch.api.endpoints.length).toBeGreaterThan(0);
    expect(arch.decisions.length).toBeGreaterThan(0);
    expect(arch.implementationTodos.length).toBeGreaterThan(0);

    const envelope = await ArtifactRegistryService.registerArtifact({
      projectId,
      type: 'ARCHITECTURE_SPECIFICATION',
      createdBy: 'ARCHITECT',
      payload: arch,
      qualityScore: { completeness: 95, consistency: 95, requirementCoverage: 95, correctness: 95, technicalRisk: 5 },
    });
    expect(envelope.metadata.artifactId).toBeDefined();

    await ProjectStateManager.updateState(projectId, (s) => {
      s.currentStage = 'DESIGN';
      s.architecture.targetStack = { frontend: arch.architecture.frontend, backend: arch.architecture.backend };
      s.architecture.fileStructure = arch.fileStructure as any;
      s.architecture.databaseSchema = { tables: [] } as any;
      s.architecture.apiDesign = { endpoints: arch.api.endpoints } as any;
    });

    const state = await ProjectStateManager.getState(projectId);
    expect(state.architecture.fileStructure.length).toBeGreaterThan(0);
  });

  it('Step 6: UI Designer Agent creates Tokens, Component Hierarchy & Responsive Rules', async () => {
    const prd = buildHeuristicRefinedRequirements({ idea });
    const arch = buildHeuristicArchitecture(prd);
    const design = buildHeuristicUiDesignSpec(arch);

    expect(design.designTokens.colors.length).toBeGreaterThan(0);
    expect(design.responsiveLayouts.length).toBeGreaterThan(0);

    const envelope = await ArtifactRegistryService.registerArtifact({
      projectId,
      type: 'UI_DESIGN_SPECIFICATION',
      createdBy: 'DESIGNER',
      payload: design,
      qualityScore: { completeness: 95, consistency: 95, requirementCoverage: 95, correctness: 95, technicalRisk: 5 },
    });
    expect(envelope.metadata.artifactId).toBeDefined();

    await ProjectStateManager.updateState(projectId, (s) => {
      s.currentStage = 'IMPLEMENTATION';
      s.design.tokens = design.designTokens as any;
      s.design.components = [
        {
          name: 'WhiteboardCanvas',
          filePath: 'src/components/WhiteboardCanvas.tsx',
          description: 'Interactive canvas',
          props: [],
          stateVariants: {},
          responsiveRules: { mobile: 'full', desktop: 'max-w-7xl' },
        },
      ] as any;
      s.design.responsiveRules = { mobile: 'full', desktop: 'max-w-7xl' } as any;
    });

    const state = await ProjectStateManager.getState(projectId);
    expect(state.design.components.length).toBeGreaterThan(0);
  });

  it('Step 7: Developer Agent generates complete file-by-file implementation', async () => {
    const prd = buildHeuristicRefinedRequirements({ idea });
    const arch = buildHeuristicArchitecture(prd);
    const dev = buildHeuristicImplementation(arch);

    expect(dev.changes.length).toBeGreaterThan(0);

    const envelope = await ArtifactRegistryService.registerArtifact({
      projectId,
      type: 'IMPLEMENTATION_DELIVERABLE',
      createdBy: 'DEVELOPER',
      payload: dev,
      qualityScore: { completeness: 95, consistency: 95, requirementCoverage: 95, correctness: 95, technicalRisk: 5 },
    });
    expect(envelope.metadata.artifactId).toBeDefined();

    const fileMap: Record<string, string> = {};
    for (const c of dev.changes) {
      fileMap[c.file] = c.content;
    }

    await ProjectStateManager.updateState(projectId, (s) => {
      s.currentStage = 'VERIFICATION';
      s.implementation.files = fileMap;
      s.implementation.fileCount = dev.changes.length;
      s.implementation.lastBuildStatus = 'SUCCESS';
    });

    const state = await ProjectStateManager.getState(projectId);
    expect(state.implementation.fileCount).toBeGreaterThan(0);
    expect(Object.keys(state.implementation.files).length).toBeGreaterThan(0);
  });

  it('Step 8: QA Agent verifies implementation, generates test cases & defect report', async () => {
    const prd = buildHeuristicRefinedRequirements({ idea });
    const arch = buildHeuristicArchitecture(prd);
    const dev = buildHeuristicImplementation(arch);
    const qa = buildHeuristicQaReport(dev);

    expect(qa.testPlan.tests.length).toBeGreaterThan(0);
    expect(qa.qualityReport.verdict).toBe('APPROVED');

    const envelope = await ArtifactRegistryService.registerArtifact({
      projectId,
      type: 'QA_VERIFICATION_REPORT',
      createdBy: 'QA',
      payload: qa,
      qualityScore: { completeness: 95, consistency: 95, requirementCoverage: 90, correctness: 95, technicalRisk: 5 },
    });
    expect(envelope.metadata.artifactId).toBeDefined();

    await ProjectStateManager.updateState(projectId, (s) => {
      s.currentStage = 'VERIFICATION';
      s.qa.passed = qa.qualityReport.verdict === 'APPROVED';
      s.qa.testCoverage = 95;
      s.qa.defects = [];
    });

    const state = await ProjectStateManager.getState(projectId);
    expect(state.qa.passed).toBe(true);
  });

  it('Step 9: Review Committee evaluates codebase and approves release', async () => {
    const fileMap: Record<string, string> = {
      'src/App.tsx': 'export function App() { return <div>CollabBoard</div>; }',
      'src/components/Canvas.tsx': 'export function Canvas() { return <canvas />; }',
    };
    const review = ReviewCommittee.evaluateCodebase(projectId, fileMap);

    expect(review).toBeDefined();
    expect(review.decision).toBe('APPROVED');
    expect(review.overallScore).toBeGreaterThanOrEqual(70);
  });

  it('Step 10: Marks pipeline complete and verifies final deliverables in Workspace', async () => {
    WorkspaceService.markPipelineCompleted(projectId);
    const wsState = WorkspaceService.getWorkspaceState(projectId, 'CollabBoard AI');
    expect(wsState.currentPhase.toLowerCase()).toBe('completed');

    // Populate all 5 deliverables for DeliverablesPanel
    const prd = buildHeuristicRefinedRequirements({ idea });
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
      }),
      ArtifactRegistryService.registerArtifact({
        projectId,
        type: 'ARCHITECTURE_SPECIFICATION',
        createdBy: 'ARCHITECT',
        payload: arch,
      }),
      ArtifactRegistryService.registerArtifact({
        projectId,
        type: 'UI_DESIGN_SPECIFICATION',
        createdBy: 'DESIGNER',
        payload: design,
      }),
      ArtifactRegistryService.registerArtifact({
        projectId,
        type: 'IMPLEMENTATION_DELIVERABLE',
        createdBy: 'DEVELOPER',
        payload: dev,
      }),
      ArtifactRegistryService.registerArtifact({
        projectId,
        type: 'QA_VERIFICATION_REPORT',
        createdBy: 'QA',
        payload: qa,
      }),
    ]);

    const [prdArt, archArt, designArt, devArt, qaArt] = await Promise.all([
      ArtifactRegistryService.getLatestArtifact(projectId, 'PRODUCT_REQUIREMENTS_DOC'),
      ArtifactRegistryService.getLatestArtifact(projectId, 'ARCHITECTURE_SPECIFICATION'),
      ArtifactRegistryService.getLatestArtifact(projectId, 'UI_DESIGN_SPECIFICATION'),
      ArtifactRegistryService.getLatestArtifact(projectId, 'IMPLEMENTATION_DELIVERABLE'),
      ArtifactRegistryService.getLatestArtifact(projectId, 'QA_VERIFICATION_REPORT'),
    ]);

    expect(prdArt).toBeDefined();
    expect(archArt).toBeDefined();
    expect(designArt).toBeDefined();
    expect(devArt).toBeDefined();
    expect(qaArt).toBeDefined();

    // Verify Single Source of Truth
    await ProjectStateManager.updateState(projectId, (s) => {
      s.currentStage = 'VERIFICATION';
      s.requirements.features = prd.featureSpecs as any;
      s.architecture.fileStructure = arch.fileStructure as any;
      s.design.components = [{ name: 'Canvas', filePath: 'src/Canvas.tsx', description: 'Canvas', props: [], stateVariants: {}, responsiveRules: { mobile: 'full', desktop: 'max-w-6xl' } }] as any;
      s.implementation.fileCount = dev.changes.length;
      s.qa.passed = true;
    });

    const state = await ProjectStateManager.getState(projectId);
    expect(state.requirements.features.length).toBeGreaterThan(0);
    expect(state.architecture.fileStructure.length).toBeGreaterThan(0);
    expect(state.design.components.length).toBeGreaterThan(0);
    expect(state.implementation.fileCount).toBeGreaterThan(0);
    expect(state.qa.passed).toBe(true);
  });
});
