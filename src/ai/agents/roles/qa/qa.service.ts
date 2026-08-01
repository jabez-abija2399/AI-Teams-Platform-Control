import { prisma } from '@/lib/prisma';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { aiCall } from '@/ai/agents/core/ai-call';
import { qaConfig } from './qa.config';
import { QA_SYSTEM_PROMPT } from './qa.prompt';
import {
  qaReportSpecSchema,
  type QaReportSpec,
} from './qa.types';
import type { ApiResult } from '@/types/common.types';

const QA_ROLE_NAME = 'Quality Assurance Engineer';

async function getOrCreateQAAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'QA' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: {
      name: QA_ROLE_NAME,
      role: 'QA',
      status: 'IDLE',
      capabilities: ['TESTING', 'CODE_REVIEW', 'BUG_FIXING', 'DOCUMENTATION'],
    },
  });
  return created.id;
}

export async function generateQaReportSpec(
  projectId: string,
  inputData: unknown,
): Promise<ApiResult<QaReportSpec>> {
  const agentId = await getOrCreateQAAgentId();

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('QA_REPORT_STARTED', { projectId }, agentId);

  try {
    const prompt = `Input Architecture, Implementation, and Specifications:\n${JSON.stringify(inputData, null, 2)}\n\nGenerate comprehensive QA Test Plan and Quality Report (Unit, Integration, E2E, Regression, Coverage, Risk Matrix, Bug Reports, Performance, Accessibility, Security). Produce JSON matching the exact required deliverable schema.\nRespond ONLY with valid JSON.`;

    const raw = await aiCall<unknown>(
      prompt,
      QA_SYSTEM_PROMPT,
      'QA',
      qaConfig,
      projectId,
      agentId,
    );

    const spec = qaReportSpecSchema.parse(raw);

    const savedDoc = await prisma.qaReportDocument.create({
      data: {
        projectId,
        unitTests: spec.unitTests as any,
        integrationTests: spec.integrationTests as any,
        e2eTests: spec.e2eTests as any,
        regressionPlan: spec.regressionPlan as any,
        coverageAnalysis: spec.coverageAnalysis as any,
        riskMatrix: spec.riskMatrix as any,
        bugReports: spec.bugReports as any,
        testSuites: spec.testSuites as any,
        performanceTests: spec.performanceTests as any,
        accessibilityTests: spec.accessibilityTests as any,
        securityTests: spec.securityTests as any,
        qualityReport: spec.qualityReport as any,
        status: spec.status,
      },
    });

    const memory = getMemoryManager();
    await Promise.all([
      prisma.document.create({
        data: {
          projectId,
          type: 'TEST_PLAN',
          title: `Comprehensive QA Test Plan & Quality Report`,
          content: JSON.stringify(spec),
          author: QA_ROLE_NAME,
        },
      }),
      memory.remember({
        agentId,
        content: `Project ${projectId}: Generated Quality Report with score ${spec.qualityReport.score} (${spec.qualityReport.verdict}) and ${spec.bugReports.length} bug reports.`,
        type: 'PROJECT',
        metadata: { projectId, docId: savedDoc.id },
      }),
    ]);

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('QA_REPORT_COMPLETED', { projectId, docId: savedDoc.id, score: spec.qualityReport.score }, agentId);

    return { success: true, data: spec };
  } catch (err) {
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
    await logAIEvent('QA_REPORT_FAILED', { projectId, error: String(err) }, agentId);
    return {
      success: false,
      error: {
        message: err instanceof Error ? err.message : 'QA report generation failed',
        code: 'AI_ERROR',
      },
    };
  }
}

export async function reviewImplementation(
  projectId: string,
  implementation: unknown,
): Promise<ApiResult<QaReportSpec>> {
  return generateQaReportSpec(projectId, implementation);
}

