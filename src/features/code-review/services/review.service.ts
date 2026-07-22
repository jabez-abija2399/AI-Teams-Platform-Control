import { aiGenerate } from '@/ai/gateway/ai.gateway';
import type { CodeReviewResult, ReviewIssue } from '../types';

const SYSTEM_PROMPT = `You are an expert code reviewer. Analyze the provided code files and return a JSON review.

Review for:
1. Bugs and logic errors
2. Security vulnerabilities (XSS, SQL injection, hardcoded secrets)
3. Performance issues (N+1 queries, unnecessary re-renders, memory leaks)
4. Code quality (naming, structure, readability)
5. Best practices (error handling, type safety, accessibility)

Return ONLY valid JSON with this structure:
{
  "score": <0-100 number>,
  "summary": "<1-2 sentence overall assessment>",
  "issues": [
    {
      "file": "<filename>",
      "line": <line number or null>,
      "severity": "critical" | "warning" | "info",
      "category": "<category like Security, Performance, etc>",
      "message": "<what's wrong>",
      "suggestion": "<how to fix it>"
    }
  ],
  "strengths": ["<positive thing about the code>"]
}

Be specific and actionable. Focus on real issues, not style preferences.`;

export async function reviewCode(
  files: { name: string; content: string }[],
): Promise<CodeReviewResult> {
  const fileContents = files
    .map(
      (f) =>
        `--- ${f.name} ---\n${f.content.length > 6000 ? f.content.slice(0, 6000) + '\n... (truncated)' : f.content}`,
    )
    .join('\n\n');

  const response = await aiGenerate({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Review these ${files.length} file(s):\n\n${fileContents}`,
      },
    ],
    maxTokens: 4096,
    temperature: 0.2,
  });

  try {
    const parsed = JSON.parse(response.content) as CodeReviewResult;
    return {
      score: Math.max(0, Math.min(100, parsed.score ?? 0)),
      summary: parsed.summary ?? 'No summary provided.',
      issues: (parsed.issues ?? []).map((i: ReviewIssue) => ({
        file: i.file,
        line: i.line,
        severity: ['critical', 'warning', 'info'].includes(i.severity) ? i.severity : 'info',
        category: i.category ?? 'General',
        message: i.message ?? '',
        suggestion: i.suggestion,
      })),
      strengths: parsed.strengths ?? [],
      filesReviewed: files.length,
    };
  } catch {
    const jsonMatch = response.content.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch?.[1]) {
      const parsed = JSON.parse(jsonMatch[1]) as CodeReviewResult;
      return {
        score: Math.max(0, Math.min(100, parsed.score ?? 0)),
        summary: parsed.summary ?? 'No summary provided.',
        issues: (parsed.issues ?? []).map((i: ReviewIssue) => ({
          file: i.file,
          line: i.line,
          severity: ['critical', 'warning', 'info'].includes(i.severity) ? i.severity : 'info',
          category: i.category ?? 'General',
          message: i.message ?? '',
          suggestion: i.suggestion,
        })),
        strengths: parsed.strengths ?? [],
        filesReviewed: files.length,
      };
    }
    throw new Error('Failed to parse review response');
  }
}
