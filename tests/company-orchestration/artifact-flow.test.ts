import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ArtifactManager } from '@/core/company-orchestration';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    artifactLifecycleRecord: {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'art-rec-1', version: 1, ...data })),
      findFirst: vi.fn().mockResolvedValue({
        id: 'art-rec-1',
        projectId: 'proj-1',
        artifactType: 'ProductSpecification',
        status: 'VALIDATED',
        version: 1,
        consumerRoles: [],
        metadata: { content: { title: 'Spec v1', targetAudience: 'Devs' } },
      }),
      findMany: vi.fn().mockResolvedValue([
        { id: 'art-1', artifactType: 'ProjectIdea', createdAt: new Date() },
        { id: 'art-2', artifactType: 'ProductSpecification', createdAt: new Date() },
      ]),
      update: vi.fn().mockResolvedValue({ id: 'art-rec-1' }),
    },
    document: {
      create: vi.fn().mockResolvedValue({ id: 'doc-1' }),
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue({ id: 'doc-1', content: '{"title":"Spec v1"}' }),
    },
  },
}));

describe('ArtifactFlow (ArtifactManager)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores an artifact produced by an agent department', async () => {
    const res = await ArtifactManager.storeArtifact('proj-1', {
      type: 'ProductSpecification',
      content: { title: 'Spec v1', targetAudience: 'Devs' },
      producerRole: 'PRODUCT_DISCOVERY',
      consumerRoles: ['CEO'],
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.id).toBe('art-rec-1');
      expect(res.data.version).toBe(1);
    }
  });

  it('retrieves the latest validated artifact for consumption by the next department', async () => {
    const res = await ArtifactManager.getLatestArtifact('proj-1', 'ProductSpecification', 'CEO');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.title).toBe('Spec v1');
    }
  });

  it('retrieves the full artifact timeline for traceability', async () => {
    const res = await ArtifactManager.getArtifactTimeline('proj-1');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.length).toBe(2);
    }
  });
});
