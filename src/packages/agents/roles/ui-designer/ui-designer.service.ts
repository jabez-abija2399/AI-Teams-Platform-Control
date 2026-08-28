/**
 * @file ui-designer.service.ts
 * @package @ai-teams/agents/roles/ui-designer
 * @description UI/UX specification generator service for the UI Designer Agent.
 */

import { ContractValidator } from '../../contracts/contract-validator';
import { UIDesignSpecSchema, type UIDesignSpec } from '../../contracts/deliverable-schemas';
import type { UIDesignerExecutionInput } from './ui-designer.types';

export class UIDesignerService {
  /**
   * Generates a complete UI Design Specification.
   */
  public static async designUi(input: UIDesignerExecutionInput): Promise<UIDesignSpec> {
    const defaultDesign: UIDesignSpec = {
      colorPalette: {
        primary: '#0ea5e9', // Sky 500
        background: '#020617', // Slate 950
        card: '#0f172a', // Slate 900
        accent: '#6366f1', // Indigo 500
        textPrimary: '#f8fafc', // Slate 50
      },
      typography: {
        headingFont: 'Inter, system-ui, sans-serif',
        bodyFont: 'Inter, system-ui, sans-serif',
        monoFont: 'JetBrains Mono, monospace',
      },
      componentHierarchy: [
        {
          name: 'MainNavigationHeader',
          location: 'src/components/ui/header.tsx',
          stylingRules: 'sticky top-0 z-20 h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md',
        },
        {
          name: 'HeroActionCard',
          location: 'src/components/features/hero-card.tsx',
          stylingRules: 'rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl',
        },
        {
          name: 'TelemetryGrid',
          location: 'src/components/features/telemetry-grid.tsx',
          stylingRules: 'grid grid-cols-1 md:grid-cols-3 gap-4',
        },
      ],
      responsiveBreakpoints: {
        mobile: '375px',
        tablet: '768px',
        desktop: '1280px',
      },
    };

    const validation = ContractValidator.validate(UIDesignSpecSchema, defaultDesign);
    if (!validation.success) {
      throw new Error(`UI Design Spec validation failed: ${validation.error}`);
    }

    return validation.data;
  }
}
