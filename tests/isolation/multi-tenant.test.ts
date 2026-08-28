import { describe, it, expect, beforeEach } from 'vitest';
import { validateTenantWorkspacePath, PathTraversalError } from '../../src/packages/agents/security/path-validator';
import { MemoryManager } from '../../src/packages/agents/memory/memory.manager';

describe('Phase 15 Multi-Tenant Isolation Validation', () => {
  let memory: MemoryManager;

  beforeEach(() => {
    memory = new MemoryManager();
  });

  it('should prevent User B (Project Beta) from accessing User A (Project Alpha) files via path traversal', () => {
    // User A valid file access in their tenant root
    const validPathA = validateTenantWorkspacePath('user-a-alpha', 'src/config/app.ts');
    expect(validPathA).toContain('user-a-alpha');

    // User B attempts directory traversal to reach User A's files
    expect(() => validateTenantWorkspacePath('user-b-beta', '../user-a-alpha/src/config/app.ts')).toThrow(PathTraversalError);
    expect(() => validateTenantWorkspacePath('user-b-beta', '../../tenants/user-a-alpha/secrets.json')).toThrow(PathTraversalError);
  });

  it('should prevent User B from reading User A memory and artifacts', async () => {
    // User A stores confidential architecture decision in memory
    await memory.storeLongTerm('user-a:project-alpha', {
      title: 'Confidential Architecture Decision',
      secretKey: 'ALPHA_SECRET_KEY_998877',
      artifactRef: 'artifact-alpha-001',
    });

    // User B searches memory for User A's secret key or artifact ref
    const betaResults = await memory.retrieve('user-b:project-beta', 'ALPHA_SECRET_KEY_998877');
    expect(betaResults).toHaveLength(0);

    const betaArtifactSearch = await memory.retrieve('user-b:project-beta', 'artifact-alpha-001');
    expect(betaArtifactSearch).toHaveLength(0);

    // Verify User A can still retrieve their own items
    const alphaResults = await memory.retrieve('user-a:project-alpha', 'ALPHA_SECRET_KEY_998877');
    expect(alphaResults.length).toBeGreaterThan(0);
    expect(alphaResults[0]?.content).toContain('ALPHA_SECRET_KEY_998877');
  });
});
