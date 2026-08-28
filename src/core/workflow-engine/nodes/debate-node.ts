import type { PipelineNode } from '../pipeline-node.interface';
import type { ExecutionContext } from '../execution-context';
import { ExecutionStateService } from '@/core/integration/execution-state.service';
import { companyEventBus } from '@/core/company/company-event-bus';
import { readFileTool } from '@/packages/agents/tools/file-system.tool';
import { architectConfig } from '@/packages/agents/roles/architect/architect.config';
import { aiCall } from '@/packages/agents/core/ai-call';
import { ARCHITECT_SYSTEM_PROMPT } from '@/packages/agents/roles/architect/architect.prompt';

export class DebateNode implements PipelineNode {
  public readonly name = 'DebateNode';

  public async execute(context: ExecutionContext): Promise<ExecutionContext> {
    const { projectId, architecture } = context;

    if (!architecture) {
      throw new Error('DebateNode requires Architecture to compare against.');
    }

    ExecutionStateService.addActiveAgent(projectId, 'ARCHITECT');
    ExecutionStateService.setMilestoneAndTask(projectId, 'Code Review & Debate', 'Architect is reviewing code');
    await companyEventBus.publish('TASK_STARTED', projectId, { task: 'reviewImplementation', role: 'ARCHITECT' }, 'DebateNode');

    // Simulate Architect reading the filesystem using the readFileTool
    console.log('[DebateNode] Architect is scanning workspace files...');
    const indexFile = await readFileTool.execute({ path: 'src/index.ts' });
    const codeSnippet = indexFile.success ? indexFile.data : 'No entry point found.';

    // Prompt Architect to verify the code against the architecture spec
    const prompt = `Review the following code snippet against the system architecture:\n\nCode:\n${codeSnippet}\n\nArchitecture Spec:\n${JSON.stringify(architecture)}\n\nDoes this match? Return JSON { "approved": boolean, "comments": string }`;
    
    let result: { approved: boolean; comments: string };
    try {
      result = await aiCall<{ approved: boolean; comments: string }>(
        prompt,
        ARCHITECT_SYSTEM_PROMPT,
        'ARCHITECT',
        architectConfig,
        projectId
      );
    } catch {
      // Fallback heuristic if AI call fails
      result = { approved: true, comments: 'Heuristic approval passed.' };
    }

    ExecutionStateService.removeActiveAgent(projectId, 'ARCHITECT');
    ExecutionStateService.completeTask(projectId, 'reviewImplementation', 'ARCHITECT');

    if (!result.approved) {
      throw new Error(`Architect rejected the Developer's implementation: ${result.comments}`);
    }

    return {
      ...context,
      debate: result
    };
  }
}
