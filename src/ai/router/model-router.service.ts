import type { TaskCategory } from './task-classifier.service';
import type { AIProviderName } from '@/ai/gateway/ai.types';

interface RoutePreference {
  provider: AIProviderName;
  model: string;
}

const TASK_ROUTING: Record<TaskCategory, RoutePreference[]> = {
  CODING: [{ provider: 'gemini', model: 'gemini-2.5-flash' }, { provider: 'groq', model: 'openai/gpt-oss-120b' }],
  ARCHITECTURE: [{ provider: 'gemini', model: 'gemini-2.5-flash' }, { provider: 'groq', model: 'openai/gpt-oss-120b' }],
  PLANNING: [{ provider: 'gemini', model: 'gemini-2.5-flash' }, { provider: 'groq', model: 'openai/gpt-oss-120b' }],
  TESTING: [{ provider: 'gemini', model: 'gemini-2.5-flash' }, { provider: 'groq', model: 'openai/gpt-oss-120b' }],
  DOCUMENTATION: [{ provider: 'gemini', model: 'gemini-2.5-flash' }, { provider: 'groq', model: 'openai/gpt-oss-120b' }],
  ANALYSIS: [{ provider: 'gemini', model: 'gemini-2.5-flash' }, { provider: 'groq', model: 'openai/gpt-oss-120b' }],
  CONVERSATION: [{ provider: 'gemini', model: 'gemini-2.5-flash' }, { provider: 'groq', model: 'openai/gpt-oss-120b' }],
};

export function routeForTask(category: TaskCategory, overrideProvider?: AIProviderName): RoutePreference[] {
  const chain = TASK_ROUTING[category];
  if (overrideProvider) {
    const overridden = chain.find((c) => c.provider === overrideProvider);
    return overridden ? [overridden, ...chain.filter((c) => c !== overridden)] : chain;
  }
  return chain;
}
