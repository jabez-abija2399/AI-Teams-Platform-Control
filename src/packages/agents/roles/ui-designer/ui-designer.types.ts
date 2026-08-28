/**
 * @file ui-designer.types.ts
 * @package @ai-teams/agents/roles/ui-designer
 * @description Types and Zod schemas for the Lead UI/UX Designer Agent.
 */

import { z } from 'zod';
import type { UIDesignSpec, ArchitectureSpec } from '../../contracts/deliverable-schemas';

export interface UIDesignerExecutionInput {
  projectId: string;
  projectName?: string;
  visionPrompt: string;
  architectureSpec?: ArchitectureSpec;
}

export type UIDesignerDeliverable = UIDesignSpec;

const smartString = z
  .union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())])
  .transform((val) => {
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  });

export const designTokenSchema = z.object({
  category: smartString.default('Color'),
  name: smartString.default(''),
  value: smartString.default(''),
  description: smartString.default(''),
});

export const componentSpecSchema = z.object({
  id: smartString.default('CMP-001'),
  name: smartString.default(''),
  description: smartString.default(''),
  props: z.array(z.object({
    name: smartString.default(''),
    type: smartString.default('string'),
    required: z.boolean().default(false),
    defaultValue: smartString.default(''),
  })).default([]),
  variants: z.array(smartString).default([]),
  states: z.array(smartString).default(['default', 'hover', 'active', 'disabled']),
});

export const responsiveLayoutRuleSchema = z.object({
  breakpoint: smartString.default('Mobile (<640px)'),
  layoutType: smartString.default('Single Column Stack'),
  navigationTransform: smartString.default('Bottom Navigation Bar / Drawer'),
  gridColumns: smartString.default('1'),
});

export const uiDesignSpecSchema = z.object({
  designTokens: z.object({
    colors: z.array(designTokenSchema).default([]),
    typography: z.array(designTokenSchema).default([]),
    spacing: z.array(designTokenSchema).default([]),
    borderRadius: z.array(designTokenSchema).default([]),
    shadows: z.array(designTokenSchema).default([]),
    glassmorphism: z.array(designTokenSchema).default([]),
  }).default({ colors: [], typography: [], spacing: [], borderRadius: [], shadows: [], glassmorphism: [] }),
  componentHierarchy: z.array(componentSpecSchema).default([]),
  responsiveLayouts: z.array(responsiveLayoutRuleSchema).default([]),
  visualStyleGuide: z.object({
    themeName: smartString.default('Midnight Glass Modern'),
    vibe: smartString.default('Premium, sleek, dark mode with vibrant neon accents and glassmorphic overlays'),
    primaryPalette: smartString.default('Deep Indigo & Electric Purple'),
    secondaryPalette: smartString.default('Cyan & Emerald accents'),
  }).default({ themeName: 'Midnight Glass Modern', vibe: 'Premium, sleek, dark mode with vibrant neon accents and glassmorphic overlays', primaryPalette: 'Deep Indigo & Electric Purple', secondaryPalette: 'Cyan & Emerald accents' }),
  microInteractions: z.array(z.object({
    trigger: smartString.default('Hover'),
    animation: smartString.default('Scale 1.02 with subtle glow transition (200ms ease-out)'),
    targetComponent: smartString.default('Button / Card'),
  })).default([]),
  accessibilityVisualTokens: z.array(z.object({
    element: smartString.default('Focus Ring'),
    token: smartString.default('2px solid electric cyan with 2px offset'),
    wcagCompliance: smartString.default('WCAG 2.1 AA'),
  })).default([]),
  layoutMockups: z.array(z.object({
    screenId: smartString.default('SCR-001'),
    screenName: smartString.default(''),
    wireframeLayout: smartString.default(''),
    visualEnhancements: z.array(smartString).default([]),
  })).default([]),
  cssVariablesManifest: smartString.default(':root {\n  --color-primary: #6366f1;\n}'),
  status: smartString.default('APPROVED'),
});

export type UiDesignSpec = z.infer<typeof uiDesignSpecSchema>;
