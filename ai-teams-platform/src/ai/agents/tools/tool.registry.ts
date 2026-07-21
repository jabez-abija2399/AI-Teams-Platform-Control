import type { ToolDefinition } from './tool.interface';
import type { AgentCapability } from '../core/agent.types';

const tools = new Map<string, ToolDefinition>();

export function registerTool(tool: ToolDefinition): void {
  tools.set(tool.name, tool);
}

export function getTool(name: string): ToolDefinition | undefined {
  return tools.get(name);
}

export function getToolsForCapability(capability: AgentCapability): ToolDefinition[] {
  return Array.from(tools.values()).filter((t) => t.capability === capability);
}

export function getAllTools(): ToolDefinition[] {
  return Array.from(tools.values());
}
