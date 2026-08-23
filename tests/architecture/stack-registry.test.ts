import { describe, it, expect } from 'vitest';
import { StackRegistry, GOLDEN_STACK_ID } from '@/core/stack-registry/stack-registry';
import { resolveRuntimeContractFromProfile } from '@/core/stack-registry/stack-profile.types';

describe('Stack Registry & Runtime Contract Snapshotting', () => {
  it('provides the golden stack profile (Next.js Full-Stack)', () => {
    const golden = StackRegistry.getGoldenProfile();
    expect(golden.id).toBe(GOLDEN_STACK_ID);
    expect(golden.isGoldenPath).toBe(true);
    expect(golden.supportedProjectTypes).toContain('FULL_STACK');
    expect(golden.preview.type).toBe('WEB');
    expect(golden.services[0].port).toBe(3000);
  });

  it('recommends frontend stack for FRONTEND_ONLY project type', () => {
    const recommended = StackRegistry.recommendStackForProject({
      projectType: 'FRONTEND_ONLY',
    });
    expect(recommended.id).toBe('nextjs-frontend-v1');
    expect(recommended.capabilities.backend).toBe(false);
  });

  it('recommends fastapi stack for BACKEND_ONLY project type', () => {
    const recommended = StackRegistry.recommendStackForProject({
      projectType: 'BACKEND_ONLY',
    });
    expect(recommended.id).toBe('fastapi-backend-v1');
    expect(recommended.preview.type).toBe('API');
    expect(recommended.services[0].healthEndpoint).toBe('/health');
  });

  it('creates an immutable snapshot contract from stack profile', () => {
    const profile = StackRegistry.getGoldenProfile();
    const contract = resolveRuntimeContractFromProfile(profile);

    expect(contract.stackId).toBe(profile.id);
    expect(contract.stackVersion).toBe(profile.version);
    expect(contract.services.length).toBeGreaterThan(0);
    expect(contract.filesystemStructure.requiredFiles).toContain('package.json');
    expect(contract.resolvedAt).toBeDefined();
  });
});
