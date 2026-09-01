import { TraceabilityService } from '@/core/traceability/traceability.service';

describe('TraceabilityService', () => {
  const testProjectId = 'test-proj-traceability-123';

  it('should register requirement traceability item', async () => {
    const result = await TraceabilityService.registerRequirement({
      projectId: testProjectId,
      requirementId: 'REQ-001',
      title: 'User account creation and authentication',
      ceoSpecVersion: 1,
      architectAdrId: 'ADR-001',
      designerDesId: 'DES-001',
      sourceFiles: ['src/app/api/auth/register/route.ts'],
      testCases: ['test-auth-01'],
      verificationStatus: 'VERIFIED',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.requirementId).toBe('REQ-001');
      expect(result.data.verificationStatus).toBe('VERIFIED');
    }
  });

  it('should record an Architecture Decision Record (ADR)', async () => {
    const result = await TraceabilityService.recordADR({
      projectId: testProjectId,
      title: 'Use PostgreSQL with Prisma ORM',
      decision: 'Relational data store selected for ACID transactions.',
      reason: 'Structured schemas and relation mapping',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.adrNumber).toMatch(/^ADR-\d{3}$/);
      expect(result.data.ownerRole).toBe('ARCHITECT');
    }
  });

  it('should record a Design Decision Record (DES)', async () => {
    const result = await TraceabilityService.recordDES({
      projectId: testProjectId,
      title: 'Dark Mode Primary Interface',
      decision: 'Single dark surface palette with indigo accents.',
      reason: 'Developer focus and brand positioning',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.desNumber).toMatch(/^DES-\d{3}$/);
      expect(result.data.ownerRole).toBe('DESIGNER');
    }
  });

  it('should calculate requirement matrix and coverage percentage', async () => {
    const result = await TraceabilityService.getMatrix(testProjectId);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalRequirements).toBeGreaterThan(0);
      expect(result.data.coveragePercentage).toBe(100);
      expect(result.data.adrs.length).toBeGreaterThan(0);
      expect(result.data.dess.length).toBeGreaterThan(0);
    }
  });
});
