import { generate } from '@/ai/services/ai.service';
import { extractJson } from '@/ai/utils/extract-json';
import type { AgentModelConfig } from '../roles/ceo/ceo.config';
import { loadKnowledgeForAgent } from './knowledge-loader';

const AI_CALL_TIMEOUT = 120_000;

async function tryRoute<T>(
  model: string,
  systemPrompt: string,
  messages: { role: 'user'; content: string }[],
  temperature: number,
  maxTokens: number,
  metadata: { projectId?: string; agentId?: string },
  provider: string,
): Promise<T> {
  const result = await Promise.race([
    generate(
      { model, systemPrompt, messages, temperature, maxTokens, provider: provider as any },
      metadata,
    ),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI call timed out')), AI_CALL_TIMEOUT),
    ),
  ]);
  if (!result.success) throw new Error(result.error.message);
  return extractJson(result.data.content) as T;
}

export async function aiCall<T>(
  prompt: string,
  systemPrompt: string,
  role: string,
  config: AgentModelConfig,
  projectId?: string,
  agentId?: string,
): Promise<T> {
  const knowledge = loadKnowledgeForAgent(role);
  const enrichedPrompt = knowledge ? `${knowledge}\n\n${prompt}` : prompt;
  const messages = [{ role: 'user' as const, content: enrichedPrompt }];
  const metadata = { projectId, agentId };
  const errors: string[] = [];

  for (const route of config.models) {
    try {
      return await tryRoute<T>(
        route.model,
        systemPrompt,
        messages,
        config.temperature,
        config.maxTokens,
        metadata,
        route.provider,
      );
    } catch (err) {
      errors.push(`${route.provider}/${route.model}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  throw new Error(`All routes failed: ${errors.join('; ')}`);
}
