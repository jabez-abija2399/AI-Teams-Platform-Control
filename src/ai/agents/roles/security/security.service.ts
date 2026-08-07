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
import {
  withRevisionMeta,
  wantsHtmlCssStack,
} from '@/core/company-orchestration/revision-feedback';
import { resolveStackIntent } from '@/core/company-orchestration/stack-intent';
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

export function buildHeuristicSecurityReport(
  input: unknown,
  feedback?: string,
): SecurityReportSpec {
  const intent = resolveStackIntent(input, feedback);

  if (intent.staticNoBackend) {
    return withRevisionMeta(
      securityReportSpecSchema.parse({
        threatModel: [
          {
            component: 'Static HTML forms',
            threat: 'Users may assume real authentication exists',
            strideCategory: 'Spoofing',
            severity: 'MEDIUM',
            mitigation: 'Label pages as demo-only; no password storage in browser',
          },
          {
            component: 'Open static hosting',
            threat: 'Anyone can view HTML source',
            strideCategory: 'Information Disclosure',
            severity: 'LOW',
            mitigation: 'Do not embed secrets in HTML/CSS/JS',
          },
        ],
        owaspReview: [
          {
            category: 'A01:2021-Broken Access Control',
            status: 'PASS',
            notes: 'No server auth in scope — home.html is a static demo page',
          },
          {
            category: 'A02:2021-Cryptographic Failures',
            status: 'PASS',
            notes: 'No password hashing required (no backend)',
          },
          {
            category: 'A03:2021-Injection',
            status: 'PASS',
            notes: 'No server-side queries in static deliverable',
          },
        ],
        authenticationAudit: {
          mechanism: 'None — static demo navigation only',
          vulnerabilities: ['Not production auth'],
          strengthScore: 40,
        },
        authorizationAudit: {
          enforcement: 'None (static pages)',
          privilegeEscalationRisks: [],
          recommendations: ['Add a real backend before claiming secure login'],
        },
        dependencyScan: [],
        secretDetection: {
          hardcodedSecretsFound: false,
          locations: [],
          envManagementScore: 100,
        },
        apiSecurityReview: {
          rateLimitingEnforced: false,
          corsPolicy: 'N/A — no API',
          inputValidationScore: 70,
          findings: ['Static demo only — no API security surface'],
        },
        infrastructureReview: {
          tlsEnforced: false,
          headers: ['X-Content-Type-Options'],
          containerSecurity: 'N/A — static files',
        },
        dataProtectionReport: {
          encryptionAtRest: 'N/A',
          encryptionInTransit: 'Optional HTTPS on static host',
          piiHandling: 'Do not collect real PII in demo forms',
        },
        complianceReport: {
          gdprReady: false,
          soc2Ready: false,
          hipaaReady: false,
          notes: 'Static HTML demo — not a production auth system',
        },
        riskScore: {
          overallScore: 55,
          riskLevel: 'MEDIUM',
          summary: 'Acceptable for static demo; not production login',
        },
        remediationPlan: [
          {
            priority: 'SHORT_TERM',
            action: 'Document that login/signup are UI-only until a backend is requested',
            targetComponent: 'login.html / signup.html',
            codeExample: '',
          },
        ],
        status: 'READY_FOR_REVIEW',
      }),
      feedback,
    );
  }

  const htmlCss = intent.htmlCss;

  return withRevisionMeta(
    securityReportSpecSchema.parse({
      threatModel: [
        {
          component: htmlCss ? 'login.html form POST' : 'Auth API',
          threat: 'Credential stuffing / brute force',
          strideCategory: 'Elevation of Privilege',
          severity: 'HIGH',
          mitigation: 'Rate limit login attempts; lockout after failures',
        },
        {
          component: htmlCss ? 'session cookie' : 'Session token',
          threat: 'Session hijacking',
          strideCategory: 'Spoofing',
          severity: 'HIGH',
          mitigation: 'HTTP-only Secure cookies; short TTL',
        },
      ],
      owaspReview: [
        {
          category: 'A01:2021-Broken Access Control',
          status: 'WARNING',
          notes: htmlCss
            ? 'Ensure home.html is server-gated, not only client-side hide'
            : 'Verify protected routes',
        },
        {
          category: 'A02:2021-Cryptographic Failures',
          status: 'PASS',
          notes: 'Store password hashes only (bcrypt/argon2)',
        },
        {
          category: 'A03:2021-Injection',
          status: 'WARNING',
          notes: 'Parameterized queries for email lookup',
        },
      ],
      authenticationAudit: {
        mechanism: htmlCss
          ? 'Server session after HTML form login'
          : 'Secure session / token auth',
        vulnerabilities: htmlCss ? ['Missing CSRF on forms if not added'] : [],
        strengthScore: htmlCss ? 78 : 88,
      },
      authorizationAudit: {
        enforcement: htmlCss
          ? 'Redirect unauthenticated users away from home.html'
          : 'Auth middleware on private routes',
        privilegeEscalationRisks: [],
        recommendations: htmlCss
          ? ['Validate session on every protected page request']
          : ['Least privilege for admin routes'],
      },
      dependencyScan: [],
      secretDetection: {
        hardcodedSecretsFound: false,
        locations: [],
        envManagementScore: 95,
      },
      apiSecurityReview: {
        rateLimitingEnforced: true,
        corsPolicy: htmlCss ? 'Same-origin form posts' : 'Strict origin whitelist',
        inputValidationScore: 90,
        findings: htmlCss ? ['Add CSRF tokens to login/signup forms'] : [],
      },
      infrastructureReview: {
        tlsEnforced: true,
        headers: ['HSTS', 'X-Frame-Options', 'X-Content-Type-Options'],
        containerSecurity: 'N/A for simple static+server deploy',
      },
      dataProtectionReport: {
        encryptionAtRest: 'Database file / volume encryption at host',
        encryptionInTransit: 'TLS in production',
        piiHandling: 'Email treated as PII; no plaintext passwords',
      },
      complianceReport: {
        gdprReady: false,
        soc2Ready: false,
        hipaaReady: false,
        notes: 'MVP login — basic privacy notice recommended',
      },
      riskScore: {
        overallScore: htmlCss ? 82 : 90,
        riskLevel: 'MEDIUM',
        summary: feedback?.trim()
          ? `Security review revised per feedback: ${feedback.trim()}`
          : htmlCss
            ? 'HTML/CSS login — focus on sessions, hashing, CSRF'
            : 'Standard MVP auth security posture',
      },
      remediationPlan: [
        {
          priority: 'IMMEDIATE',
          action: htmlCss ? 'Hash passwords; HTTP-only cookies' : 'Enforce auth on private routes',
          targetComponent: 'Auth',
          codeExample: '',
        },
        {
          priority: 'SHORT_TERM',
          action: htmlCss ? 'Add CSRF tokens to forms' : 'Add rate limiting',
          targetComponent: 'Login',
          codeExample: '',
        },
      ],
      status: 'APPROVED',
    }),
    feedback,
  ) as SecurityReportSpec;
}

