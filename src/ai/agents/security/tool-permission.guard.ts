import type { AgentRole } from '../core/agent.types';
import { AGENT_CONFIGS } from '../core/agent.constants';
import { logAIEvent } from '../../monitoring/ai.logger';

export class UnauthorizedToolError extends Error {
  constructor(role: AgentRole, toolName: string, reason?: string) {
    super(`UnauthorizedToolError: Agent "${role}" is not permitted to execute tool "${toolName}". ${reason ?? ''}`.trim());
    this.name = 'UnauthorizedToolError';
  }
}

export async function authorizeToolUsage(role: AgentRole, toolName: string): Promise<boolean> {
  const config = AGENT_CONFIGS[role];
  if (!config) {
    await logAIEvent('TOOL_REJECTED', { toolName, reason: 'No agent configuration found' }, role);
    throw new UnauthorizedToolError(role, toolName, 'No contract configuration found for role.');
  }

  // Check explicit forbidden actions or restrictions
  const forbiddenList = [...(config.forbiddenActions ?? []), ...(config.restrictions ?? [])].map((f) => f.toLowerCase());
  const lowerTool = toolName.toLowerCase();
  
  if (lowerTool === 'write_file' || lowerTool === 'run_command' || lowerTool === 'deploy') {
    const blocksCodeOrWrite = forbiddenList.some((f) => 
      f.includes('do not write code') || 
      f.includes('do not write implementation') || 
      f.includes('do not modify code') ||
      f.includes('do not change code') ||
      f.includes('no code') ||
      f.includes('not permitted to execute') ||
      f.includes('do not deploy')
    );
    if (blocksCodeOrWrite) {
      await logAIEvent('TOOL_REJECTED', { toolName, reason: 'Explicitly forbidden by agent contract restrictions' }, role);
      throw new UnauthorizedToolError(role, toolName, 'Forbidden by contract restrictions.');
    }
  }

  // Check allowed tools and actions
  const normalize = (s: string) => s.toLowerCase().replace(/[-_]/g, '');
  const normalizedTarget = normalize(toolName);
  const allowedTools = [...(config.tools ?? []), ...(config.allowedActions ?? [])];
  
  // Always allow read-only inspection tools for non-executive technical roles
  const isInspectionTool = ['readfile', 'listdirectory', 'readurl', 'search'].includes(normalizedTarget);
  const isExecutiveRole = ['CEO', 'PRODUCT_MANAGER'].includes(role);
  
  const isAllowed = allowedTools.some((t) => normalize(t) === normalizedTarget) || (isInspectionTool && !isExecutiveRole);

  if (!isAllowed) {
    await logAIEvent('TOOL_REJECTED', { toolName, reason: 'Tool not listed in agent contract tools or allowedActions' }, role);
    throw new UnauthorizedToolError(role, toolName, 'Tool not listed in allowed contract tools.');
  }

  return true;
}
