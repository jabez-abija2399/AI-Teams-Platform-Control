/**
 * @file contract-validator.ts
 * @package @ai-teams/agents/contracts
 * @description Strict runtime output validator for AI Agent deliverables.
 */

import { z } from 'zod';

export class ContractValidator {
  /**
   * Cleans raw LLM markdown fences (e.g. ```json ... ```) and parses JSON.
   */
  public static extractJson<T = unknown>(rawOutput: string): T {
    let clean = rawOutput.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return JSON.parse(clean) as T;
  }

  /**
   * Validates raw JSON output against a Zod schema.
   */
  public static validate<T>(schema: z.ZodType<T>, rawOutput: unknown): { success: true; data: T } | { success: false; error: string } {
    try {
      const parsed = typeof rawOutput === 'string' ? this.extractJson(rawOutput) : rawOutput;
      const data = schema.parse(parsed);
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Deliverable failed schema validation',
      };
    }
  }
}