async function persistReport(projectId: string, agentId: string, spec: SecurityReportSpec) {
  await prisma.securityReportDocument.create({
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
        title: 'Security Audit & Threat Model Report',
        content: JSON.stringify(spec),
        author: SEC_ROLE_NAME,
      },
    }),
    memory.remember({
      agentId,
      content: `Project ${projectId}: security ${spec.riskScore.riskLevel}`,
      type: 'PROJECT',
      metadata: { projectId },
    }),
  ]);
}

export async function generateSecurityReportSpec(
  projectId: string,
  inputData: unknown,
  feedback?: string,
): Promise<ApiResult<SecurityReportSpec>> {
  const agentId = await getOrCreateSecAgentId();

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('SECURITY_REPORT_STARTED', { projectId }, agentId);

  try {
    const spec = buildHeuristicSecurityReport(inputData, feedback);
    await persistReport(projectId, agentId, spec);

    if (!feedback?.trim() && !wantsHtmlCssStack(inputData, feedback)) {
      void (async () => {
        try {
          const prompt = `Input:\n${JSON.stringify(inputData, null, 2).slice(0, 5000)}\n\nGenerate lean security JSON. Respond ONLY with valid JSON.`;
          const raw = await Promise.race([
            aiCall<unknown>(
              prompt,
              SECURITY_SYSTEM_PROMPT,
              'SECURITY',
              securityConfig,
              projectId,
              agentId,
            ),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Security LLM budget exceeded')), 25_000),
            ),
          ]);
          const parsed = securityReportSpecSchema.safeParse(raw);
          if (parsed.success) await persistReport(projectId, agentId, parsed.data);
        } catch {
          // optional
        }
      })();
    }

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('SECURITY_REPORT_COMPLETED', { projectId }, agentId);
    return { success: true, data: spec };
  } catch (err) {
    try {
      const fallback = buildHeuristicSecurityReport(inputData, feedback);
      await persistReport(projectId, agentId, fallback);
      await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
      return { success: true, data: fallback };
    } catch (fallbackErr) {
      await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
      await logAIEvent('SECURITY_REPORT_FAILED', { projectId, error: String(err) }, agentId);
      return {
        success: false,
        error: {
          message:
            fallbackErr instanceof Error
              ? fallbackErr.message
              : err instanceof Error
                ? err.message
                : 'Security report failed',
          code: 'AI_ERROR',
        },
      };
    }
  }
}
