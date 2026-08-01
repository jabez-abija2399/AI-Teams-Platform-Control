import type { ToolDefinition, ITool } from './tool.interface';
import type { AgentCapability, AgentRole } from '../core/agent.types';
import { authorizeToolUsage } from '../security/tool-permission.guard';
import { readFileTool, writeFileTool, listDirectoryTool } from './file-system.tool';
import { runCommandTool } from './shell.tool';

const tools = new Map<string, ToolDefinition>();
const executableTools = new Map<string, ITool<any, any>>([
  ['read_file', readFileTool],
  ['write_file', writeFileTool],
  ['list_directory', listDirectoryTool],
  ['run_command', runCommandTool],
]);

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

export async function executeAuthorizedTool(role: AgentRole, name: string, input: unknown, context?: { projectId: string }): Promise<unknown> {
  await authorizeToolUsage(role, name);
  const tool = executableTools.get(name);
  if (!tool) {
    throw new Error(`Tool "${name}" is not registered for execution.`);
  }
  return tool.execute(input, context);
}


