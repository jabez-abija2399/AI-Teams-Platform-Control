import type { AIProviderName } from '@/ai/gateway/ai.types';

export type UserAiProviderId =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'groq'
  | 'openrouter'
  | 'deepseek';

export type AiProviderPricing = 'free_tier' | 'paid';

export interface AiProviderCatalogEntry {
  id: UserAiProviderId;
  name: string;
  description: string;
  defaultModel: string;
  keyPlaceholder: string;
  docsUrl: string;
  steps: string[];
  /** Honest pricing signal for users who do not want to pay */
  pricing: AiProviderPricing;
  pricingLabel: string;
  pricingNote: string;
  /** Recommend first for new users avoiding paid plans */
  recommendedFree?: boolean;
}

/**
 * Providers users can bring their own key for.
 * Free-tier options are listed first so users are not steered into paid APIs.
 */
export const AI_PROVIDER_CATALOG: readonly AiProviderCatalogEntry[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Fast Gemini models — recommended free starting point for this platform.',
    defaultModel: 'gemini-2.0-flash',
    keyPlaceholder: 'AIza...',
    docsUrl: 'https://aistudio.google.com/apikey',
    pricing: 'free_tier',
    pricingLabel: 'Free tier available',
    pricingNote:
      'Google AI Studio offers a free API quota for individuals. No credit card required for the free tier in most regions. Limits apply; upgrade only if you need more volume.',
    recommendedFree: true,
    steps: [
      'Open Google AI Studio (aistudio.google.com) and sign in with Google.',
      'Click Get API key → Create API key.',
      'Copy the key (starts with AIza…) and paste it here.',
      'Stay on the free tier — you do not need to enable billing to start.',
    ],
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Very fast open models — free tier good for quick iteration.',
    defaultModel: 'llama-3.3-70b-versatile',
    keyPlaceholder: 'gsk_...',
    docsUrl: 'https://console.groq.com/keys',
    pricing: 'free_tier',
    pricingLabel: 'Free tier available',
    pricingNote:
      'Groq provides a free developer tier with rate limits. Create an account, get a key, and start without paying. Paid plans are optional for higher limits.',
    recommendedFree: true,
    steps: [
      'Go to console.groq.com and create a free account.',
      'Open API Keys → Create API Key.',
      'Copy the key (starts with gsk_) and paste it here.',
      'Use the free tier; you are not asked to pay to get a key.',
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'One key for many models — includes some free models.',
    defaultModel: 'openai/gpt-4o-mini',
    keyPlaceholder: 'sk-or-...',
    docsUrl: 'https://openrouter.ai/keys',
    pricing: 'free_tier',
    pricingLabel: 'Some free models',
    pricingNote:
      'OpenRouter lists free models (often marked :free). You can start with those. Paid credits are only needed for paid models.',
    steps: [
      'Go to openrouter.ai and sign in.',
      'Open Keys → Create Key, then paste it here.',
      'Prefer models labeled free if you do not want to add credits.',
      'Add credits only when you choose a paid model.',
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Low-cost coding models — usually paid usage (often cheap).',
    defaultModel: 'deepseek-chat',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.deepseek.com/api_keys',
    pricing: 'paid',
    pricingLabel: 'Paid usage',
    pricingNote:
      'DeepSeek is typically pay-as-you-go (often inexpensive). New accounts may get trial credits, but expect billing for ongoing use.',
    steps: [
      'Go to platform.deepseek.com and sign in.',
      'Open API Keys and create a key.',
      'Copy the key and paste it here.',
      'Check billing/credits in the DeepSeek console if calls fail.',
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models for strong general coding and planning.',
    defaultModel: 'gpt-4o-mini',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    pricing: 'paid',
    pricingLabel: 'Paid (billing required)',
    pricingNote:
      'OpenAI API usage generally requires a paid account with billing set up. Prefer Gemini or Groq if you want to avoid paying.',
    steps: [
      'Go to platform.openai.com and sign in.',
      'Open API keys → Create new secret key.',
      'Copy the key once and paste it here.',
      'Add a payment method in OpenAI billing before heavy use.',
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models for careful reasoning and long documents.',
    defaultModel: 'claude-sonnet-4-20250514',
    keyPlaceholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    pricing: 'paid',
    pricingLabel: 'Paid (billing required)',
    pricingNote:
      'Anthropic API usage is paid. Prefer Gemini or Groq if you want a free starting option.',
    steps: [
      'Go to console.anthropic.com and sign in.',
      'Open Settings → API keys → Create key.',
      'Copy the key and paste it here.',
      'Ensure billing/credits are enabled in Anthropic if prompted.',
    ],
  },
] as const;

export const DEFAULT_FREE_PROVIDER_ID: UserAiProviderId = 'gemini';

export function getProviderCatalogEntry(id: string): AiProviderCatalogEntry | undefined {
  return AI_PROVIDER_CATALOG.find((p) => p.id === id);
}

export function isUserAiProviderId(value: string): value is UserAiProviderId {
  return AI_PROVIDER_CATALOG.some((p) => p.id === value);
}

export function toAIProviderName(id: UserAiProviderId): AIProviderName {
  return id;
}

export function getFreeTierProviders(): readonly AiProviderCatalogEntry[] {
  return AI_PROVIDER_CATALOG.filter((p) => p.pricing === 'free_tier');
}
