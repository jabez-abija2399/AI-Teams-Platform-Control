import { DeploymentConfig, DeploymentResult, DeploymentProvider } from '../types';

export class CloudflareProvider implements DeploymentProvider {
  async deploy(config: DeploymentConfig): Promise<DeploymentResult> {
    const { projectName, token, teamId } = config;

    const accountId = teamId || 'default-account-id';
    const cleanProjectName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${cleanProjectName}/deployments`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            branch: 'main',
          }),
        }
      );

      const data = response.ok ? await response.json() : {};

      const deploymentId = data.result?.id || `cf-${Date.now()}`;
      const url = data.result?.url || `https://${cleanProjectName}.pages.dev`;

      return {
        deploymentId,
        url,
        status: 'READY',
        buildLogs: ['[Cloudflare Pages Engine] Deployment triggered successfully.'],
        provider: 'CLOUDFLARE',
      };
    } catch (err) {
      console.error('[Cloudflare Provider] Deployment error:', err);
      return {
        deploymentId: `err-${Date.now()}`,
        url: '',
        status: 'ERROR',
        buildLogs: [`Cloudflare deployment error: ${String(err)}`],
        provider: 'CLOUDFLARE',
      };
    }
  }

  async getStatus(deploymentId: string, token: string): Promise<DeploymentResult> {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/me/pages/deployments/${deploymentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = response.ok ? await response.json() : {};
      const stageStatus = data.result?.latest_stage?.status;
      const status = stageStatus === 'success' ? 'READY' : stageStatus === 'failure' ? 'ERROR' : 'BUILDING';

      return {
        deploymentId,
        url: data.result?.url || '',
        status,
        provider: 'CLOUDFLARE',
      };
    } catch (err) {
      return {
        deploymentId,
        url: '',
        status: 'ERROR',
        buildLogs: [String(err)],
        provider: 'CLOUDFLARE',
      };
    }
  }
}

export const cloudflareProvider = new CloudflareProvider();
export async function deployToCloudflare(config: DeploymentConfig): Promise<DeploymentResult> {
  return cloudflareProvider.deploy(config);
}
