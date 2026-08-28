/**
 * @file model-router.ts
 * @package @ai-teams/agents/core
 * @description Intelligent model selection and BYOK provider fallback engine.
 */

export interface ModelRouteOptions {
  taskType: 'STRATEGY' | 'ARCHITECTURE' | 'CODE_GENERATION' | 'REVIEW' | 'FAST_CHAT';
  preferredProvider?: 'gemini' | 'openai' | 'anthropic' | 'groq';
}

export interface ModelRouteResult {
  provider: 'gemini' | 'openai' | 'anthropic' | 'groq';
  modelName: string;
  temperature: number;
  maxTokens: number;
}

export class ModelRouter {
  public static selectModel(options: ModelRouteOptions): ModelRouteResult {
    switch (options.taskType) {
      case 'STRATEGY':
      case 'ARCHITECTURE':
        return {
          provider: options.preferredProvider || 'gemini',
          modelName: 'gemini-2.5-pro',
          temperature: 0.2,
          maxTokens: 8192,
        };

      case 'CODE_GENERATION':
        return {
          provider: options.preferredProvider || 'gemini',
          modelName: 'gemini-2.5-flash',
          temperature: 0.1,
          maxTokens: 16384,
        };

      case 'REVIEW':
        return {
          provider: options.preferredProvider || 'gemini',
          modelName: 'gemini-2.5-pro',
          temperature: 0.1,
          maxTokens: 4096,
        };

      case 'FAST_CHAT':
      default:
        return {
          provider: options.preferredProvider || 'groq',
          modelName: 'llama-3.3-70b-versatile',
          temperature: 0.5,
          maxTokens: 2048,
        };
    }
  }
}
