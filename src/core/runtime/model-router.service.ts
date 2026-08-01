import type { AIModelConfig, AIProviderName } from './runtime.types';
import type { CompanyRole } from '../workforce/types';

/**
 * Model configurations keyed by provider
 */
const MODEL_CONFIGS: Record<string, AIModelConfig> = {
  'gpt-4o': {
    provider: 'OPENAI',
    model: 'gpt-4o',
    maxTokens: 4096,
    temperature: 0.3,
    costPerInputToken: 0.0000025,
    costPerOutputToken: 0.00001,
  },
  'gpt-4o-mini': {
    provider: 'OPENAI',
    model: 'gpt-4o-mini',
    maxTokens: 4096,
    temperature: 0.3,
    costPerInputToken: 0.00000015,
    costPerOutputToken: 0.0000006,
  },
  'claude-sonnet-4-20250514': {
    provider: 'ANTHROPIC',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 8192,
    temperature: 0.2,
    costPerInputToken: 0.000003,
    costPerOutputToken: 0.000015,
  },
  'claude-haiku': {
    provider: 'ANTHROPIC',
    model: 'claude-3-5-haiku-20241022',
    maxTokens: 4096,
    temperature: 0.3,
    costPerInputToken: 0.0000008,
    costPerOutputToken: 0.000004,
  },
  'local-llama': {
    provider: 'LOCAL_MODEL',
    model: 'llama-3.1-8b',
    maxTokens: 2048,
    temperature: 0.4,
    costPerInputToken: 0,
    costPerOutputToken: 0,
  },
};

/**
 * Role-to-model complexity mapping
 */
const ROLE_COMPLEXITY: Record<string, 'high' | 'medium' | 'low'> = {
  CEO: 'high',
  PRODUCT_MANAGER: 'high',
  SOFTWARE_ARCHITECT: 'high',
  DATABASE_ENGINEER: 'medium',
  BACKEND_ENGINEER: 'medium',
  FRONTEND_ENGINEER: 'medium',
  UI_ENGINEER: 'low',
  QA_ENGINEER: 'medium',
  SECURITY_ENGINEER: 'high',
  DEVOPS_ENGINEER: 'medium',
};

export class ModelRouterService {
  /**
   * Selects the optimal model configuration based on agent role and task complexity
   */
  public static selectModel(
    agentRole: CompanyRole,
    taskTitle: string,
    preferredProvider?: AIProviderName
  ): AIModelConfig {
    const complexity = ROLE_COMPLEXITY[agentRole] || 'medium';

    // If preferred provider is specified, route accordingly
    if (preferredProvider === 'LOCAL_MODEL') {
      return MODEL_CONFIGS['local-llama']!;
    }

    if (complexity === 'high') {
      return preferredProvider === 'OPENAI'
        ? MODEL_CONFIGS['gpt-4o']!
        : MODEL_CONFIGS['claude-sonnet-4-20250514']!;
    }

    if (complexity === 'low') {
      return preferredProvider === 'ANTHROPIC'
        ? MODEL_CONFIGS['claude-haiku']!
        : MODEL_CONFIGS['gpt-4o-mini']!;
    }

    // Medium complexity — check task keywords for routing hints
    const text = taskTitle.toLowerCase();
    if (text.includes('security') || text.includes('audit') || text.includes('architecture')) {
      return MODEL_CONFIGS['claude-sonnet-4-20250514']!;
    }

    return preferredProvider === 'ANTHROPIC'
      ? MODEL_CONFIGS['claude-haiku']!
      : MODEL_CONFIGS['gpt-4o-mini']!;
  }

  /**
   * Returns all available model configurations
   */
  public static getAvailableModels(): AIModelConfig[] {
    return Object.values(MODEL_CONFIGS);
  }
}
