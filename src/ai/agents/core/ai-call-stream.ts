import { getAIService } from '@/ai/services/ai.service';
import { extractJson } from '@/ai/utils/extract-json';
import type { AgentModelConfig } from '@/ai/agents/roles/ceo/ceo.config';
import { loadKnowledgeForAgent } from '@/ai/agents/core/knowledge-loader';
import { composeWorldClassSystemPrompt } from '@/ai/agents/excellence/world-class-charter';
import {
  publishGenerationDone,
  publishGenerationError,
  publishGenerationToken,
  publishGenerationUsage,
  clearGenerationStream,
} from '@/core/company-orchestration/generation-stream-bus';

/**
 * Stream an LLM call into the project generation bus (true tokens),
 * then parse the full JSON response for the agent.
 */
export async function aiCallStreaming<T>(
  prompt: string,
  systemPrompt: string,
  role: string,
  config: AgentModelConfig,
  projectId: string,
  agentId?: string,
): Promise<T> {
  const knowledge = loadKnowledgeForAgent(role);
  const enrichedPrompt = knowledge ? `${knowledge}\n\n${prompt}` : prompt;
  const worldClassSystem = composeWorldClassSystemPrompt(role, systemPrompt);
  const messages = [
    { role: 'system' as const, content: worldClassSystem },
    { role: 'user' as const, content: enrichedPrompt },
  ];

  const ai = getAIService();
  const errors: string[] = [];

  clearGenerationStream(projectId);

  for (const route of config.models) {
    try {
      let full = '';
      for await (const chunk of ai.stream(
        {
          messages,
          model: route.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          stream: true,
        },
        route.provider as any,
        { projectId, agentId },
      )) {
        if (chunk.type === 'token' && chunk.content) {
          full += chunk.content;
          publishGenerationToken(projectId, chunk.content);
        }
        if (chunk.type === 'usage' && chunk.usage) {
          publishGenerationUsage(projectId, {
            promptTokens: chunk.usage.promptTokens,
            completionTokens: chunk.usage.completionTokens,
            totalTokens: chunk.usage.totalTokens,
          });
        }
        if (chunk.type === 'error') {
          throw new Error(chunk.content || 'Stream error');
        }
      }
      publishGenerationDone(projectId);
      return extractJson(full) as T;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${route.provider}/${route.model}: ${msg}`);
      publishGenerationError(projectId, msg);
    }
  }

  throw new Error(`All stream routes failed: ${errors.join('; ')}`);
}
