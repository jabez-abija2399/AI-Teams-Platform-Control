export class PromptOptimizerService {
  /**
   * Optimizes prompt text by deduplicating lines, trimming whitespace, and compressing repetitive memory/context entries
   */
  public static optimizePrompt(rawPrompt: string): { compressedPrompt: string; originalLength: number; compressedLength: number; compressionRatio: number } {
    const originalLength = rawPrompt.length;
    const lines = rawPrompt.split('\n');
    const seenLines = new Set<string>();
    const optimizedLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // Keep structural headings or non-duplicate content lines
      if (trimmed.startsWith('#') || trimmed.length === 0 || !seenLines.has(trimmed)) {
        if (trimmed.length > 0 && !trimmed.startsWith('#')) {
          seenLines.add(trimmed);
        }
        optimizedLines.push(line);
      }
    }

    let compressedPrompt = optimizedLines.join('\n').replace(/\n{3,}/g, '\n\n');
    const compressedLength = compressedPrompt.length;
    const compressionRatio = Number((1 - compressedLength / Math.max(1, originalLength)).toFixed(2));

    return {
      compressedPrompt,
      originalLength,
      compressedLength,
      compressionRatio,
    };
  }

  /**
   * Estimates token count based on standard ~4 chars per token rule
   */
  public static estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
