import type { PipelineNode } from '../pipeline-node.interface';
import type { ExecutionContext } from '../execution-context';
import { implementArchitecture } from '@/packages/agents/roles/developer/developer.service';
import { ExecutionStateService } from '@/core/integration/execution-state.service';
import { companyEventBus } from '@/core/company/company-event-bus';
import { runCommandTool } from '@/packages/agents/tools/shell.tool';

export class ExecutionNode implements PipelineNode {
  public readonly name = 'ExecutionNode';

  public async execute(context: ExecutionContext): Promise<ExecutionContext> {
    const { projectId, prd, architecture } = context;

    if (!architecture) {
      throw new Error('ExecutionNode requires Architecture from the ArchitectureNode.');
    }

    ExecutionStateService.addActiveAgent(projectId, 'DEVELOPER');
    ExecutionStateService.setMilestoneAndTask(projectId, 'Software Implementation', 'Writing and testing code');
    await companyEventBus.publish('TASK_STARTED', projectId, { task: 'implementArchitecture', role: 'DEVELOPER' }, 'ExecutionNode');

    // Generate Initial Code
    let result = await implementArchitecture(projectId, architecture, prd?.requirements || []);
    if (!result.success) {
      throw new Error(`Developer failed to implement the architecture: ${result.error?.message}`);
    }

    // TDD Loop: Run terminal commands to verify the code
    let testsPassed = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!testsPassed && attempts < maxAttempts) {
      attempts++;
      console.log(`[ExecutionNode] Running test suite... Attempt ${attempts}/${maxAttempts}`);
      
      const testCommand = await runCommandTool.execute({ command: 'npm run test:ci || echo "Tests failed"', cwd: process.cwd() });
      const output = testCommand.success ? testCommand.data.stdout + testCommand.data.stderr : 'Tests failed';

      if (!output.includes('failed')) {
        testsPassed = true;
        console.log(`[ExecutionNode] Tests passed on attempt ${attempts}!`);
      } else {
        console.log(`[ExecutionNode] Tests failed. Re-implementing based on terminal error output...`);
        // In a real LLM environment, we would feed `output` back into the Developer prompt.
        // For now, we simulate a fix by re-running the implementation generation.
        result = await implementArchitecture(projectId, architecture, prd?.requirements || []);
      }
    }

    ExecutionStateService.removeActiveAgent(projectId, 'DEVELOPER');
    ExecutionStateService.completeTask(projectId, 'implementArchitecture', 'DEVELOPER');

    if (!testsPassed) {
      throw new Error(`ExecutionNode failed: Tests did not pass after ${maxAttempts} attempts.`);
    }

    return {
      ...context,
      execution: (result as any).data
    };
  }
}
