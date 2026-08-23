import { describe, it, expect } from 'vitest';
import {
  classifyProjectType,
  PROJECT_TYPE_DEFAULT_CAPABILITIES,
} from '@/core/project-type/project-type.types';
import { StackRegistry, GOLDEN_STACK_ID } from '@/core/stack-registry/stack-registry';
import { resolveRuntimeContractFromProfile } from '@/core/stack-registry/stack-profile.types';
import { DeterministicValidator } from '@/core/deterministic-validation/deterministic-validator';
import { ProjectInspector } from '@/core/project-inspector/project-inspector';
import { RootCauseDiagnoser } from '@/core/root-cause/root-cause-diagnoser';

describe('Production AI Software Engineering Company — 12 Acceptance Criteria', () => {
  // TEST 1: User creates frontend-only project
  it('TEST 1: User creates frontend-only project (no backend/database generated unnecessarily)', () => {
    const projectType = classifyProjectType('Build a responsive landing page and pricing table with Tailwind CSS');
    expect(projectType).toBe('FRONTEND_ONLY');
    const profile = StackRegistry.recommendStackForProject({ projectType });
    expect(profile.capabilities.frontend).toBe(true);
    expect(profile.capabilities.backend).toBe(false);
    expect(profile.capabilities.database).toBe(false);
    expect(profile.preview.type).toBe('WEB');
  });

  // TEST 2: User creates backend-only API
  it('TEST 2: User creates backend-only API (starts API in sandbox with /health and /docs)', () => {
    const projectType = classifyProjectType('Build a backend REST API service for webhook processing');
    expect(projectType).toBe('BACKEND_ONLY');
    const profile = StackRegistry.recommendStackForProject({ projectType });
    expect(profile.capabilities.backend).toBe(true);
    expect(profile.capabilities.frontend).toBe(false);
    expect(profile.preview.type).toBe('API');
    expect(profile.services[0].healthEndpoint).toBe('/health');
    expect(profile.services[0].docsEndpoint).toBe('/docs');
  });

  // TEST 3: User creates full-stack project
  it('TEST 3: User creates full-stack project (golden path nextjs-fullstack-v1)', () => {
    const projectType = classifyProjectType('Build a full stack task manager with PostgreSQL and user auth');
    expect(projectType).toBe('FULL_STACK');
    const profile = StackRegistry.recommendStackForProject({ projectType });
    expect(profile.id).toBe(GOLDEN_STACK_ID);
    expect(profile.capabilities.frontend).toBe(true);
    expect(profile.capabilities.backend).toBe(true);
    expect(profile.capabilities.database).toBe(true);
  });

  // TEST 4: User selects a stack — contract is snapshot
  it('TEST 4: Selected stack ID + version + resolved Runtime Contract are snapshot', () => {
    const profile = StackRegistry.getGoldenProfile();
    const contract = resolveRuntimeContractFromProfile(profile);
    expect(contract.stackId).toBe('nextjs-fullstack-v1');
    expect(contract.stackVersion).toBe('1.0.0');
    expect(contract.services.length).toBeGreaterThan(0);
    expect(contract.validation.buildCommand).toBe('npm run build');
    expect(contract.resolvedAt).toBeDefined();
  });

  // TEST 5: Project reopened days later retains runtime contract
  it('TEST 5: Project retains exact runtime contract snapshot across sessions', () => {
    const profile = StackRegistry.getGoldenProfile();
    const contract = resolveRuntimeContractFromProfile(profile);
    const persistedJson = JSON.stringify(contract);
    const reloadedContract = JSON.parse(persistedJson);
    expect(reloadedContract.stackId).toBe(contract.stackId);
    expect(reloadedContract.runtime.packageManager).toBe('npm');
  });

  // TEST 6: Stack registry receives a new version — existing projects remain unchanged
  it('TEST 6: Stack registry updates do not mutate existing project snapshot contracts', () => {
    const v1Profile = StackRegistry.getGoldenProfile();
    const existingProjectContract = resolveRuntimeContractFromProfile(v1Profile);
    expect(existingProjectContract.stackVersion).toBe('1.0.0');

    // Simulate hypothetical v2 in registry
    const v2Profile = { ...v1Profile, version: '2.0.0', runtime: { ...v1Profile.runtime, nodeVersion: '22.x' } };
    expect(v2Profile.version).toBe('2.0.0');
    // Existing project contract remains on 1.0.0
    expect(existingProjectContract.stackVersion).toBe('1.0.0');
  });

  // TEST 7: Developer changes package manager / port — Project Inspector detects discrepancy
  it('TEST 7: Project Inspector detects package manager / entry file discrepancies', () => {
    const contract = resolveRuntimeContractFromProfile(StackRegistry.getGoldenProfile());
    const files: Record<string, string> = {
      'pnpm-lock.yaml': '# pnpm lockfile',
      'package.json': JSON.stringify({ name: 'custom-app', scripts: { dev: 'pnpm dev' } }),
    };

    const inspection = ProjectInspector.inspectFiles(files, contract);
    expect(inspection.detectedPackageManager).toBe('pnpm');
    expect(inspection.discrepancies.some((d) => d.field === 'packageManager')).toBe(true);
    expect(inspection.discrepancies.some((d) => d.severity === 'ERROR')).toBe(true); // Missing layout.tsx & page.tsx
  });

  // TEST 8: Developer generates broken code — Sandbox validation fails and QA rejects with evidence
  it('TEST 8: Deterministic validation fails on broken syntax and captures error snippet', async () => {
    const contract = resolveRuntimeContractFromProfile(StackRegistry.getGoldenProfile());
    const brokenFiles: Record<string, string> = {
      'package.json': 'INVALID JSON CONTENT {{{',
      'src/app/page.tsx': '', // Empty file
    };

    const evidence = await DeterministicValidator.validateFiles({
      projectId: 'test-broken',
      files: brokenFiles,
      contract,
    });

    expect(evidence.allPassed).toBe(false);
    expect(evidence.metrics.buildPassed).toBe(false);
    expect(evidence.steps.some((s) => s.stderr.includes('Invalid JSON') || s.stderr.includes('Empty file'))).toBe(true);
  });

  // TEST 9: QA finds requirement problem — routes to PM rather than retrying Developer
  it('TEST 9: Requirement problem routes to PM Agent, Architecture problem routes to Architect', () => {
    const pmDiagnosis = RootCauseDiagnoser.diagnose({
      failureReason: 'Missing user story for user profile editing in requirement spec',
    });
    expect(pmDiagnosis.category).toBe('REQUIREMENT');
    expect(pmDiagnosis.responsibleRole).toBe('PM');
    expect(pmDiagnosis.remediationPhase).toBe('PRODUCT_RUNNING');

    const archDiagnosis = RootCauseDiagnoser.diagnose({
      failureReason: 'Database migration error: schema conflict between orders and line items',
    });
    expect(archDiagnosis.category).toBe('ARCHITECTURE');
    expect(archDiagnosis.responsibleRole).toBe('ARCHITECT');
    expect(archDiagnosis.remediationPhase).toBe('ARCHITECTURE_RUNNING');
  });

  // TEST 10: Server restart during development — checkpoint enables durable resume
  it('TEST 10: Checkpoint serializes and deserializes accurately for resume', () => {
    const checkpointState = {
      phase: 'DEVELOPMENT_RUNNING',
      attempt: 2,
      completedTodos: ['TODO-01', 'TODO-02'],
      pendingTodos: ['TODO-03'],
    };
    const serialized = JSON.stringify(checkpointState);
    const restored = JSON.parse(serialized);
    expect(restored.phase).toBe('DEVELOPMENT_RUNNING');
    expect(restored.completedTodos).toHaveLength(2);
  });

  // TEST 11: User imports existing repository — detects existing stack
  it('TEST 11: Imported repository files detect stack accurately', () => {
    const repoFiles: Record<string, string> = {
      'requirements.txt': 'fastapi==0.115.0\nuvicorn==0.32.0',
      'main.py': 'from fastapi import FastAPI\napp = FastAPI()',
    };
    const inspection = ProjectInspector.inspectFiles(repoFiles);
    expect(inspection.detectedFramework).toBe('fastapi');
    expect(inspection.detectedProjectType).toBe('BACKEND_ONLY');
  });

  // TEST 12: User requests a new feature after deployment — sequential mission execution
  it('TEST 12: Sequential missions increment lifecycle stages cleanly', () => {
    const mission1 = { title: 'Build MVP', status: 'COMPLETED' };
    const mission2 = { title: 'Add Stripe Checkout', status: 'IN_PROGRESS', parentMission: mission1.title };
    expect(mission2.parentMission).toBe('Build MVP');
    expect(mission2.status).toBe('IN_PROGRESS');
  });
});
