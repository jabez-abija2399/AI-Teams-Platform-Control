import { describe, it, expect } from 'vitest';
import { backendDesignSpecSchema } from '../../src/ai/agents/roles/backend/backend.types';
import { BackendAgent } from '../../src/ai/agents/roles/backend.agent';
import { createAgent } from '../../src/ai/agents/manager/agent.registry';

describe('Backend Engineer AI Specialist', () => {
  it('should instantiate via direct class and registry', () => {
    const directAgent = new BackendAgent();
    expect(directAgent.role).toBe('BACKEND');
    expect(directAgent.name).toBe('Backend Specialist AI');

    const registryAgent = createAgent('BACKEND', 'Test BE Engineer');
    expect(registryAgent.role).toBe('BACKEND');
    expect(registryAgent.name).toBe('Test BE Engineer');
  });

  it('should parse empty or partial object into full backend design spec with defaults', () => {
    const parsed = backendDesignSpecSchema.parse({});
    expect(parsed).toBeDefined();
    expect(parsed.status).toBe('APPROVED');
    expect(parsed.restApis).toEqual([]);
    expect(parsed.authentication.strategy).toBe('JWT / OAuth2');
    expect(parsed.rateLimiting.maxRequests).toBe(100);
  });

  it('should parse complete backend design spec structure correctly', () => {
    const sampleInput = {
      folderStructure: [{ path: 'src/controllers', description: 'Controllers', type: 'directory' }],
      restApis: [{ method: 'POST', path: '/api/v1/users', description: 'Create user', requestPayload: '{"email":"string"}', responsePayload: '{"id":"string"}', authRequired: true }],
      routeDefinitions: [],
      controllers: [{ name: 'UserController', methods: ['createUser'], responsibilities: ['Handle registration'] }],
      services: [],
      repositories: [],
      validationRules: [],
      authentication: { strategy: 'JWT', tokenExpiry: '15m', sessionStorage: 'Redis' },
      authorization: { roles: ['ADMIN'], permissionsMatrix: { ADMIN: ['*'] } },
      businessLogic: [],
      errorHandling: { errorCodes: [], globalErrorHandler: 'Handler' },
      logging: { logger: 'Pino', logLevels: ['info'], sensitiveFieldsMasked: ['pwd'] },
      rateLimiting: { windowMs: 60000, maxRequests: 50, strategy: 'Sliding' },
      testingStrategy: { unitTestFramework: 'Vitest', integrationTestStrategy: 'Supertest', coverageTarget: 95 },
      openApiSpec: 'openapi: 3.0.0',
      backgroundJobs: [],
      workerDefinitions: [],
      status: 'APPROVED',
    };

    const parsed = backendDesignSpecSchema.parse(sampleInput);
    expect(parsed.folderStructure[0]?.path).toBe('src/controllers');
    expect(parsed.restApis[0]?.method).toBe('POST');
    expect(parsed.testingStrategy.coverageTarget).toBe(95);
  });
});
