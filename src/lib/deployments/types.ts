export type DeploymentProviderType = 'VERCEL' | 'NETLIFY' | 'CLOUDFLARE';

export interface DeploymentConfig {
  projectId: string;
  projectName: string;
  envVars: Record<string, string>;
  files: Record<string, string>;
  provider: DeploymentProviderType;
  token: string;
  teamId?: string;
}

export interface DeploymentResult {
  deploymentId: string;
  url: string;
  status: 'BUILDING' | 'READY' | 'ERROR';
  buildLogs?: string[];
  provider: DeploymentProviderType;
}

export interface DeploymentProvider {
  deploy(config: DeploymentConfig): Promise<DeploymentResult>;
  getStatus(deploymentId: string, token: string): Promise<DeploymentResult>;
}
