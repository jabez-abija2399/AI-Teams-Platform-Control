'use client';

import React, { useState } from 'react';
import { Check, RotateCcw, Palette, Layout, Eye, Accessibility } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DesignerReviewCheckpointProps {
  designSpec: any;
  onApprove: () => void;
  onRequestRevision: (feedback: string) => void;
}

export function DesignerReviewCheckpoint({
  designSpec,
  onApprove,
  onRequestRevision,
}: DesignerReviewCheckpointProps) {
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  const spec = designSpec || {
    colorPalette: {
      primary: '#6366f1 (Indigo)',
      background: '#030712 (Dark Surface)',
      text: '#f9fafb (Clean Crisp Text)',
      accent: '#10b981 (Emerald Green)',
    },
    typography: 'Inter / Outfit sans-serif hierarchy with monospaced data grids',
    pages: ['Landing / Hero', 'Auth (Login/Signup)', 'Booking Dashboard', 'Booking Form', 'Confirmation View'],
    interactionStates: ['Default State', 'Loading Spinner / Skeleton', 'Error Toast / Message', 'Empty State'],
    accessibility: 'WCAG AAA contrast, ARIA labels, full keyboard navigation compliance',
  };

  return (
    <div className="bg-[#1b1b1b] border border-[#3c4949] rounded-sm p-6 max-w-4xl mx-auto font-sans text-[#e2e2e2] space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#3c4949] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#56d9d9] font-mono uppercase tracking-wider">DESIGNER — DESIGN SPECIFICATION REVIEW</h2>
            <span className="bg-[#56d9d9]/10 text-[#56d9d9] border border-[#56d9d9]/30 text-[10px] font-mono px-2 py-0.5 rounded-sm uppercase tracking-widest font-bold">
              CHECKPOINT GATE
            </span>
          </div>
          <p className="text-xs text-[#bbc9c8] mt-1 font-sans">
            Inspect design tokens, layout hierarchy, interaction states, and accessibility standards before Developer builds software.
          </p>
        </div>
      </div>

      {/* Palette Tokens */}
      <div className="bg-[#131313] border border-[#3c4949] rounded-sm p-4 space-y-3">
        <h3 className="font-mono text-xs font-bold text-[#56d9d9] uppercase tracking-wider flex items-center gap-1.5">
          <Palette className="w-4 h-4" /> Design System Tokens & Color Palette
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-[#56d9d9]/10 border border-[#56d9d9]/40 p-3 rounded-sm text-[#56d9d9]">
            <span className="block text-[10px] text-[#869393] uppercase">Primary</span>
            <span className="font-bold">{spec.colorPalette.primary}</span>
          </div>
          <div className="bg-[#1b1b1b] border border-[#3c4949] p-3 rounded-sm text-[#e2e2e2]">
            <span className="block text-[10px] text-[#869393] uppercase">Background</span>
            <span className="font-bold">{spec.colorPalette.background}</span>
          </div>
          <div className="bg-[#00acac]/10 border border-[#00acac]/40 p-3 rounded-sm text-[#56d9d9]">
            <span className="block text-[10px] text-[#869393] uppercase">Accent</span>
            <span className="font-bold">{spec.colorPalette.accent}</span>
          </div>
          <div className="bg-[#353535] border border-[#3c4949] p-3 rounded-sm text-[#e2e2e2]">
            <span className="block text-[10px] text-[#869393] uppercase">Typography</span>
            <span className="font-bold">{spec.typography.split(' ')[0]}</span>
          </div>
        </div>
      </div>

      {/* Pages & Component Hierarchy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* Pages */}
        <div className="bg-[#131313] border border-[#3c4949] rounded-sm p-4 space-y-2">
          <h3 className="font-mono text-xs font-bold text-[#56d9d9] uppercase tracking-wider flex items-center gap-1.5">
            <Layout className="w-3.5 h-3.5" /> Specified Page Layouts
          </h3>
          <ul className="space-y-1.5 font-mono text-xs text-[#e2e2e2] pt-1">
            {spec.pages?.map((pg: string, idx: number) => (
              <li key={idx} className="flex items-center gap-2 bg-[#1b1b1b] border border-[#3c4949] px-3 py-1.5 rounded-sm">
                <span className="text-[#56d9d9] font-bold">•</span>
                <span>{pg}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* States & Accessibility */}
        <div className="bg-[#131313] border border-[#3c4949] rounded-sm p-4 space-y-3">
          <div>
            <h3 className="font-mono text-xs font-bold text-[#56d9d9] uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Interaction States Handled
            </h3>
            <div className="flex flex-wrap gap-1.5 font-mono text-xs pt-1.5">
              {spec.interactionStates?.map((st: string, idx: number) => (
                <span key={idx} className="bg-[#00acac]/10 border border-[#00acac]/40 text-[#56d9d9] px-2.5 py-1 rounded-sm text-[11px]">
                  {st}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-[#3c4949]">
            <h3 className="font-mono text-xs font-bold text-[#bbc9c8] uppercase tracking-wider flex items-center gap-1.5">
              <Accessibility className="w-3.5 h-3.5" /> Accessibility Guarantee
            </h3>
            <p className="text-xs text-[#e2e2e2] pt-1 leading-relaxed font-mono">{spec.accessibility}</p>
          </div>
        </div>
      </div>

      {/* Revision Form */}
      {showRevisionForm && (
        <div className="bg-[#0e0e0e] border border-[#e1824e]/50 rounded-sm p-4 space-y-3">
          <label className="block text-xs font-mono font-bold text-[#e1824e]">
            Request Revision — Feedback for Designer Agent:
          </label>
          <textarea
            value={revisionFeedback}
            onChange={(e) => setRevisionFeedback(e.target.value)}
            placeholder="Explain required UI/UX, color, or layout changes..."
            className="w-full bg-[#131313] border border-[#3c4949] rounded-sm p-3 text-xs text-[#e2e2e2] placeholder-[#869393] focus:outline-none focus:border-[#56d9d9]"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowRevisionForm(false)} className="text-xs text-[#bbc9c8]">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => onRequestRevision(revisionFeedback)}
              className="bg-[#e1824e] hover:bg-[#e1824e]/90 text-black text-xs font-mono font-bold rounded-sm"
            >
              Submit Design Feedback
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-[#3c4949]">
        <Button
          variant="outline"
          onClick={() => setShowRevisionForm(!showRevisionForm)}
          className="border-[#3c4949] text-[#e2e2e2] hover:bg-[#2a2a2a] text-xs gap-1.5 font-mono rounded-sm"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#e1824e]" />
          Request Revision
        </Button>

        <Button
          onClick={onApprove}
          className="bg-[#56d9d9] hover:bg-[#76f6f5] text-black font-mono font-bold text-xs px-6 py-2 gap-2 rounded-sm"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          Approve Design Specification →
        </Button>
      </div>
    </div>
  );
}
