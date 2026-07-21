'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { useProjectHealth, useCalculateHealth } from '@/features/analytics/hooks/use-project-health';
import { Heart, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

function ScoreCircle({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  let strokeColor = 'stroke-green-500';
  let textColor = 'text-green-600';
  if (score < 60) {
    strokeColor = 'stroke-red-500';
    textColor = 'text-red-600';
  } else if (score < 80) {
    strokeColor = 'stroke-yellow-500';
    textColor = 'text-yellow-600';
  }

  return (
    <div className="relative flex items-center justify-center">
      <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/50"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className={cn(strokeColor, 'transition-all duration-500')}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn('text-3xl font-bold', textColor)}>{score}</span>
        <span className="text-muted-foreground text-xs">/ 100</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let color = 'bg-gray-100 text-gray-800';
  let Icon: typeof CheckCircle = AlertTriangle;

  if (status === 'healthy') {
    color = 'bg-green-100 text-green-800';
    Icon = CheckCircle;
  } else if (status === 'warning') {
    color = 'bg-yellow-100 text-yellow-800';
    Icon = AlertTriangle;
  } else if (status === 'critical') {
    color = 'bg-red-100 text-red-800';
    Icon = XCircle;
  }

  return (
    <Badge className={color}>
      <Icon className="h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export function HealthScore({ projectId }: { projectId: string }) {
  const { data: health, isLoading } = useProjectHealth(projectId);
  const calculateMutation = useCalculateHealth(projectId);

  if (isLoading) return <Loading label="Loading health score..." />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Project Health</CardTitle>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => calculateMutation.mutate()}
            disabled={calculateMutation.isPending}
            title="Recalculate health"
          >
            <RefreshCw className={cn('h-3 w-3', calculateMutation.isPending && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!health ? (
          <div className="flex flex-col items-center py-6 text-center">
            <Heart className="text-muted-foreground mb-2 h-8 w-8" />
            <p className="text-muted-foreground text-sm">No health data yet</p>
            <p className="text-muted-foreground text-xs">Click the refresh button to calculate.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-3">
              <ScoreCircle score={health.score} />
              <StatusBadge status={health.status} />
            </div>

            {health.recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Recommendations</p>
                <ul className="space-y-1.5">
                  {health.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0 text-yellow-500" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-muted-foreground text-center text-xs">
              Updated {new Date(health.updatedAt).toLocaleString()}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
