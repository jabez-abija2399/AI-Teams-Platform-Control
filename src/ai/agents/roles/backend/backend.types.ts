import { z } from 'zod';

const smartString = z
  .union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())])
  .transform((val) => {
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  });

export const folderStructureItemSchema = z.object({
  path: smartString.default(''),
  description: smartString.default(''),
  type: z.enum(['file', 'directory']).default('file'),
});

export const restApiEndpointSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),
  path: smartString.default(''),
  description: smartString.default(''),
  requestPayload: smartString.default('{}'),
  responsePayload: smartString.default('{}'),
  authRequired: z.boolean().default(true),
});

export const routeDefinitionSchema = z.object({
  route: smartString.default(''),
  handlerFile: smartString.default(''),
  middleware: z.array(smartString).default([]),
});

export const controllerSpecSchema = z.object({
  name: smartString.default(''),
  methods: z.array(smartString).default([]),
  responsibilities: z.array(smartString).default([]),
});

export const serviceSpecSchema = z.object({
  name: smartString.default(''),
  methods: z.array(smartString).default([]),
  dependencies: z.array(smartString).default([]),
});

export const repositorySpecSchema = z.object({
  name: smartString.default(''),
  model: smartString.default(''),
  customQueries: z.array(smartString).default([]),
});

export const validationRuleSchema = z.object({
  schema: smartString.default(''),
  targetEndpoint: smartString.default(''),
  rules: z.array(smartString).default([]),
});

export const authSpecSchema = z.object({
  strategy: smartString.default('JWT / OAuth2'),
  tokenExpiry: smartString.default('15m access / 7d refresh'),
  sessionStorage: smartString.default('Redis / Database session table'),
}).default({ strategy: 'JWT / OAuth2', tokenExpiry: '15m access / 7d refresh', sessionStorage: 'Redis / Database session table' });

export const rbacSpecSchema = z.object({
  roles: z.array(smartString).default(['ADMIN', 'USER']),
  permissionsMatrix: z.record(z.string(), z.array(z.string())).default({ ADMIN: ['*'], USER: ['read:own', 'write:own'] }),
}).default({ roles: ['ADMIN', 'USER'], permissionsMatrix: { ADMIN: ['*'], USER: ['read:own', 'write:own'] } });

export const businessLogicRuleSchema = z.object({
  domain: smartString.default(''),
  ruleName: smartString.default(''),
  description: smartString.default(''),
  enforcementLayer: smartString.default('Service'),
});

export const errorHandlingSpecSchema = z.object({
  errorCodes: z.array(z.object({ code: smartString, status: z.number().default(400), message: smartString })).default([]),
  globalErrorHandler: smartString.default('Middleware capturing exceptions and formatting standardized API error responses'),
}).default({ errorCodes: [], globalErrorHandler: 'Middleware capturing exceptions and formatting standardized API error responses' });

export const loggingSpecSchema = z.object({
  logger: smartString.default('Pino / Winston JSON formatted'),
  logLevels: z.array(smartString).default(['error', 'warn', 'info', 'debug']),
  sensitiveFieldsMasked: z.array(smartString).default(['password', 'token', 'authorization', 'secret']),
}).default({ logger: 'Pino / Winston JSON formatted', logLevels: ['error', 'warn', 'info', 'debug'], sensitiveFieldsMasked: ['password', 'token', 'authorization', 'secret'] });

export const rateLimitingSpecSchema = z.object({
  windowMs: z.number().default(60000),
  maxRequests: z.number().default(100),
  strategy: smartString.default('Sliding window via Redis / Memory store'),
}).default({ windowMs: 60000, maxRequests: 100, strategy: 'Sliding window via Redis / Memory store' });

export const testingStrategySchema = z.object({
  unitTestFramework: smartString.default('Vitest / Jest'),
  integrationTestStrategy: smartString.default('Supertest against in-memory or Docker test database'),
  coverageTarget: z.number().default(90),
}).default({ unitTestFramework: 'Vitest / Jest', integrationTestStrategy: 'Supertest against in-memory or Docker test database', coverageTarget: 90 });

export const backgroundJobSchema = z.object({
  name: smartString.default(''),
  trigger: smartString.default('Cron / Event'),
  schedule: smartString.default(''),
  actionDescription: smartString.default(''),
});

export const workerDefinitionSchema = z.object({
  queueName: smartString.default(''),
  concurrency: z.number().default(5),
  retryPolicy: smartString.default('Exponential backoff max 3 retries'),
});

export const backendDesignSpecSchema = z.object({
  folderStructure: z.array(folderStructureItemSchema).default([]),
  restApis: z.array(restApiEndpointSchema).default([]),
  routeDefinitions: z.array(routeDefinitionSchema).default([]),
  controllers: z.array(controllerSpecSchema).default([]),
  services: z.array(serviceSpecSchema).default([]),
  repositories: z.array(repositorySpecSchema).default([]),
  validationRules: z.array(validationRuleSchema).default([]),
  authentication: authSpecSchema,
  authorization: rbacSpecSchema,
  businessLogic: z.array(businessLogicRuleSchema).default([]),
  errorHandling: errorHandlingSpecSchema,
  logging: loggingSpecSchema,
  rateLimiting: rateLimitingSpecSchema,
  testingStrategy: testingStrategySchema,
  openApiSpec: smartString.default('openapi: 3.0.0\ninfo:\n  title: API Spec\n  version: 1.0.0'),
  backgroundJobs: z.array(backgroundJobSchema).default([]),
  workerDefinitions: z.array(workerDefinitionSchema).default([]),
  status: smartString.default('APPROVED'),
});

export type BackendDesignSpec = z.infer<typeof backendDesignSpecSchema>;
