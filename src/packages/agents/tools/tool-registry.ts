/**
 * @file tool-registry.ts
 * @package @ai-teams/agents/tools
 * @description Central catalog of tools available to AI Agents.
 */

import { PermissionGate } from './permission-gate';

export interface RegisteredTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (args: unknown) => Promise<unknown>;
}

export class ToolRegistry {
  private static tools = new Map<string, RegisteredTool>();

  public static register(tool: RegisteredTool): void {
    this.tools.set(tool.name, tool);
  }

  public static get(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  public static async execute(roleId: string, toolName: string, args: unknown): Promise<unknown> {
    if (!PermissionGate.isAuthorized(roleId, toolName)) {
      throw new Error(`Permission Denied: Agent role "${roleId}" is not authorized to invoke tool "${toolName}".`);
    }

    const tool = this.get(toolName);
    if (!tool) {
      throw new Error(`Tool "${toolName}" is not registered in ToolRegistry.`);
    }

    return tool.handler(args);
  }
}
