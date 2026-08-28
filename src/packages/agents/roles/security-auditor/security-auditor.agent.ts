/**
 * @file security-auditor.agent.ts
 * @package @ai-teams/agents/roles/security-auditor
 * @description Security Auditor Agent class implementing BaseAgent.
 */

import { BaseAgent, type AgentExecutionContext, type AgentExecutionResult } from '../../core/base-agent';
import type { AgentContract } from '../../contracts/agent-contract.interface';
import { SecurityAuditReportSchema, type SecurityAuditReport } from './security-auditor.types';
import { SecurityAuditorService } from './security-auditor.service';

export class SecurityAuditorAgent extends BaseAgent<SecurityAuditReport> {
  public readonly roleId = 'security-auditor';
  public readonly displayName = 'Lead Security & Compliance Auditor';
  public readonly department = 'Security & Infrastructure';
  public readonly deliverableType = 'SecurityAuditReport';

  public readonly contract: AgentContract = {
    role: 'security-auditor',
    department: 'Security & Infrastructure',
    description: 'Scans for vulnerabilities, verifies secret isolation, and validates OWASP compliance.',
    allowedTools: ['owasp_scanner', 'secret_detector'],
    requiredInputKeys: ['visionPrompt'],
    deliverableType: 'SecurityAuditReport',
    schema: SecurityAuditReportSchema,
    qualityThresholdPercent: 99,
  };

  public async execute(context: AgentExecutionContext): Promise<AgentExecutionResult<SecurityAuditReport>> {
    const startTime = Date.now();
    this.log('Performing security scan and OWASP compliance audit...', { projectId: context.projectId });

    try {
      const report = await SecurityAuditorService.auditSecurity({
        projectId: context.projectId,
        projectName: context.projectName,
        visionPrompt: context.visionPrompt,
      });

      return {
        success: true,
        agentRole: this.roleId,
        deliverableType: this.deliverableType,
        data: report,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      return {
        success: false,
        agentRole: this.roleId,
        deliverableType: this.deliverableType,
        data: null as unknown as SecurityAuditReport,
        executionTimeMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : 'Security audit failed',
      };
    }
  }
}

/**
 * @legacy SecurityAgent — backwards-compatible alias for tests expecting role='SECURITY'.
 */
export class SecurityAgent extends SecurityAuditorAgent {
  constructor(name = 'Security Engineer') {
    super();
    (this as any)._role = 'SECURITY';
    (this as any)._name = name;
  }

  override get role(): any { return 'SECURITY'; }
  override get name(): string { return (this as any)._name; }
}
