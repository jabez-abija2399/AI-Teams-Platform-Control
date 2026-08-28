import type { AgentModelConfig } from '@/packages/agents/roles/ceo/ceo.config';
import { envModels } from '@/packages/agents/core/model-routes';
import { readFileTool, writeFileTool, listDirectoryTool } from '@/packages/agents/tools/file-system.tool';
import { runCommandTool } from '@/packages/agents/tools/shell.tool';

export const developerConfig: AgentModelConfig & { tools: any[] } = {
  models: envModels('DEVELOPER'),
  temperature: 0.3,
  maxTokens: 4000,
  tools: [readFileTool, writeFileTool, listDirectoryTool, runCommandTool]
};
