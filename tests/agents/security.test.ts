import { describe, it, expect } from 'vitest';
import { securityReportSpecSchema } from '../../src/ai/agents/roles/security/security.types';
import { SecurityAgent } from '../../src/ai/agents/roles/security.agent';
import { createAgent } from '../../src/ai/agents/manager/agent.registry';

describe('Security Engineer AI Specialist', () => {
  it('should instantiate via direct class and registry', () => {
    const directAgent = new SecurityAgent();
    expect(directAgent.role).toBe('SECURITY');
    expect(directAgent.name).toBe('Security Engineer');

    const registryAgent = createAgent('SECURITY', 'Test Sec Engineer');
    expect(registryAgent.role).toBe('SECURITY');
    expect(registryAgent.name).toBe('Test Sec Engineer');
  });

  it('should parse empty or partial object into full security report spec with defaults', () => {
    const parsed = securityReportSpecSchema.parse({});
    expect(parsed).toBeDefined();
    expect(parsed.status).toBe('APPROVED');
    expect(parsed.threatModel).toEqual([]);
    expect(parsed.riskScore.overallScore).toBe(90);
    expect(parsed.complianceReport.gdprReady).toBe(true);
  });

  it('should parse complete security report spec structure correctly', () => {
    const sampleInput = {
      threatModel: [{ component: 'Auth API', threat: 'Token theft', strideCategory: 'Spoofing', severity: 'HIGH', mitigation: 'Secure cookies' }],
      owaspReview: [{ category: 'A01', status: 'PASS', notes: 'Checked' }],
      authenticationAudit: { mechanism: 'OAuth2', vulnerabilities: [], strengthScore: 95 },
      authorizationAudit: { enforcement: 'RBAC', privilegeEscalationRisks: [], recommendations: [] },
      dependencyScan: [{ package: 'lodash', version: '4.17.20', vulnerability: 'Prototype pollution', severity: 'HIGH', remediation: 'Upgrade' }],
      secretDetection: { hardcodedSecretsFound: false, locations: [], envManagementScore: 100 },
      apiSecurityReview: { rateLimitingEnforced: true, corsPolicy: 'Strict', inputValidationScore: 98, findings: [] },
      infrastructureReview: { tlsEnforced: true, headers: ['HSTS'], containerSecurity: 'Non-root' },
      dataProtectionReport: { encryptionAtRest: 'AES-256', encryptionInTransit: 'TLS 1.3', piiHandling: 'Logged' },
      complianceReport: { gdprReady: true, soc2Ready: true, hipaaReady: false, notes: 'Standard' },
      riskScore: { overallScore: 92, riskLevel: 'LOW', summary: 'Secure' },
      remediationPlan: [{ priority: 'IMMEDIATE', action: 'Upgrade lodash', targetComponent: 'package.json', codeExample: 'npm update lodash' }],
      status: 'APPROVED',
    };

    const parsed = securityReportSpecSchema.parse(sampleInput);
    expect(parsed.threatModel[0]?.threat).toBe('Token theft');
    expect(parsed.dependencyScan[0]?.severity).toBe('HIGH');
    expect(parsed.remediationPlan[0]?.priority).toBe('IMMEDIATE');
  });
});
