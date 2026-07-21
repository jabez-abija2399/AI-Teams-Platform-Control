export interface EnvironmentInfo {
  id: string;
  projectId: string;
  name: string;
  variables: Record<string, string>;
  configuration: Record<string, unknown> | null;
  createdAt: Date;
  deploymentCount: number;
}

export interface DeploymentInfo {
  id: string;
  projectId: string;
  environmentId: string;
  environmentName: string;
  provider: string;
  status: string;
  releaseId: string | null;
  createdAt: Date;
  updatedAt: Date;
  stepCount: number;
  completedSteps: number;
}

export interface DeploymentStepInfo {
  id: string;
  deploymentId: string;
  name: string;
  status: string;
  logs: string;
  createdAt: Date;
}

export interface DeploymentLogEntry {
  id: string;
  deploymentId: string;
  type: string;
  message: string;
  timestamp: Date;
}

export interface ReleaseInfo {
  id: string;
  projectId: string;
  version: string;
  commit: string | null;
  status: string;
  createdAt: Date;
}

export interface DeployInput {
  projectId: string;
  environmentId: string;
  provider: string;
  steps: { name: string }[];
  releaseId?: string;
}
