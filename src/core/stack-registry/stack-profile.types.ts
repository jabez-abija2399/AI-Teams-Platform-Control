/**
 * Stack Profile & Registry Types
 * 
 * Reusable platform templates that define verified technology stacks.
 */

import type { ProjectType, ProjectCapabilities } from '../project-type/project-type.types';
import type {
  RuntimeServiceDefinition,
  ValidationCommandDefinition,
  PreviewContractDefinition,
  ProjectRuntimeContract,
} from '../runtime-contract/runtime-contract.types';

export interface StackProfile {
  id: string;
  version: string;
  name: string;
  description: string;
  plainLanguage: string;
  supportedProjectTypes: ProjectType[];
  isGoldenPath?: boolean;
  capabilities: ProjectCapabilities;
  runtime: {
    language: 'typescript' | 'javascript' | 'python' | 'go' | 'html';
    nodeVersion?: string;
    packageManager: 'npm' | 'pnpm' | 'yarn';
  };
  frontend?: {
    framework: string;
    styling: string;
    components?: string;
  };
  backend?: {
    framework: string;
    apiType: 'rest' | 'graphql' | 'trpc';
  };
  database?: {
    engine: 'postgresql' | 'sqlite' | 'mongodb' | 'none';
    orm?: 'prisma' | 'drizzle' | 'sqlalchemy' | 'none';
  };
  services: RuntimeServiceDefinition[];
  validation: ValidationCommandDefinition;
  preview: PreviewContractDefinition;
  filesystemStructure: {
    requiredFiles: string[];
    entryPoints: Record<string, string>;
  };
  environmentRequirements: string[];
}

export function resolveRuntimeContractFromProfile(
  profile: StackProfile,
  overrides?: Partial<ProjectRuntimeContract>,
): ProjectRuntimeContract {
  return {
    schemaVersion: '1.0.0',
    stackId: profile.id,
    stackVersion: profile.version,
    stackName: profile.name,
    projectType: overrides?.projectType || profile.supportedProjectTypes[0] || 'FULL_STACK',
    capabilities: {
      ...profile.capabilities,
      ...(overrides?.capabilities || {}),
    },
    runtime: {
      ...profile.runtime,
      ...(overrides?.runtime || {}),
    },
    services: overrides?.services || profile.services,
    validation: {
      ...profile.validation,
      ...(overrides?.validation || {}),
    },
    preview: {
      ...profile.preview,
      ...(overrides?.preview || {}),
    },
    filesystemStructure: {
      ...profile.filesystemStructure,
      ...(overrides?.filesystemStructure || {}),
    },
    environmentRequirements: overrides?.environmentRequirements || profile.environmentRequirements,
    resolvedAt: new Date().toISOString(),
  };
}
