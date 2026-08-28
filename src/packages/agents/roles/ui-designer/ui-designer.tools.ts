/**
 * @file ui-designer.tools.ts
 * @package @ai-teams/agents/roles/ui-designer
 * @description Theme token builders and layout specifier tools for the UI Designer Agent.
 */

export class UIDesignerTools {
  public static async generatePalette(themeName: string): Promise<Record<string, string>> {
    return {
      primary: '#0ea5e9',
      background: '#020617',
      card: '#0f172a',
      accent: '#6366f1',
      textPrimary: '#f8fafc',
    };
  }
}
