/**
 * @file devops-engineer.service.ts
 * @package @ai-teams/agents/roles/devops-engineer
 * @description Deployment recipe and infrastructure generation service for the DevOps Engineer Agent.
 */

import { ContractValidator } from '../../contracts/contract-validator';
import { DeploymentRecipeSchema, type DeploymentRecipe, type DevopsEngineerExecutionInput } from './devops-engineer.types';
import { DevopsEngineerTools } from './devops-engineer.tools';

export class DevopsEngineerService {
  /**
   * Generates a complete Deployment Recipe.
   */
  public static async prepareDeployment(input: DevopsEngineerExecutionInput): Promise<DeploymentRecipe> {
    const dockerfile = await DevopsEngineerTools.generateDockerfile();
    const defaultRecipe: DeploymentRecipe = {
      targetPlatform: 'VERCEL',
      dockerfile,
      ciWorkflowYaml: `name: CI/CD Pipeline
on: [push]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npm run build`,
      environmentVariablesRequired: ['DATABASE_URL', 'NEXTAUTH_SECRET'],
      readyToDeploy: true,
    };

    const validation = ContractValidator.validate(DeploymentRecipeSchema, defaultRecipe);
    if (!validation.success) {
      throw new Error(`Deployment Recipe validation failed: ${validation.error}`);
    }

    return validation.data;
  }
}
