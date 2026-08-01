import { prisma } from '@/lib/prisma';
import type { AgentExecutionContext } from '../context/context.types';
import type { GeneratedAgentPrompt } from './prompt.types';
import { ROLE_PROMPT_TEMPLATES } from './role-prompts.constants';
import { PromptOptimizerService } from './prompt-optimizer.service';

export class AgentPromptEngine {
  /**
   * Generates role-specific system prompt from an AgentExecutionContext
   */
  public static async generatePrompt(
    context: AgentExecutionContext,
    projectId?: string
  ): Promise<GeneratedAgentPrompt> {
    const template = ROLE_PROMPT_TEMPLATES[context.role] || ROLE_PROMPT_TEMPLATES.BACKEND_ENGINEER!;

    const rawPrompt = `
SYSTEM:
${template.identity}

Experience Level:
${context.experienceLevel} (${context.personality})

Mission & Responsibilities:
${template.responsibilities.map((r) => `- ${r}`).join('\n')}

Project Context:
- Vision: ${context.project.vision}
- Tech Stack: ${context.project.technologyStack.join(', ')}

Architecture Constraints & Decisions:
${context.project.architectureDecisions.map((d) => `- ${d}`).join('\n')}

Current Task:
- ID: ${context.task.id}
- Title: ${context.task.title}
- Description: ${context.task.description}
- Objective: ${context.task.objective}
- Expected Output: ${context.task.expectedOutput}

Role Rules:
${template.rules.map((rule) => `- ${rule}`).join('\n')}
${context.memory.constraints.map((c) => `- Constraint: ${c}`).join('\n')}

Quality & Review Requirements:
- Security Checks Required: ${context.reviewerRequirements.securityChecks}
- Vitest Suite Coverage Required: ${context.reviewerRequirements.testingRequirements}
- Quality Standards: ${template.qualityStandards.join(', ')}

Before completion:
Review security requirements.
Request QA validation.
`.trim();

    const optimization = PromptOptimizerService.optimizePrompt(rawPrompt);
    const tokenCount = PromptOptimizerService.estimateTokenCount(optimization.compressedPrompt);
    const targetProjectId = projectId || 'global';

    // Non-blocking Prisma record creation
    prisma.agentPromptRecord.create({
      data: {
        projectId: targetProjectId,
        agentRole: context.role,
        taskId: context.task.id,
        systemPrompt: optimization.compressedPrompt,
        contextTokens: tokenCount,
      },
    }).catch(() => null);

    return {
      projectId: targetProjectId,
      agentRole: context.role,
      taskId: context.task.id,
      systemPrompt: optimization.compressedPrompt,
      contextTokens: tokenCount,
      generatedAt: new Date().toISOString(),
    };
  }
}
