import { z } from 'zod';
import { generateStructured } from '@/ai/services/ai.service';

const SecurityReviewFindingSchema = z.object({
  type: z.string().describe('Category like SQL_INJECTION, XSS, AUTH, LOGIC, etc.'),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
  description: z.string().describe('Clear description of the security issue'),
  line: z.number().optional().describe('Approximate line number if identifiable'),
  recommendation: z.string().describe('How to fix or mitigate the issue'),
});

const SecurityReviewResultSchema = z.object({
  findings: z.array(SecurityReviewFindingSchema),
  summary: z.string().describe('Overall security assessment in 1-2 sentences'),
  score: z.number().min(0).max(100).describe('Security score 0-100'),
});

export type SecurityReviewFinding = z.infer<typeof SecurityReviewFindingSchema>;
export type SecurityReviewResult = z.infer<typeof SecurityReviewResultSchema>;

const SYSTEM_PROMPT = `You are a senior application security engineer performing a code review. Analyze the provided code for security vulnerabilities and logic flaws. Focus on:

1. Injection attacks (SQL, NoSQL, command injection, template injection)
2. Authentication/authorization bypass
3. Insecure data handling and exposure
4. Race conditions and TOCTOU bugs
5. Improper input validation
6. Sensitive data leakage in logs or responses
7. Insecure cryptographic usage
8. SSRF, path traversal, open redirect
9. Missing rate limiting on sensitive endpoints
10. Improper error handling that leaks internals

Return a JSON object with:
- findings: array of security issues found
- summary: brief overall assessment
- score: 0-100 security score (100 = no issues)

Be specific about line numbers when possible. Do not report style issues or minor warnings — focus on actual security impact.`;

export async function aiSecurityReview(
  code: string,
  filePath: string,
  projectId: string,
  agentId?: string,
): Promise<SecurityReviewResult> {
  const result = await generateStructured<SecurityReviewResult>(
    {
      messages: [
        {
          role: 'user',
          content: `Perform a security review on the following file:

**File**: \`${filePath}\`

\`\`\`
${code.slice(0, 12000)}
\`\`\``,
        },
      ],
      systemPrompt: SYSTEM_PROMPT,
      schema: SecurityReviewResultSchema,
    },
    { projectId },
  );

  if (result.success) {
    return result.data;
  }

  return {
    findings: [],
    summary: `AI security review failed: ${result.error.message}`,
    score: 0,
  };
}
