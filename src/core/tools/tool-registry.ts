import type { ToolDefinition, ToolName } from './tool.types';
import { BUILTIN_TOOLS } from './builtin-tools.constants';

export class ToolRegistry {
  private static tools = new Map<ToolName, ToolDefinition>();
  private static initialized = false;

  /**
   * Initializes the registry with built-in tools
   */
  private static ensureInitialized(): void {
    if (this.initialized) return;
    for (const tool of BUILTIN_TOOLS) {
      this.tools.set(tool.name, tool);
    }
    this.initialized = true;
  }

  /**
   * Returns a tool definition by name
   */
  public static getTool(name: ToolName): ToolDefinition | undefined {
    this.ensureInitialized();
    return this.tools.get(name);
  }

  /**
   * Returns all registered tools
   */
  public static getAllTools(): ToolDefinition[] {
    this.ensureInitialized();
    return Array.from(this.tools.values());
  }

  /**
   * Returns tools available to a specific role
   */
  public static getToolsForRole(role: string): ToolDefinition[] {
    this.ensureInitialized();
    return Array.from(this.tools.values()).filter((t) => t.allowedRoles.includes(role as ToolDefinition['allowedRoles'][number]));
  }

  /**
   * Checks whether a role has permission to use a specific tool
   */
  public static isToolAllowed(toolName: ToolName, role: string): boolean {
    this.ensureInitialized();
    const tool = this.tools.get(toolName);
    if (!tool) return false;
    return tool.allowedRoles.includes(role as ToolDefinition['allowedRoles'][number]);
  }
}
