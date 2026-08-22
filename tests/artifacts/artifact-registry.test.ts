import { describe, it, expect } from 'vitest';
import { ArtifactRegistryService } from '../../src/core/artifacts/artifact-registry.service';

describe('ArtifactRegistryService & Lineage Graph', () => {
  const projectId = 'proj_artifact_test_1';

  it('should store a versioned artifact envelope with SHA-256 content hash', async () => {
    const prd = await ArtifactRegistryService.storeArtifact({
      projectId,
      type: 'PRODUCT_REQUIREMENTS_DOC',
      createdBy: 'PM',
      payload: { features: ['Auth', 'Dashboard'] },
      summary: 'Initial PRD v1',
    });

    expect(prd.metadata.artifactId).toBeDefined();
    expect(prd.metadata.version).toBe(1);
    expect(prd.metadata.createdBy).toBe('PM');
    expect(prd.metadata.contentHash).toBeDefined();
    expect(prd.metadata.qualityScore.verdict).toBe('APPROVED');
  });

  it('should trace complete lineage graph back to root artifact', async () => {
    const prd = await ArtifactRegistryService.storeArtifact({
      projectId,
      type: 'PRODUCT_REQUIREMENTS_DOC',
      createdBy: 'PM',
      payload: { scope: 'E-commerce' },
    });

    const arch = await ArtifactRegistryService.storeArtifact({
      projectId,
      type: 'ARCHITECTURE_SPECIFICATION',
      createdBy: 'ARCHITECT',
      payload: { stack: 'Next.js' },
      sourceArtifactIds: [prd.metadata.artifactId],
    });

    const impl = await ArtifactRegistryService.storeArtifact({
      projectId,
      type: 'IMPLEMENTATION_DELIVERABLE',
      createdBy: 'DEVELOPER',
      payload: { files: ['src/index.ts'] },
      sourceArtifactIds: [arch.metadata.artifactId],
    });

    const trace = await ArtifactRegistryService.getLineageTrace(projectId, impl.metadata.artifactId);
    expect(trace.length).toBe(3);
    expect(trace[0]?.artifactId).toBe(impl.metadata.artifactId);
    expect(trace[1]?.artifactId).toBe(arch.metadata.artifactId);
    expect(trace[2]?.artifactId).toBe(prd.metadata.artifactId);
  });

  it('should calculate objective quality score with appropriate verdict', () => {
    const highQuality = ArtifactRegistryService.calculateQualityScore({
      completeness: 95,
      consistency: 90,
      requirementCoverage: 95,
      correctness: 90,
      technicalRisk: 10,
    });
    expect(highQuality.overall).toBeGreaterThanOrEqual(90);
    expect(highQuality.verdict).toBe('APPROVED');

    const lowQuality = ArtifactRegistryService.calculateQualityScore({
      completeness: 40,
      consistency: 50,
      requirementCoverage: 30,
      correctness: 40,
      technicalRisk: 80,
    });
    expect(lowQuality.overall).toBeLessThan(60);
    expect(lowQuality.verdict).toBe('REJECTED');
  });
});
