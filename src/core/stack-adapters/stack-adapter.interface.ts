/**
 * Stack Adapter Interface
 * 
 * Defines the contract for stack-specific scaffolding, validation, and preview logic.
 */

import type { ProjectRuntimeContract } from '../runtime-contract/runtime-contract.types';
import type { ValidationEvidence } from '../deterministic-validation/validation.types';

export interface GeneratedCodeFile {
  path: string;
  content: string;
  language?: string;
}

export interface DevServerConfig {
  command: string;
  port: number;
  healthEndpoint?: string;
  workingDir: string;
}

export interface IStackAdapter {
  readonly stackId: string;
  readonly version: string;

  /**
   * Generates foundational base files if missing.
   */
  generateBaseScaffold(contract: ProjectRuntimeContract): GeneratedCodeFile[];

  /**
   * Runs deterministic validation on the given project file map.
   */
  validate(
    files: Record<string, string>,
    contract: ProjectRuntimeContract,
  ): Promise<ValidationEvidence>;

  /**
   * Returns runtime configuration for starting the dev server.
   */
  getDevServerConfig(contract: ProjectRuntimeContract): DevServerConfig;
}
