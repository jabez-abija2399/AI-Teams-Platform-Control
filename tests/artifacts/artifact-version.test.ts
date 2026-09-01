import { ArtifactVersionService } from '@/core/artifacts/artifact-version.service';

describe('ArtifactVersionService', () => {
  const testProjectId = 'test-proj-artifact-123';

  it('should allow domain owner to author artifact', async () => {
    const result = await ArtifactVersionService.saveDomainArtifact(
      testProjectId,
      'PRODUCT_SPEC',
      'CEO',
      { vision: 'Build a great software product' },
      'CEO Product Spec v1',
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBeGreaterThan(0);
    }
  });

  it('should reject non-owner role from authoring domain artifact', async () => {
    const result = await ArtifactVersionService.saveDomainArtifact(
      testProjectId,
      'PRODUCT_SPEC',
      'DEVELOPER',
      { vision: 'Unauthorized override' },
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('UNAUTHORIZED_ARTIFACT_OWNERSHIP');
    }
  });

  it('should retrieve version history', async () => {
    const result = await ArtifactVersionService.getVersionHistory(testProjectId);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBeGreaterThan(0);
    }
  });
});
