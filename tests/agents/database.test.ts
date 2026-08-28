import { describe, it, expect } from 'vitest';
import { databaseDesignSpecSchema } from '../../src/packages/agents/roles/database/database.types';
import { DatabaseAgent } from '../../src/packages/agents/roles/database/database.agent';
import { createAgent } from '../../src/packages/agents/manager/agent.registry';

describe('Database Engineer AI Specialist', () => {
  it('should instantiate via direct class and registry', () => {
    const directAgent = new DatabaseAgent();
    expect(directAgent.role).toBe('DATABASE');
    expect(directAgent.name).toBe('Database Specialist AI');

    const registryAgent = createAgent('DATABASE', 'Test DB Engineer');
    expect(registryAgent.role).toBe('DATABASE');
    expect(registryAgent.name).toBe('Test DB Engineer');
  });

  it('should parse empty or partial object into full database design spec with defaults', () => {
    const parsed = databaseDesignSpecSchema.parse({});
    expect(parsed).toBeDefined();
    expect(parsed.status).toBe('APPROVED');
    expect(parsed.erd.entities).toEqual([]);
    expect(parsed.optimization.nPlusOneMitigations).toEqual([]);
    expect(parsed.cachingStrategy.cacheLayer).toBe('Redis');
  });

  it('should parse complete database design spec structure correctly', () => {
    const sampleInput = {
      erd: {
        entities: [{ name: 'User', fields: ['id', 'email'], primaryKey: 'id', foreignKeys: [] }],
        relationships: [],
      },
      prismaSchema: 'model User { id String @id }',
      indexes: [{ table: 'User', columns: ['email'], type: 'unique', rationale: 'Login lookup' }],
      relations: [],
      foreignKeys: [],
      migrationPlan: [{ stepNumber: 1, description: 'Create users table', sqlCommand: 'CREATE TABLE users...', rollbackCommand: 'DROP TABLE users', safetyRisk: 'LOW' }],
      seedPlan: [],
      optimization: { indexingNotes: 'Index email', nPlusOneMitigations: ['Use include in Prisma'], queryOptimizations: [] },
      queryPlan: [],
      partitionStrategy: { targetTables: [], partitionKey: 'createdAt', retentionPolicy: '90 days' },
      cachingStrategy: { cacheLayer: 'Redis', ttlSeconds: 600, invalidationTriggers: ['onUserUpdate'] },
      databaseConstraints: [],
      namingConventions: { tables: 'snake_case', columns: 'camelCase', indexes: 'idx_', foreignKeys: 'fk_' },
      backupStrategy: { frequency: 'daily', retention: '30d', storageType: 'S3', encryption: 'AES256' },
      recoveryStrategy: { rto: '10m', rpo: '1m', disasterRecoverySteps: ['Restore backup'] },
      databaseDocumentation: { overview: 'Core DB', dataModelNotes: 'Normalized', securityNotes: 'RLS' },
      status: 'APPROVED',
    };

    const parsed = databaseDesignSpecSchema.parse(sampleInput);
    expect(parsed.erd.entities[0]?.name).toBe('User');
    expect(parsed.indexes[0]?.table).toBe('User');
    expect(parsed.cachingStrategy.ttlSeconds).toBe(600);
  });
});
