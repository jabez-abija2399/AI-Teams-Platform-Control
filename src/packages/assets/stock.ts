import type { GeneratedImageResult, StockCategory } from './types';

export const STOCK_CATEGORIES: StockCategory[] = [
  {
    id: 'saas-dashboard',
    name: 'SaaS & Analytics',
    description: 'Modern charts, dashboards, and enterprise telemetry visuals',
    keywords: ['dashboard', 'analytics', 'data', 'charts'],
    sampleUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'ai-neural',
    name: 'AI & Neural Networks',
    description: 'Glowing neural connections, cyber networks, and machine learning art',
    keywords: ['ai', 'network', 'cyber', 'robotics'],
    sampleUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'collaboration',
    name: 'Team Collaboration',
    description: 'Modern engineers, pair programming, and remote workspace culture',
    keywords: ['team', 'developer', 'coding', 'office'],
    sampleUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'mobile-app',
    name: 'Mobile & Devices',
    description: 'Smartphone UI mockups, responsive screens, and device frames',
    keywords: ['mobile', 'smartphone', 'ui', 'app'],
    sampleUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
  },
];

/**
 * Resolves free stock photography from curated Unsplash collections.
 */
export class FreeStockResolver {
  public static getCategories(): StockCategory[] {
    return STOCK_CATEGORIES;
  }

  public static getCategorySample(categoryId: string): GeneratedImageResult | null {
    const category = STOCK_CATEGORIES.find((c) => c.id === categoryId);
    if (!category) return null;

    return {
      url: category.sampleUrl,
      prompt: category.name,
      width: 1200,
      height: 800,
      provider: 'unsplash',
      altText: category.description,
      markdownSnippet: `![${category.name}](${category.sampleUrl})`,
      htmlSnippet: `<img src="${category.sampleUrl}" alt="${category.name}" class="w-full h-auto rounded-2xl shadow-xl border border-white/10" loading="lazy" />`,
    };
  }
}
