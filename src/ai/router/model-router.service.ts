import type { TaskCategory } from './task-classifier.service';
import type { AIProviderName } from '@/ai/gateway/ai.types';

interface RoutePreference {
  provider: AIProviderName;
  model: string;
}

const TASK_ROUTING: Record<TaskCategory, RoutePreference[]> = {
  CODING: [{ provider: 'groq', model: 'llama-3.3-70b-versatile' }, { provider: 'openrouter', model: 'openrouter/free' }],
  ARCHITECTURE: [{ provider: 'groq', model: 'llama-3.3-70b-versatile' }, { provider: 'gemini', model: 'gemini-3.5-flash-lite' }],
  PLANNING: [{ provider: 'groq', model: 'llama-3.3-70b-versatile' }, { provider: 'gemini', model: 'gemini-3.5-flash-lite' }],
  TESTING: [{ provider: 'groq', model: 'llama-3.3-70b-versatile' }, { provider: 'gemini', model: 'gemini-3.5-flash-lite' }],
  DOCUMENTATION: [{ provider: 'groq', model: 'llama-3.3-70b-versatile' }, { provider: 'gemini', model: 'gemini-3.5-flash-lite' }],
  ANALYSIS: [{ provider: 'gemini', model: 'gemini-3.5-flash-lite' }, { provider: 'groq', model: 'llama-3.3-70b-versatile' }],
  CONVERSATION: [{ provider: 'groq', model: 'llama-3.3-70b-versatile' }, { provider: 'gemini', model: 'gemini-3.5-flash-lite' }],
};

export function routeForTask(category: TaskCategory, overrideProvider?: AIProviderName): RoutePreference[] {
  const chain = TASK_ROUTING[category];
  if (overrideProvider) {
    const overridden = chain.find((c) => c.provider === overrideProvider);
    return overridden ? [overridden, ...chain.filter((c) => c !== overridden)] : chain;
  }
  return chain;
}
