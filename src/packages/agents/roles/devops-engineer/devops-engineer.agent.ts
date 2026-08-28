/**
 * @file devops-engineer.agent.ts
 * @package @ai-teams/agents/roles/devops-engineer
 * @description Cloud & Release DevOps Engineer Agent class implementing BaseAgent.
 */

import { BaseAgent, type AgentExecutionContext, type AgentExecutionResult } from '../../core/base-agent';
import type { AgentContract } from '../../contracts/agent-contract.interface';
import { DeploymentRecipeSchema, type DeploymentRecipe } from './devops-engineer.types';
import { DevopsEngineerService } from './devops-engineer.service';

export class DevopsEngineerAgent extends BaseAgent<DeploymentRecipe> {
  public readonly roleId = 'devops-engineer';
  public readonly displayName = 'Lead Cloud & DevOps Engineer';
  public readonly department = 'DevOps & Infrastructure';
  public readonly deliverableType = 'DeploymentRecipe';

  public readonly contract: AgentContract = {
    role: 'devops-engineer',
    department: 'DevOps & Infrastructure',
    description: 'Generates hardened Dockerfiles, CI/CD pipeline workflows, and cloud deployment recipes.',
    allowedTools: ['dockerfile_generator', 'ci_workflow_builder'],
    requiredInputKeys: ['visionPrompt'],
    deliverableType: 'DeploymentRecipe',
    schema: DeploymentRecipeSchema,
    qualityThresholdPercent: 95,
  };

  public async execute(context: AgentExecutionContext): Promise<AgentExecutionResult<DeploymentRecipe>> {
    const startTime = Date.now();
    this.log('Preparing cloud deployment recipe and CI/CD pipelines...', { projectId: context.projectId });

    try {
      const recipe = await DevopsEngineerService.prepareDeployment({
        projectId: context.projectId,
        projectName: context.projectName,
        visionPrompt: context.visionPrompt,
      });

      return {
        success: true,
        agentRole: this.roleId,
        deliverableType: this.deliverableType,
        data: recipe,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      return {
        success: false,
        agentRole: this.roleId,
        deliverableType: this.deliverableType,
        data: null as unknown as DeploymentRecipe,
        executionTimeMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : 'DevOps execution failed',
      };
    }
  }
}

/**
 * @legacy DevOpsAgent — backwards-compatible alias for tests expecting role='DEVOPS'.
 */
export class DevOpsAgent extends DevopsEngineerAgent {
  constructor(name = 'DevOps') {
    super();
    (this as any)._role = 'DEVOPS';
    (this as any)._name = name;
  }

  override get role(): any { return 'DEVOPS'; }
  override get name(): string { return (this as any)._name; }
}
