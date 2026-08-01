import { ContextLoader } from './context-loader';
import { MemoryLoader } from './memory-loader';
import { ArchitectureLoader } from './architecture-loader';
import { DesignLoader } from './design-loader';
import { RulesLoader } from './rules-loader';
import { PromptOptimizer } from './optimizer';

export class PromptBuilder {
  /**
   * Automatically enriches raw agent instructions with project intelligence, memory, rules, and design tokens
   */
  public static async buildEnrichedPrompt(
    projectId: string,
    agentRole: string,
    rawTaskInstruction: string
  ): Promise<{ prompt: string; tokenReductionPercent: number }> {
    const projectContext = await ContextLoader.loadProjectContext(projectId);
    const agentMemory = await MemoryLoader.loadAgentMemory(agentRole);
    const archRules = ArchitectureLoader.loadArchitectureRules();
    const designTokens = DesignLoader.loadDesignSystemTokens();
    const devRules = RulesLoader.loadDevelopmentRules();

    const sections = [
      projectContext,
      agentMemory,
      archRules,
      designTokens,
      devRules,
      `[TASK INSTRUCTION]\nRole: ${agentRole}\nInstruction: ${rawTaskInstruction}`,
    ];

    const result = PromptOptimizer.optimizePrompt(sections);
    return {
      prompt: result.finalPrompt,
      tokenReductionPercent: result.tokenReductionPercent,
    };
  }
}
