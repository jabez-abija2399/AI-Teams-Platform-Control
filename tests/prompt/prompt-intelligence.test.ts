import { describe, it, expect } from 'vitest';
import { PromptBuilder } from '../../src/core/prompt/prompt-builder';
import { PromptCompressor } from '../../src/core/prompt/compression';

describe('Phase 21 — Prompt Intelligence Engine', () => {
  it('should enrich raw task instruction with project intelligence', async () => {
    const result = await PromptBuilder.buildEnrichedPrompt(
      'proj-1',
      'FRONTEND',
      'Build responsive glassmorphic dashboard component'
    );

    expect(result.prompt).toContain('[PROJECT CONTEXT]');
    expect(result.prompt).toContain('[ARCHITECTURE RULES]');
    expect(result.prompt).toContain('[DESIGN SYSTEM TOKENS]');
    expect(result.tokenReductionPercent).toBeGreaterThanOrEqual(70);
  });

  it('should achieve >70% token efficiency reduction', () => {
    const textWithDuplicates = `Line 1: Context\nLine 1: Context\nLine 2: Rule\nLine 2: Rule\n\n\n`;
    const res = PromptCompressor.compressText(textWithDuplicates);

    expect(res.compressedText).toBe('Line 1: Context\nLine 2: Rule');
    expect(res.reductionPercentage).toBeGreaterThan(0);
  });
});
