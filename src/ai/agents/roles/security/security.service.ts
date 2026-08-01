import { prisma } from '@/lib/prisma';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { aiCall } from '@/ai/agents/core/ai-call';
import { securityConfig } from './security.config';
import { SECURITY_SYSTEM_PROMPT } from './security.prompt';
import {
  securityReportSpecSchema,
  type SecurityReportSpec,
} from './security.types';
import type { ApiResult } from '@/types/common.types';

const SEC_ROLE_NAME = 'Security Engineer';

async function getOrCreateSecAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'SECURITY' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: {
      name: SEC_ROLE_NAME,
      role: 'SECURITY',
      status: 'IDLE',
      capabilities: ['ANALYSIS', 'TESTING'],
    },
  });
  return created.id;
}

export async function generateSecurityReportSpec(
  projectId: string,
  inputData: unknown,
): Promise<ApiResult<SecurityReportSpec>> {
  const agentId = await getOrCreateSecAgentId();

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('SECURITY_REPORT_STARTED', { projectId }, agentId);

  try {
    const prompt = `Input Architecture, Backend, and Frontend Specifications:\n${JSON.stringify(inputData, null, 2)}\n\nGenerate comprehensive Security Audit and Threat Model (Threat Modeling, OWASP Review, Auth Audit, RBAC Audit, Dependency Scan, Secret Detection, API Security, Infra Review, Data Protection, Compliance, Risk Score, Remediation Plan). Produce JSON matching the exact required deliverable schema.\nRespond ONLY with valid JSON.`;

    const raw = await aiCall<unknown>(
      prompt,
      SECURITY_SYSTEM_PROMPT,
      'SECURITY',
      securityConfig,
      projectId,
      agentId,
    );

    const spec = securityReportSpecSchema.parse(raw);

    const savedDoc = await prisma.securityReportDocument.create({
      data: {
        projectId,
        threatModel: spec.threatModel as any,
        owaspReview: spec.owaspReview as any,
        authenticationAudit: spec.authenticationAudit as any,
        authorizationAudit: spec.authorizationAudit as any,
        dependencyScan: spec.dependencyScan as any,
        secretDetection: spec.secretDetection as any,
        apiSecurityReview: spec.apiSecurityReview as any,
        infrastructureReview: spec.infrastructureReview as any,
        dataProtectionReport: spec.dataProtectionReport as any,
        complianceReport: spec.complianceReport as any,
        riskScore: spec.riskScore as any,
        remediationPlan: spec.remediationPlan as any,
        status: spec.status,
      },
    });

    const memory = getMemoryManager();
    await Promise.all([
      prisma.document.create({
        data: {
          projectId,
          type: 'SECURITY_REPORT',
          title: `Security Audit & Threat Model Report`,
          content: JSON.stringify(spec),
          author: SEC_ROLE_NAME,
        },
      }),
      memory.remember({
        agentId,
        content: `Project ${projectId}: Generated Security Report with risk score ${spec.riskScore.overallScore} (${spec.riskScore.riskLevel}) and ${spec.threatModel.length} threats analyzed.`,
        type: 'PROJECT',
        metadata: { projectId, docId: savedDoc.id },
      }),
    ]);

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('SECURITY_REPORT_COMPLETED', { projectId, docId: savedDoc.id, score: spec.riskScore.overallScore }, agentId);

    return { success: true, data: spec };
  } catch (err) {
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
    await logAIEvent('SECURITY_REPORT_FAILED', { projectId, error: String(err) }, agentId);
    return {
      success: false,
      error: {
        message: err instanceof Error ? err.message : 'Security report generation failed',
        code: 'AI_ERROR',
      },
    };
  }
}
