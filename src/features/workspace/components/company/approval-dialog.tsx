'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  requestedBy: string;
  artifactName?: string;
  urgency: 'normal' | 'high' | 'critical';
}

export function ApprovalDialog({
  request,
  onApprove,
  onReject,
  onRequestChanges,
}: {
  request: ApprovalRequest;
  onApprove: () => void;
  onReject: () => void;
  onRequestChanges?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-accent/25 bg-accent/5 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-sm font-semibold text-accent">
          !
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">{request.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{request.description}</p>
          {request.artifactName && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Artifact: <span className="font-medium text-foreground">{request.artifactName}</span>
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button onClick={onApprove} className="h-9 rounded-xl text-xs font-semibold">
          Approve & continue
        </Button>
        {onRequestChanges && (
          <Button
            onClick={onRequestChanges}
            variant="outline"
            className="h-9 rounded-xl text-xs"
          >
            Request changes
          </Button>
        )}
        <Button onClick={onReject} variant="ghost" className="h-9 rounded-xl text-xs text-muted-foreground">
          Reject
        </Button>
      </div>
    </div>
  );
}
