import { z } from 'zod';

const smartString = z
  .union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())])
  .transform((val) => {
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  });

export const erdEntitySchema = z.object({
  name: smartString.default(''),
  fields: z.array(smartString).default([]),
  primaryKey: smartString.default('id'),
  foreignKeys: z.array(smartString).default([]),
});

export const erdRelationshipSchema = z.object({
  source: smartString.default(''),
  target: smartString.default(''),
  type: smartString.default('1:n'),
  onDelete: smartString.default('Cascade'),
});

export const erdSchema = z.object({
  entities: z.array(erdEntitySchema).default([]),
  relationships: z.array(erdRelationshipSchema).default([]),
}).default({ entities: [], relationships: [] });

export const indexSpecSchema = z.object({
  table: smartString.default(''),
  columns: z.array(smartString).default([]),
  type: smartString.default('btree'),
  rationale: smartString.default(''),
});

export const relationSpecSchema = z.object({
  sourceTable: smartString.default(''),
  targetTable: smartString.default(''),
  relationType: smartString.default('1:N'),
  foreignKey: smartString.default(''),
  onDelete: smartString.default('Cascade'),
});

export const foreignKeySpecSchema = z.object({
  table: smartString.default(''),
  column: smartString.default(''),
  referencedTable: smartString.default(''),
  referencedColumn: smartString.default('id'),
});

export const migrationStepSchema = z.object({
  stepNumber: z.number().default(1),
  description: smartString.default(''),
  sqlCommand: smartString.default(''),
  rollbackCommand: smartString.default(''),
  safetyRisk: smartString.default('LOW'),
});

export const seedTableSchema = z.object({
  table: smartString.default(''),
  recordCount: z.number().default(10),
  sampleDataDescription: smartString.default(''),
});

export const optimizationSpecSchema = z.object({
  indexingNotes: smartString.default(''),
  nPlusOneMitigations: z.array(smartString).default([]),
  queryOptimizations: z.array(smartString).default([]),
}).default({ indexingNotes: '', nPlusOneMitigations: [], queryOptimizations: [] });

export const queryPlanItemSchema = z.object({
  queryName: smartString.default(''),
  expectedCost: smartString.default('Low'),
  indexUsed: smartString.default(''),
  cacheable: z.boolean().default(true),
});

export const partitionStrategySchema = z.object({
  targetTables: z.array(smartString).default([]),
  partitionKey: smartString.default('createdAt'),
  retentionPolicy: smartString.default('90 days active, archive after'),
}).default({ targetTables: [], partitionKey: 'createdAt', retentionPolicy: '90 days active, archive after' });

export const cachingStrategySchema = z.object({
  cacheLayer: smartString.default('Redis'),
  ttlSeconds: z.number().default(300),
  invalidationTriggers: z.array(smartString).default([]),
}).default({ cacheLayer: 'Redis', ttlSeconds: 300, invalidationTriggers: [] });

export const databaseConstraintSchema = z.object({
  table: smartString.default(''),
  constraintName: smartString.default(''),
  constraintType: smartString.default('CHECK'),
  rule: smartString.default(''),
});

export const namingConventionsSchema = z.object({
  tables: smartString.default('snake_case plural (e.g., users, project_tasks)'),
  columns: smartString.default('camelCase or snake_case matching schema pattern'),
  indexes: smartString.default('idx_{table}_{column}'),
  foreignKeys: smartString.default('fk_{source}_{target}'),
}).default({
  tables: 'snake_case plural (e.g., users, project_tasks)',
  columns: 'camelCase or snake_case matching schema pattern',
  indexes: 'idx_{table}_{column}',
  foreignKeys: 'fk_{source}_{target}',
});

export const backupStrategySchema = z.object({
  frequency: smartString.default('Daily full, continuous WAL archiving'),
  retention: smartString.default('30 days point-in-time recovery'),
  storageType: smartString.default('Encrypted Object Storage (S3 / GCS)'),
  encryption: smartString.default('AES-256 at rest and TLS 1.3 in transit'),
}).default({
  frequency: 'Daily full, continuous WAL archiving',
  retention: '30 days point-in-time recovery',
  storageType: 'Encrypted Object Storage (S3 / GCS)',
  encryption: 'AES-256 at rest and TLS 1.3 in transit',
});

export const recoveryStrategySchema = z.object({
  rto: smartString.default('< 15 minutes'),
  rpo: smartString.default('< 1 minute'),
  disasterRecoverySteps: z.array(smartString).default([
    'Promote read replica to master',
    'Verify data integrity checksums',
    'Update DNS / connection pooling endpoints',
  ]),
}).default({
  rto: '< 15 minutes',
  rpo: '< 1 minute',
  disasterRecoverySteps: [
    'Promote read replica to master',
    'Verify data integrity checksums',
    'Update DNS / connection pooling endpoints',
  ],
});

export const databaseDocumentationSchema = z.object({
  overview: smartString.default(''),
  dataModelNotes: smartString.default(''),
  securityNotes: smartString.default('Row Level Security and strict foreign key integrity'),
}).default({ overview: '', dataModelNotes: '', securityNotes: 'Row Level Security and strict foreign key integrity' });

export const databaseDesignSpecSchema = z.object({
  erd: erdSchema,
  prismaSchema: smartString.default('// Prisma schema text'),
  indexes: z.array(indexSpecSchema).default([]),
  relations: z.array(relationSpecSchema).default([]),
  foreignKeys: z.array(foreignKeySpecSchema).default([]),
  migrationPlan: z.array(migrationStepSchema).default([]),
  seedPlan: z.array(seedTableSchema).default([]),
  optimization: optimizationSpecSchema,
  queryPlan: z.array(queryPlanItemSchema).default([]),
  partitionStrategy: partitionStrategySchema,
  cachingStrategy: cachingStrategySchema,
  databaseConstraints: z.array(databaseConstraintSchema).default([]),
  namingConventions: namingConventionsSchema,
  backupStrategy: backupStrategySchema,
  recoveryStrategy: recoveryStrategySchema,
  databaseDocumentation: databaseDocumentationSchema,
  status: smartString.default('APPROVED'),
});

export type DatabaseDesignSpec = z.infer<typeof databaseDesignSpecSchema>;
