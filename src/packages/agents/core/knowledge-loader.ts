/**
 * @file knowledge-loader.ts
 * @package @ai-teams/agents/core
 * @description Loads project constitution and organizational memory rules into agent prompts.
 */

import { promises as fs } from 'fs';
import path from 'path';

export class KnowledgeLoader {
  private static cachedConstitution: string | null = null;

  /**
   * Loads the core project constitution.
   */
  public static async loadConstitution(): Promise<string> {
    if (this.cachedConstitution) return this.cachedConstitution;

    const constitutionPath = path.join(process.cwd(), 'doc/project-docs/00_PROJECT_CONSTITUTION.md');
    try {
      const content = await fs.readFile(constitutionPath, 'utf-8');
      this.cachedConstitution = content;
      return content;
    } catch {
      return '# AI Teams Platform Constitution\nStrict quality, non-destructive file edits, zero hallucinations.';
    }
  }

  /**
   * Formats agent prompt context with constitution and design system rules.
   */
  public static async injectContext(systemPrompt: string): Promise<string> {
    const constitution = await this.loadConstitution();
    return `${systemPrompt}\n\n=== ORGANIZATIONAL CONSTITUTION ===\n${constitution}\n===================================`;
  }
}
