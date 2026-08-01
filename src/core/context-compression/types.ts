export interface CompressionMetrics {
  originalTokenCount: number;
  compressedTokenCount: number;
  tokenSavingsPercentage: number;
  retrievalAccuracyScore: number; // 0 - 100
}

export interface CompressedContextPayload {
  knowledgeGraphNodes: string[];
  decisionMemorySummaries: string[];
  architectureMemorySummary: string;
  compressedContextText: string;
  metrics: CompressionMetrics;
}
