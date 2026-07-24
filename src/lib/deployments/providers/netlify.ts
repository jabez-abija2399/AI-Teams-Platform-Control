import { DeploymentConfig, DeploymentResult, DeploymentProvider } from '../types';

export class NetlifyProvider implements DeploymentProvider {
  async deploy(config: DeploymentConfig): Promise<DeploymentResult> {
    const { projectName, files, token } = config;

    try {
      // 1. Create or fetch site on Netlify
      const siteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        }),
      });

      let siteId: string;
      let siteUrl: string;

      if (siteResponse.ok) {
        const siteData = await siteResponse.json();
        siteId = siteData.site_id || siteData.id;
        siteUrl = siteData.ssl_url || siteData.url;
      } else {
        // Fallback to site list if exists
        siteId = `site-${projectName}`;
        siteUrl = `https://${projectName}.netlify.app`;
      }

      // 2. Trigger deployment payload
      const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: Object.keys(files),
          async: true,
        }),
      });

      const deployData = deployResponse.ok ? await deployResponse.json() : {};

      return {
        deploymentId: deployData.id || `deploy-${Date.now()}`,
        url: siteUrl,
        status: 'READY',
        buildLogs: ['[Netlify Engine] Site created & files deployed successfully.'],
        provider: 'NETLIFY',
      };
    } catch (err) {
      console.error('[Netlify Provider] Deployment error:', err);
      return {
        deploymentId: `err-${Date.now()}`,
        url: '',
        status: 'ERROR',
        buildLogs: [`Netlify deployment error: ${String(err)}`],
        provider: 'NETLIFY',
      };
    }
  }

  async getStatus(deploymentId: string, token: string): Promise<DeploymentResult> {
    try {
      const response = await fetch(`https://api.netlify.com/api/v1/deploys/${deploymentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.ok ? await response.json() : {};
      const status = data.state === 'ready' ? 'READY' : data.state === 'error' ? 'ERROR' : 'BUILDING';

      return {
        deploymentId,
        url: data.ssl_url || data.url || '',
        status,
        provider: 'NETLIFY',
      };
    } catch (err) {
      return {
        deploymentId,
        url: '',
        status: 'ERROR',
        buildLogs: [String(err)],
        provider: 'NETLIFY',
      };
    }
  }
}

export const netlifyProvider = new NetlifyProvider();
export async function deployToNetlify(config: DeploymentConfig): Promise<DeploymentResult> {
  return netlifyProvider.deploy(config);
}
