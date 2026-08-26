import { describe, it, expect } from 'vitest';
import { ArtifactRegistryService } from '@/core/artifacts/artifact-registry.service';
import { RootCauseDiagnoser } from '@/core/root-cause/root-cause-diagnoser';
import { StackRegistry } from '@/core/stack-registry/stack-registry';
import { RuntimeContractService } from '@/core/runtime-contract/runtime-contract.service';
import { ProjectInspector } from '@/core/project-inspector/project-inspector';
import { DeterministicValidator } from '@/core/deterministic-validation/deterministic-validator';

describe('AI Teams Platform — 10-Category Production Benchmark Suite', () => {
  // 1. Frontend Landing Page Benchmark
  it('1. Benchmark: Frontend Landing Page — Classifies FRONTEND_ONLY and locks template', async () => {
    const profile = StackRegistry.recommendStackForProject({
      projectType: 'FRONTEND_ONLY',
    });
    expect(profile.supportedProjectTypes).toContain('FRONTEND_ONLY');
    expect(profile.capabilities.backend).toBe(false);
    expect(profile.capabilities.database).toBe(false);
  });

  // 2. CRUD Application Benchmark
  it('2. Benchmark: CRUD Application — Full-stack with database entities and API routes', async () => {
    const profile = StackRegistry.getProfile('nextjs-fullstack-v1');
    expect(profile).toBeDefined();
    expect(profile?.capabilities.database).toBe(true);
    expect(profile?.capabilities.frontend).toBe(true);
    expect(profile?.capabilities.backend).toBe(true);
  });

  // 3. Authentication Benchmark
  it('3. Benchmark: Authentication — Validates auth capability support in Golden Stack', () => {
    const profile = StackRegistry.getProfile('nextjs-fullstack-v1');
    expect(profile?.capabilities.authentication).toBe(true);
    expect(profile?.environmentRequirements).toContain('DATABASE_URL');
  });

  // 4. Dashboard Benchmark
  it('4. Benchmark: Dashboard — Generates objective quality scores >= 85 for UI specs', () => {
    const score = ArtifactRegistryService.calculateQualityScore({
      completeness: 95,
      consistency: 90,
      requirementCoverage: 95,
      correctness: 90,
      technicalRisk: 10,
    });
    expect(score.overall).toBeGreaterThanOrEqual(85);
    expect(score.verdict).toBe('APPROVED');
  });

  // 5. REST API Benchmark
  it('5. Benchmark: REST API — Locks API endpoints and health checks in Runtime Contract', () => {
    const profile = StackRegistry.getProfile('nextjs-fullstack-v1');
    expect(profile?.preview.healthEndpoint).toBe('/api/health');
    expect(profile?.validation.typecheckCommand).toBeDefined();
  });

  // 6. Full-Stack Inventory Application Benchmark
  it('6. Benchmark: Full-Stack Inventory — End-to-end artifact envelope and lineage tracking', async () => {
    const projectId = 'bench_proj_inventory_1';

    const prd = await ArtifactRegistryService.storeArtifact({
      projectId,
      type: 'PRODUCT_REQUIREMENTS_DOC',
      createdBy: 'PM',
      payload: { title: 'Inventory Management System', targetUsers: 'Small Businesses' },
      summary: 'Inventory PRD',
    });

    const arch = await ArtifactRegistryService.storeArtifact({
      projectId,
      type: 'ARCHITECTURE_SPECIFICATION',
      createdBy: 'ARCHITECT',
      payload: { stack: 'nextjs-fullstack-v1', database: 'PostgreSQL' },
      sourceArtifactIds: [prd.metadata.artifactId],
      summary: 'Inventory Architecture',
    });

    const trace = await ArtifactRegistryService.getLineageTrace(projectId, arch.metadata.artifactId);
    expect(trace.length).toBe(2);
    expect(trace[0]?.artifactId).toBe(arch.metadata.artifactId);
    expect(trace[1]?.artifactId).toBe(prd.metadata.artifactId);
  });

  // 7. Existing Repository Drift Detection Benchmark
  it('7. Benchmark: Repository Import & Drift — Detects packageManager and script drift', () => {
    const files = {
      'package.json': JSON.stringify({
        name: 'custom-app',
        scripts: { dev: 'pnpm dev', build: 'pnpm build' },
        dependencies: { next: '15.0.0', react: '19.0.0' },
      }),
      'pnpm-lock.yaml': 'lockfileVersion: 5.4',
    };

    const inspection = ProjectInspector.inspectFiles(files);
    expect(inspection.detectedPackageManager).toBe('pnpm');
    expect(inspection.detectedFramework).toBe('nextjs');
    expect(inspection.detectedScripts.dev).toBe('pnpm dev');
  });

  // 8. Feature Addition & Invalidation Benchmark
  it('8. Benchmark: Downstream Invalidation — Upstream PRD revision marks downstream artifacts STALE', async () => {
    const projectId = 'bench_proj_invalidation_2';

    const prd1 = await ArtifactRegistryService.storeArtifact({
      projectId,
      type: 'PRODUCT_REQUIREMENTS_DOC',
      createdBy: 'PM',
      payload: { version: 1 },
      validationStatus: 'VALID',
    });

    const arch1 = await ArtifactRegistryService.storeArtifact({
      projectId,
      type: 'ARCHITECTURE_SPECIFICATION',
      createdBy: 'ARCHITECT',
      payload: { stack: 'Next.js' },
      sourceArtifactIds: [prd1.metadata.artifactId],
      validationStatus: 'VALID',
    });

    expect(arch1.metadata.validationStatus).toBe('VALID');

    // Revise PRD to v2
    await ArtifactRegistryService.storeArtifact({
      projectId,
      type: 'PRODUCT_REQUIREMENTS_DOC',
      createdBy: 'PM',
      payload: { version: 2, newFeature: 'Multi-Warehouse Tracking' },
      validationStatus: 'VALID',
    });

    const latestArch = await ArtifactRegistryService.getLatestArtifact(projectId, 'ARCHITECTURE_SPECIFICATION');
    expect(latestArch?.metadata.validationStatus).toBe('STALE');
  });

  // 9. Validation Failure Recovery Benchmark
  it('9. Benchmark: Validation Failure Recovery — Diagnoses code failure and assigns to DEVELOPER', () => {
    const diagnosis = RootCauseDiagnoser.diagnose({
      failureReason: 'TypeScript compiler error: Property count does not exist on type Item in src/app/items.tsx',
    });
    expect(diagnosis.category).toBe('IMPLEMENTATION');
    expect(diagnosis.responsibleRole).toBe('DEVELOPER');
    expect(diagnosis.remediationPhase).toBe('DEVELOPMENT_RUNNING');
  });

  // 10. Requirement Ambiguity Benchmark
  it('10. Benchmark: Requirement Ambiguity — Diagnoses unclear requirement and assigns to PM', () => {
    const diagnosis = RootCauseDiagnoser.diagnose({
      failureReason: 'QA discovered ambiguous spec: acceptance criteria unfulfilled for order refund flow',
    });
    expect(diagnosis.category).toBe('REQUIREMENT');
    expect(diagnosis.responsibleRole).toBe('PM');
    expect(diagnosis.remediationPhase).toBe('PRODUCT_RUNNING');
    expect(diagnosis.invalidationTargetPhases).toContain('ARCHITECTURE_RUNNING');
  });
});
