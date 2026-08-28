import type {
  FreeImagePromptOptions,
  GeneratedImageResult,
  ImageAspectRatio,
  ImageStylePreset,
} from './types';

// Style prompt enhancers for high aesthetic fidelity
const STYLE_MODIFIERS: Record<ImageStylePreset, string> = {
  photorealistic: '8k ultra-hd photography, cinematic studio lighting, highly detailed, realistic, clean background',
  cyberpunk: 'cyberpunk aesthetic, neon indigo and cyan glowing lights, dark futuristic void, high tech, 8k resolution',
  'minimal-3d': 'clay render 3d illustration, smooth pastel gradients, studio lighting, minimal, modern blender art',
  'vector-illustration': 'clean modern vector illustration, flat colors, minimalist shapes, tech startup aesthetic',
  'abstract-geometric': 'abstract dark geometric backdrop, subtle indigo and teal glassmorphism shapes, ambient occlusion',
  'dark-ui': 'dark mode modern dashboard asset, glowing UI charts and telemetry, cyber dark aesthetic, high contrast',
};

// Aspect ratio resolution mappings
const DIMENSION_PRESETS: Record<ImageAspectRatio, { width: number; height: number }> = {
  '16:9': { width: 1280, height: 720 },
  '4:3': { width: 1024, height: 768 },
  '1:1': { width: 800, height: 800 },
  '9:16': { width: 720, height: 1280 },
};

/**
 * Generates instant, 100% free AI images without requiring any API keys or credentials.
 * Powered by Pollinations AI Free Engine.
 */
export class FreeImageGenerator {
  /**
   * Builds an instant direct image URL that resolves to a high-resolution AI image.
   */
  public static generateImage(options: FreeImagePromptOptions): GeneratedImageResult {
    const style = options.style || 'photorealistic';
    const aspectRatio = options.aspectRatio || '16:9';
    const dimensions = DIMENSION_PRESETS[aspectRatio];

    const width = options.width || dimensions.width;
    const height = options.height || dimensions.height;
    const seed = options.seed || Math.floor(Math.random() * 1000000);
    const model = options.model || 'flux';

    // Enhance prompt with style modifiers
    const enhancedPrompt = `${options.prompt}, ${STYLE_MODIFIERS[style]}`;
    const encodedPrompt = encodeURIComponent(enhancedPrompt.trim());

    // Build the direct free CDN URL
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true`;

    const altText = options.prompt.slice(0, 80);

    return {
      url: imageUrl,
      prompt: options.prompt,
      width,
      height,
      provider: 'pollinations-ai',
      altText,
      markdownSnippet: `![${altText}](${imageUrl})`,
      htmlSnippet: `<img src="${imageUrl}" alt="${altText}" class="w-full h-auto rounded-2xl shadow-xl border border-white/10" loading="lazy" />`,
    };
  }

  /**
   * Generates a hero banner image for a software project idea.
   */
  public static generateProjectHero(projectName: string, projectIdea: string): GeneratedImageResult {
    const prompt = `Hero banner for ${projectName}: ${projectIdea.slice(0, 120)}`;
    return this.generateImage({
      prompt,
      style: 'cyberpunk',
      aspectRatio: '16:9',
    });
  }
}
