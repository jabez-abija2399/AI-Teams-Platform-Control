import { describe, it, expect } from 'vitest';
import { devopsPlanSpecSchema } from '../../src/ai/agents/roles/devops/devops.types';
import { DevOpsAgent } from '../../src/ai/agents/roles/devops.agent';
import { createAgent } from '../../src/ai/agents/manager/agent.registry';

describe('DevOps Engineer AI Specialist', () => {
  it('should instantiate via direct class and registry', () => {
    const directAgent = new DevOpsAgent();
    expect(directAgent.role).toBe('DEVOPS');
    expect(directAgent.name).toBe('DevOps');

    const registryAgent = createAgent('DEVOPS', 'Test DevOps Engineer');
    expect(registryAgent.role).toBe('DEVOPS');
    expect(registryAgent.name).toBe('Test DevOps Engineer');
  });

  it('should parse empty or partial object into full DevOps plan spec with defaults', () => {
    const parsed = devopsPlanSpecSchema.parse({});
    expect(parsed).toBeDefined();
    expect(parsed.status).toBe('APPROVED');
    expect(parsed.cicdPipelines).toEqual([]);
    expect(parsed.scalingPlan.minInstances).toBe(2);
    expect(parsed.secretsStrategy.rotationIntervalDays).toBe(90);
  });

  it('should parse complete DevOps plan spec structure correctly', () => {
    const sampleInput = {
      docker: 'FROM node:20',
      dockerCompose: 'version: "3"',
      cicdPipelines: [{ name: 'Production Pipeline', trigger: 'main', stages: ['build', 'test'] }],
      githubActions: [{ workflowName: 'deploy.yml', description: 'Deploy to AWS', yamlContent: 'name: Deploy' }],
      deploymentPlan: [{ step: 1, name: 'Migration', description: 'Run db migrate', command: 'npx prisma migrate deploy' }],
      infrastructureDiagram: 'graph TD; LB --> App;',
      environmentVariables: [{ key: 'DATABASE_URL', description: 'PG url', required: true, isSecret: true }],
      secretsStrategy: { tool: 'AWS Secrets Manager', rotationIntervalDays: 60, accessControl: 'IAM' },
      scalingPlan: { minInstances: 3, maxInstances: 20, targetCpuUtilization: 65, autoScalingPolicy: 'HPA' },
      monitoringPlan: { metricsPlatform: 'Prometheus', keyMetrics: ['cpu'], alertThresholds: ['err > 1%'] },
      loggingPlan: { logAggregation: 'Datadog', retentionDays: 90, structuredLogging: true },
      backupPlan: { schedule: 'Hourly', retentionDays: 30, disasterRecoveryRTO: '2h', disasterRecoveryRPO: '15m' },
      rollbackStrategy: { mechanism: 'Canary', triggers: ['err spike'], maxRollbackTimeSeconds: 60 },
      healthChecks: [{ endpoint: '/health', type: 'liveness', intervalSeconds: 5, timeoutSeconds: 2 }],
      productionChecklist: [{ item: 'HTTPS enforced', verified: true, category: 'security' }],
      status: 'APPROVED',
    };

    const parsed = devopsPlanSpecSchema.parse(sampleInput);
    expect(parsed.docker).toBe('FROM node:20');
    expect(parsed.deploymentPlan[0]?.command).toBe('npx prisma migrate deploy');
    expect(parsed.scalingPlan.maxInstances).toBe(20);
  });
});
