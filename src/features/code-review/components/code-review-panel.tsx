'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { useToast } from '@/components/ui/toast';
import { useCodeReview } from '../hooks/use-review';
import { Shield, Play, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import type { CodeReviewResult, ReviewIssue } from '../types';

const SEVERITY_CONFIG = {
  critical: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', badge: 'bg-red-100 text-red-800' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800' },
};

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500';
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r="36" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
        <circle
          cx="44"
          cy="44"
          r="36"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} -rotate-90 transition-all duration-1000`}
        />
      </svg>
      <span className={`absolute text-2xl font-bold ${color}`}>{score}</span>
    </div>
  );
}

function IssueItem({ issue }: { issue: ReviewIssue }) {
  const config = SEVERITY_CONFIG[issue.severity];
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border p-3 ${config.bg}`}>
      <div className="flex items-start gap-2">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge className={config.badge}>{issue.severity}</Badge>
            <span className="text-xs text-muted-foreground">{issue.category}</span>
            {issue.file && (
              <span className="text-[10px] text-muted-foreground/60">
                {issue.file}{issue.line ? `:${issue.line}` : ''}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs">{issue.message}</p>
          {issue.suggestion && (
            <p className="mt-1 text-[11px] text-muted-foreground italic">
              Suggestion: {issue.suggestion}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function CodeReviewPanel({ projectId }: { projectId: string }) {
  const [result, setResult] = useState<CodeReviewResult | null>(null);
  const reviewMutation = useCodeReview();
  const { addToast } = useToast();

  async function handleReview() {
    try {
      const res = await fetch(`/api/projects/${projectId}/explorer`);
      const json = await res.json();
      const files = json.data?.files ?? [];

      if (files.length === 0) {
        addToast({ type: 'warning', title: 'No files to review', description: 'Generate some code first.' });
        return;
      }

      const reviewFiles = files.slice(0, 10).map((f: { name: string; content: string }) => ({
        name: f.name,
        content: f.content || '',
      }));

      const reviewResult = await reviewMutation.mutateAsync({ projectId, files: reviewFiles });
      setResult(reviewResult);
      addToast({
        type: reviewResult.score >= 70 ? 'success' : 'warning',
        title: `Review complete — Score: ${reviewResult.score}/100`,
        description: `${reviewResult.issues.length} issue(s) found across ${reviewResult.filesReviewed} file(s).`,
      });
    } catch {
      addToast({ type: 'error', title: 'Review failed', description: 'Please try again.' });
    }
  }

  const criticalCount = result?.issues.filter((i) => i.severity === 'critical').length ?? 0;
  const warningCount = result?.issues.filter((i) => i.severity === 'warning').length ?? 0;
  const infoCount = result?.issues.filter((i) => i.severity === 'info').length ?? 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-medium">Code Review</span>
        </div>
        <Button size="sm" onClick={handleReview} disabled={reviewMutation.isPending}>
          {reviewMutation.isPending ? (
            <Loading label="Reviewing..." className="h-3.5 w-3.5" />
          ) : (
            <>
              <Play className="h-3.5 w-3.5" />
              Run Review
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!result && !reviewMutation.isPending && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Shield className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">No review yet</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Click "Run Review" to analyze your code for bugs, security issues, and improvements.
            </p>
          </div>
        )}

        {reviewMutation.isPending && (
          <div className="flex h-full items-center justify-center">
            <Loading label="AI is reviewing your code..." />
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <ScoreRing score={result.score} />
              <div className="flex-1">
                <p className="text-sm font-medium">{result.summary}</p>
                <div className="mt-2 flex gap-3">
                  {criticalCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-red-600">
                      <XCircle className="h-3 w-3" /> {criticalCount} critical
                    </span>
                  )}
                  {warningCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-yellow-600">
                      <AlertTriangle className="h-3 w-3" /> {warningCount} warning{warningCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {infoCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-blue-600">
                      <Info className="h-3 w-3" /> {infoCount} info
                    </span>
                  )}
                </div>
              </div>
            </div>

            {result.strengths.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-medium text-muted-foreground">Strengths</h4>
                <div className="space-y-1">
                  {result.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <CheckCircle className="mt-0.5 h-3 w-3 text-green-500" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.issues.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                  Issues ({result.issues.length})
                </h4>
                <div className="space-y-2">
                  {result.issues.map((issue, i) => (
                    <IssueItem key={i} issue={issue} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
