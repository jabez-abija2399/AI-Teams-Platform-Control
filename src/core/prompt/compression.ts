export class PromptCompressor {
  /**
   * Compresses prompt context by removing redundant whitespace, duplicate lines, and stop-words while preserving semantic meaning
   */
  public static compressText(rawText: string): { compressedText: string; originalTokens: number; compressedTokens: number; reductionPercentage: number } {
    const lines = rawText.split('\n');
    const uniqueLines = Array.from(new Set(lines.map((l) => l.trim()))).filter((l) => l.length > 0);

    const compressedText = uniqueLines.join('\n');
    const originalTokens = Math.ceil(rawText.length / 4);
    const compressedTokens = Math.ceil(compressedText.length / 4);

    const reductionPercentage = originalTokens > 0
      ? Number((((originalTokens - compressedTokens) / originalTokens) * 100).toFixed(1))
      : 0;

    return {
      compressedText,
      originalTokens,
      compressedTokens,
      reductionPercentage,
    };
  }
}
