/**
 * Strict data contracts for Free AI Image Generation & Stock Asset Resolution.
 */

export type ImageStylePreset =
  | 'photorealistic'
  | 'cyberpunk'
  | 'minimal-3d'
  | 'vector-illustration'
  | 'abstract-geometric'
  | 'dark-ui';

export type ImageAspectRatio = '16:9' | '4:3' | '1:1' | '9:16';

export interface FreeImagePromptOptions {
  prompt: string;
  style?: ImageStylePreset;
  aspectRatio?: ImageAspectRatio;
  width?: number;
  height?: number;
  seed?: number;
  model?: 'flux' | 'turbo';
}

export interface GeneratedImageResult {
  url: string;
  prompt: string;
  width: number;
  height: number;
  provider: 'pollinations-ai' | 'unsplash' | 'svg-preset';
  altText: string;
  markdownSnippet: string;
  htmlSnippet: string;
}

export interface StockCategory {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  sampleUrl: string;
}
