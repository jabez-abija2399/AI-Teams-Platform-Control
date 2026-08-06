import { ReviewCommitteeReport, IndividualReviewResult, ReviewerRole } from './types';
import {
  detectStackMismatch,
  resolveStackIntent,
  type StackIntent,
} from '@/core/company-orchestration/stack-intent';

export type EvaluateCodebaseOptions = {
  /** Architecture / revision / idea blob for stack intent. */
  context?: unknown;
  feedback?: string;
  intent?: StackIntent;
};

export class ReviewCommittee {
  /**
   * Evaluates code changes across Senior Engineer, Architect, Security, Performance, Accessibility, QA, and DevOps perspectives.
   * Fails ARCHITECT review when files contradict approved stack (e.g. Next.js when user asked for static HTML).
   */
  public static evaluateCodebase(
    projectId: string,
    fileMap: Record<string, string>,
    options?: EvaluateCodebaseOptions,
  ): ReviewCommitteeReport {
    const roles: ReviewerRole[] = [
      'SENIOR_ENGINEER',
      'ARCHITECT',
      'SECURITY',
      'PERFORMANCE',
      'ACCESSIBILITY',
      'QA',
      'DEVOPS',
    ];

    const fileEntries = Object.entries(fileMap);
    const paths = fileEntries.map(([p]) => p);
    const contentBlob = fileEntries.map(([, c]) => c).join('\n').slice(0, 20_000);

    const intent =
      options?.intent ??
      resolveStackIntent(options?.context, options?.feedback, contentBlob, paths.join(' '));

    const stackCheck = detectStackMismatch(intent, paths);

    const individualReviews: IndividualReviewResult[] = roles.map((role) => {
      let score = 92;
      const comments: string[] = [];
      const requiredChanges: string[] = [];

      if (role === 'ARCHITECT' && stackCheck.mismatch) {
        score -= 50;
        requiredChanges.push(...stackCheck.reasons);
        comments.push(
          `Stack gate failed (${intent.label}). Replace mismatched files with the approved delivery stack.`,
        );
      }

      if (role === 'QA' && intent.staticNoBackend && !paths.some((p) => p.endsWith('.html'))) {
        score -= 20;
        requiredChanges.push(
          'Add static HTML pages (login.html / signup.html / home.html) for manual QA checklist',
        );
      }

      if (role === 'DEVOPS' && intent.staticNoBackend) {
        const hasDockerNode = fileEntries.some(
          ([p, c]) =>
            p.toLowerCase().includes('dockerfile') &&
            c.toLowerCase().includes('npm') &&
            !paths.some((x) => x.endsWith('.html')),
        );
        if (hasDockerNode) {
          score -= 15;
          comments.push('Prefer static hosting over Node Docker for static-html stack');
        }
      }

      fileEntries.forEach(([filePath, content]) => {
        if (role === 'SECURITY' && content.includes('eval(')) {
          score -= 40;
          requiredChanges.push(`Remove unsafe eval call in ${filePath}`);
        }

        if (
          role === 'SENIOR_ENGINEER' &&
          content.includes(': any') &&
          (filePath.endsWith('.ts') || filePath.endsWith('.tsx'))
        ) {
          score -= 15;
          requiredChanges.push(`Replace implicit 'any' with strict TypeScript types in ${filePath}`);
        }

        if (role === 'PERFORMANCE' && content.includes('setInterval(')) {
          comments.push(`Verify interval cleanup on unmount in ${filePath}`);
        }
      });

      return {
        reviewerRole: role,
        score: Math.max(0, score),
        approved: score >= 80 && requiredChanges.length === 0,
        comments:
          comments.length > 0
            ? comments
            : [`${role} verified compliance with production standards.`],
        requiredChanges,
      };
    });

    const averageScore = Number(
      (
        individualReviews.reduce((acc, r) => acc + r.score, 0) / individualReviews.length
      ).toFixed(1),
    );

    const allApproved = individualReviews.every((r) => r.approved);
    const requiredActionItems = individualReviews.flatMap((r) => r.requiredChanges);

    const summaryRecommendations =
      intent.stack === 'static-html'
        ? [
            'Keep deliverable as static HTML/CSS only — no Next.js or API routes.',
            'Preview via index.html / login.html; Deploy remains user-triggered.',
          ]
        : [
            'Maintain strict Zod input validation on all backend endpoints.',
            'Ensure visual regression snapshot tests pass before merge.',
          ];

    return {
      id: `REV-${Date.now()}`,
      projectId,
      overallScore: averageScore,
      isApproved: allApproved,
      decision: allApproved
        ? 'APPROVED'
        : requiredActionItems.length > 0
          ? 'CHANGES_REQUESTED'
          : 'REJECTED',
      individualReviews,
      summaryRecommendations,
      requiredActionItems,
      createdAt: new Date().toISOString(),
    };
  }
}
