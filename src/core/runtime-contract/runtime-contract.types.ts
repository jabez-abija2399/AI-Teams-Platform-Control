/**
 * Project Runtime Contract
 * 
 * The single, persistent, versioned source of truth for THIS project's runtime.
 * Preserved across sessions, migrations, and missions.
 */

import type { ProjectType, ProjectCapabilities } from '../project-type/project-type.types';

export interface RuntimeServiceDefinition {
  id: string;
  name: string;
  type: 'frontend' | 'backend' | 'api' | 'worker' | 'database' | 'static';
  workingDirectory: string;
  port: number;
  healthEndpoint?: string;
  docsEndpoint?: string;
  installCommand: string;
  devCommand: string;
  buildCommand?: string;
  env?: Record<string, string>;
  dependencies?: string[];
}

export interface ValidationCommandDefinition {
  typecheckCommand?: string;
  lintCommand?: string;
  testCommand?: string;
  buildCommand?: string;
}

export interface PreviewContractDefinition {
  type: 'WEB' | 'API' | 'MULTI_SERVICE' | 'STATIC';
  defaultPort: number;
  healthEndpoint?: string;
  docsEndpoint?: string;
  primaryServiceId: string;
}

export interface ProjectRuntimeContract {
  schemaVersion: '1.0.0';
  stackId: string;
  stackVersion: string;
  stackName: string;
  projectType: ProjectType;
  capabilities: ProjectCapabilities;
  runtime: {
    language: 'typescript' | 'javascript' | 'python' | 'go' | 'html';
    nodeVersion?: string;
    packageManager: 'npm' | 'pnpm' | 'yarn';
  };
  services: RuntimeServiceDefinition[];
  validation: ValidationCommandDefinition;
  preview: PreviewContractDefinition;
  filesystemStructure: {
    requiredFiles: string[];
    entryPoints: Record<string, string>;
  };
  environmentRequirements: string[];
  resolvedAt: string;
}
