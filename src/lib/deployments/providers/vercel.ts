import { DeploymentConfig, DeploymentResult, DeploymentProvider } from '../types';

export class VercelProvider implements DeploymentProvider {
  async deploy(config: DeploymentConfig): Promise<DeploymentResult> {
    const { projectName, files, envVars, token, teamId } = config;

    const formattedFiles = Object.entries(files).map(([file, data]) => ({
      file,
      data,
    }));

    const url = teamId
      ? `https://api.vercel.com/v13/deployments?teamId=${teamId}`
      : 'https://api.vercel.com/v13/deployments';

    const envArray = Object.entries(envVars).map(([key, value]) => ({
      key,
      value,
      type: 'encrypted',
      target: ['production', 'preview'],
    }));

    const body = {
      name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      files: formattedFiles,
      projectSettings: {
        framework: files['next.config.js'] || files['next.config.mjs'] || files['next.config.ts'] ? 'nextjs' : null,
      },
      env: envArray,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vercel deployment failed [${response.status}]: ${errorText}`);
      }

      const data = await response.json();

      return {
        deploymentId: data.id || data.deploymentId,
        url: data.url ? `https://${data.url}` : `https://${data.name}.vercel.app`,
        status: data.readyState === 'READY' ? 'READY' : 'BUILDING',
        buildLogs: ['[Vercel Engine] Deployment uploaded successfully. Building assets...'],
        provider: 'VERCEL',
      };
    } catch (err) {
      console.error('[Vercel Provider] Deployment error:', err);
      return {
        deploymentId: `err-${Date.now()}`,
        url: '',
        status: 'ERROR',
        buildLogs: [`Vercel deployment error: ${String(err)}`],
        provider: 'VERCEL',
      };
    }
  }

  async getStatus(deploymentId: string, token: string): Promise<DeploymentResult> {
    try {
      const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Vercel status: ${response.statusText}`);
      }

      const data = await response.json();
      const statusMap: Record<string, 'BUILDING' | 'READY' | 'ERROR'> = {
        READY: 'READY',
        BUILDING: 'BUILDING',
        INITIALIZING: 'BUILDING',
        ANALYZING: 'BUILDING',
        ERROR: 'ERROR',
        CANCELED: 'ERROR',
      };

      return {
        deploymentId: data.id,
        url: data.url ? `https://${data.url}` : '',
        status: statusMap[data.readyState] || 'BUILDING',
        provider: 'VERCEL',
      };
    } catch (err) {
      return {
        deploymentId,
        url: '',
        status: 'ERROR',
        buildLogs: [String(err)],
        provider: 'VERCEL',
      };
    }
  }
}

export const vercelProvider = new VercelProvider();
export async function deployToVercel(config: DeploymentConfig): Promise<DeploymentResult> {
  return vercelProvider.deploy(config);
}
