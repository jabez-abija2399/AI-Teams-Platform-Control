'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, RefreshCw, Send, ArrowLeft, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export type CheckpointState =
  | 'NORMAL'
  | 'REQUEST_CHANGES'
  | 'ISSUES_DETECTED'
  | 'APPROVED_SUCCESS'
  | 'REVISION_SUCCESS'
  | 'BLOCKED_FAILED_CHECKS';

interface CheckpointApprovalDockProps {
  initialState?: CheckpointState;
  checkpointTitle?: string;
  agentRole?: string;
  onApprove?: () => void;
  onRequestChanges?: (feedback: string) => void;
}

export function CheckpointApprovalDock({
  initialState = 'NORMAL',
  checkpointTitle = 'Design specification is ready for review.',
  agentRole = 'Designer',
  onApprove,
  onRequestChanges,
}: CheckpointApprovalDockProps) {
  const [currentState, setCurrentState] = useState<CheckpointState>(initialState);
  const [feedbackNote, setFeedbackNote] = useState('');

  const handleApprove = () => {
    setCurrentState('APPROVED_SUCCESS');
    toast.success('Checkpoint approved! Agent proceeding to execution.');
    if (onApprove) onApprove();
  };

  const handleSendRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackNote.trim()) {
      toast.error('Please enter revision feedback instructions.');
      return;
    }
    setCurrentState('REVISION_SUCCESS');
    toast.info('Revision requested! Feedback sent to Agent.');
    if (onRequestChanges) onRequestChanges(feedbackNote);
  };

  return (
    <div className="w-full bg-surface border-b border-white/10 font-mono text-xs z-30 shrink-0">
      {/* STATE 1: NORMAL */}
      {currentState === 'NORMAL' && (
        <div className="border-l-4 border-l-primary p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface">
          <div className="flex items-center gap-2.5 text-white">
            <AlertCircle className="w-4 h-4 text-primary shrink-0" />
            <span className="font-bold">CHECKPOINT: {checkpointTitle}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setCurrentState('REQUEST_CHANGES')}
              className="bg-transparent border border-white/10 text-on-surface-variant hover:text-white px-3 py-1.5 rounded transition-colors uppercase tracking-wider text-[11px]"
            >
              Request Changes
            </button>
            <button
              type="button"
              onClick={handleApprove}
              className="bg-primary text-black font-bold px-4 py-1.5 rounded hover:bg-primary-container transition-colors uppercase tracking-wider text-[11px] glow-cyan flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve</span>
            </button>
          </div>
        </div>
      )}

      {/* STATE 2: REQUEST CHANGES FORM */}
      {currentState === 'REQUEST_CHANGES' && (
        <form onSubmit={handleSendRevision} className="border-l-4 border-l-warning p-4 bg-background space-y-3">
          <div className="flex justify-between items-center text-warning font-bold">
            <span>REQUEST REVISION FOR {agentRole.toUpperCase()} AGENT</span>
            <button
              type="button"
              onClick={() => setCurrentState('NORMAL')}
              className="text-on-surface-variant hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <textarea
            value={feedbackNote}
            onChange={(e) => setFeedbackNote(e.target.value)}
            placeholder="Describe required changes... (e.g. Please update the color token variables and fix mobile grid spacing)."
            className="w-full bg-surface border border-white/10 text-white p-3 rounded font-mono text-xs outline-none focus:border-warning h-20 resize-none"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCurrentState('NORMAL')}
              className="px-3 py-1.5 text-on-surface-variant hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-warning text-black font-bold px-4 py-1.5 rounded hover:opacity-90 transition-colors uppercase tracking-wider flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Revision Feedback</span>
            </button>
          </div>
        </form>
      )}

      {/* STATE 3: APPROVED SUCCESS */}
      {currentState === 'APPROVED_SUCCESS' && (
        <div className="border-l-4 border-l-primary p-3 bg-primary/10 flex items-center justify-between text-primary">
          <div className="flex items-center gap-2.5 font-bold">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>CHECKPOINT APPROVED — AGENT RESUMING WORKFORCE PIPELINE</span>
          </div>
          <button
            type="button"
            onClick={() => setCurrentState('NORMAL')}
            className="text-xs text-on-surface-variant hover:text-white underline"
          >
            Reset State
          </button>
        </div>
      )}

      {/* STATE 4: REVISION SUCCESS */}
      {currentState === 'REVISION_SUCCESS' && (
        <div className="border-l-4 border-l-warning p-3 bg-warning/10 flex items-center justify-between text-warning">
          <div className="flex items-center gap-2.5 font-bold">
            <RefreshCw className="w-4 h-4 text-warning animate-spin" />
            <span>REVISION REQUESTED — AGENT RE-SYNTHESIZING SPECIFICATION</span>
          </div>
          <button
            type="button"
            onClick={() => setCurrentState('NORMAL')}
            className="text-xs text-on-surface-variant hover:text-white underline"
          >
            Reset State
          </button>
        </div>
      )}
    </div>
  );
}
