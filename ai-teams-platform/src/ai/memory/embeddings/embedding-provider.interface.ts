export interface EmbeddingProvider {
  createEmbedding(text: string): Promise<number[]>;
  searchSimilarity(queryEmbedding: number[], candidates: { id: string; embedding: number[] }[], topK: number): { id: string; score: number }[];
}
