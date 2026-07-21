import type { EmbeddingProvider } from './embedding-provider.interface';

/**
 * Cosine similarity search — real math, not a stub.
 * createEmbedding() throws until a real embedding API key is configured.
 */
export class LocalEmbeddingProvider implements EmbeddingProvider {
  async createEmbedding(): Promise<number[]> {
    throw new Error('No embedding provider connected. Configure OPENAI_API_KEY or GEMINI_API_KEY for embeddings.');
  }

  searchSimilarity(queryEmbedding: number[], candidates: { id: string; embedding: number[] }[], topK: number) {
    const scored = candidates.map((c) => ({ id: c.id, score: cosineSimilarity(queryEmbedding, c.embedding) }));
    return scored.sort((a, b) => b.score - a.score).slice(0, topK);
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * (b[i] ?? 0), 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}
