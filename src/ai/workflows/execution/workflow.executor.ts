import type { WorkflowStep } from '../core/workflow.types';
import { analyzeUserIdea } from '../../agents/roles/ceo/ceo.service';
import { designArchitecture } from '../../agents/roles/architect/architect.service';
import { implementArchitecture } from '../../agents/roles/developer/developer.service';
import { reviewImplementation } from '../../agents/roles/qa/qa.service';
import { getMemoryManager } from '../../agents/memory/memory.manager';

export interface StepExecutionResult {
  success: boolean;
  output: string;
}

export async function executeWorkflowStep(
  step: WorkflowStep,
  context?: string,
  projectId?: string,
): Promise<StepExecutionResult> {
  const memory = getMemoryManager();
  const pid = projectId ?? 'unknown';

  try {
    let output = '';

    switch (step.agentRole) {
      case 'CEO': {
        const result = await analyzeUserIdea(pid, context ?? step.description);
        if (!result.success) throw new Error(result.error.message);
        output = JSON.stringify(result.data);
        break;
      }
      case 'ARCHITECT': {
        const ceoData = context ? JSON.parse(context) : null;
        const requirements = ceoData?.requirements ?? {
          features: [{ name: 'Core Feature', description: context ?? step.description }],
          userStories: [],
          priorities: [],
          constraints: [],
        };
        const result = await designArchitecture(pid, requirements);
        if (!result.success) throw new Error(result.error.message);
        output = JSON.stringify(result.data);
        break;
      }
      case 'DEVELOPER': {
        const archData = context ? JSON.parse(context) : null;
        if (!archData?.architecture) {
          throw new Error('Developer requires architecture output from Architect AI');
        }
        const result = await implementArchitecture(pid, archData.architecture);
        if (!result.success) throw new Error(result.error.message);
        output = JSON.stringify(result.data);
        break;
      }
      case 'QA': {
        const devData = context ? JSON.parse(context) : null;
        if (!devData?.implementation) {
          throw new Error('QA requires implementation output from Developer AI');
        }
        const result = await reviewImplementation(pid, devData.implementation);
        if (!result.success) throw new Error(result.error.message);
        output = JSON.stringify(result.data);
        break;
      }
      default:
        throw new Error(`Unknown agent role: ${step.agentRole}`);
    }

    await memory.remember({
      agentId: step.agentRole,
      content: `Completed step "${step.name}": ${output.substring(0, 500)}`,
      type: 'WORKFLOW',
      metadata: { stepName: step.name, success: true },
    });

    return { success: true, output };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Step execution failed';
    await memory.remember({
      agentId: step.agentRole,
      content: `Failed step "${step.name}": ${errorMsg}`,
      type: 'WORKFLOW',
      metadata: { stepName: step.name, success: false },
    });
    return { success: false, output: errorMsg };
  }
}
