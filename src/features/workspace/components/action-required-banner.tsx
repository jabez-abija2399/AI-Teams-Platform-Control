'use client';

import React, { useState } from 'react';
import { AlertCircle, Check, X, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface ActionRequiredBannerProps {
  title?: string;
  projectName?: string;
  agentName?: string;
  onApprove?: () => void;
  onRequestChanges?: () => void;
}

export function ActionRequiredBanner({
  title = 'ACTION REQUIRED: Design specification is ready for review.',
  projectName = 'StudyMate',
  agentName = 'Designer',
  onApprove,
  onRequestChanges,
}: ActionRequiredBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleApproveAction = () => {
    toast.success('Specification approved! Agent proceeding to code implementation.');
    if (onApprove) onApprove();
    setDismissed(true);
  };

  const handleRequestChangesAction = () => {
    toast.info('Change request sent to Agent for revision cycle.');
    if (onRequestChanges) onRequestChanges();
  };

  return (
    <div className="w-full bg-surface border-b border-primary border-l-4 border-l-primary flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 gap-3 font-mono text-xs z-30 shrink-0">
      <div className="flex items-center gap-2 text-white">
        <AlertCircle className="w-4 h-4 text-primary shrink-0" />
        <span className="font-bold">{title}</span>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <button
          type="button"
          onClick={handleRequestChangesAction}
          className="flex-1 sm:flex-initial bg-transparent border border-white/10 text-on-surface-variant hover:text-white px-3 py-1.5 rounded transition-colors uppercase tracking-wider text-[11px]"
        >
          Request Changes
        </button>
        <button
          type="button"
          onClick={handleApproveAction}
          className="flex-1 sm:flex-initial bg-primary text-black font-bold px-4 py-1.5 rounded hover:bg-primary-container transition-colors uppercase tracking-wider text-[11px] glow-cyan flex items-center justify-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Approve</span>
        </button>
      </div>
    </div>
  );
}
