/**
 * @file devops-engineer.tools.ts
 * @package @ai-teams/agents/roles/devops-engineer
 * @description Dockerfile and CI workflow generator tools for the DevOps Engineer Agent.
 */

export class DevopsEngineerTools {
  public static async generateDockerfile(nodeVersion: string = '20-alpine'): Promise<string> {
    return `FROM node:${nodeVersion} AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]`;
  }
}
