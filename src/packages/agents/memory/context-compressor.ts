/**
 * @file context-compressor.ts
 * @package @ai-teams/agents/memory
 * @description Intelligent token compressor summarizing long prompt contexts for maximum efficiency.
 */

export class ContextCompressor {
  /**
   * Compresses an array of messages or string documents into concise key points.
   */
  public static compressText(text: string, maxCharacters: number = 4000): string {
    if (text.length <= maxCharacters) return text;

    const lines = text.split('\n');
    const summarized: string[] = [];
    let currentLength = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;

      if (currentLength + trimmed.length > maxCharacters) {
        summarized.push(`... [Truncated ${text.length - currentLength} chars for token efficiency]`);
        break;
      }

      summarized.push(trimmed);
      currentLength += trimmed.length + 1;
    }

    return summarized.join('\n');
  }
}
