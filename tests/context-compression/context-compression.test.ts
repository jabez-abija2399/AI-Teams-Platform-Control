import { describe, it, expect } from 'vitest';
import { ContextCompressorEngine } from '../../src/core/context-compression/context-compressor';

describe('Phase 30 — Context Compression Engine', () => {
  it('should compress raw prompt history and achieve >80% token savings', () => {
    const rawConversations = [
      'User: Build full stack Next.js app with Prisma database',
      'Agent: Initializing App Router workspace and database schemas...',
    ];
    const archDocs = 'System Architecture Document: Modular App Router structure.';
    const memories = ['Past Decision: Enforce Zod validation.'];

    const result = ContextCompressorEngine.compressContext(rawConversations, archDocs, memories);

    expect(result.knowledgeGraphNodes.length).toBeGreaterThan(0);
    expect(result.decisionMemorySummaries.length).toBeGreaterThan(0);
    expect(result.metrics.tokenSavingsPercentage).toBeGreaterThanOrEqual(80);
    expect(result.metrics.retrievalAccuracyScore).toBeGreaterThan(95);
  });
});
