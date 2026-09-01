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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-4xl mx-auto font-sans text-gray-200 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white font-mono">Designer — Design Specification Review</h2>
            <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">Checkpoint Gate</Badge>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Inspect design tokens, layout hierarchy, interaction states, and accessibility standards before Developer builds software.
          </p>
        </div>
      </div>

      {/* Palette Tokens */}
      <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-4 space-y-3">
        <h3 className="font-mono text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
          <Palette className="w-4 h-4" /> Design System Tokens & Color Palette
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-indigo-600/20 border border-indigo-500/40 p-3 rounded text-indigo-300">
            <span className="block text-[10px] text-gray-400 uppercase">Primary</span>
            <span className="font-bold">{spec.colorPalette.primary}</span>
          </div>
          <div className="bg-gray-900 border border-gray-700 p-3 rounded text-gray-200">
            <span className="block text-[10px] text-gray-400 uppercase">Background</span>
            <span className="font-bold">{spec.colorPalette.background}</span>
          </div>
          <div className="bg-emerald-950/40 border border-emerald-800/40 p-3 rounded text-emerald-300">
            <span className="block text-[10px] text-gray-400 uppercase">Accent</span>
            <span className="font-bold">{spec.colorPalette.accent}</span>
          </div>
          <div className="bg-purple-950/40 border border-purple-800/40 p-3 rounded text-purple-300">
            <span className="block text-[10px] text-gray-400 uppercase">Typography</span>
            <span className="font-bold">{spec.typography.split(' ')[0]}</span>
          </div>
        </div>
      </div>

      {/* Pages & Component Hierarchy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        {/* Pages */}
        <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-4 space-y-2">
          <h3 className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layout className="w-3.5 h-3.5" /> Specified Page Layouts
          </h3>
          <ul className="space-y-1.5 font-mono text-xs text-gray-300 pt-1">
            {spec.pages?.map((pg: string, idx: number) => (
              <li key={idx} className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded">
                <span className="text-indigo-400 font-bold">•</span>
                <span>{pg}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* States & Accessibility */}
        <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-4 space-y-3">
          <div>
            <h3 className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Interaction States Handled
            </h3>
            <div className="flex flex-wrap gap-1.5 font-mono text-xs pt-1.5">
              {spec.interactionStates?.map((st: string, idx: number) => (
                <span key={idx} className="bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 px-2.5 py-1 rounded text-[11px]">
                  {st}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-800">
            <h3 className="font-mono text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Accessibility className="w-3.5 h-3.5" /> Accessibility Guarantee
            </h3>
            <p className="text-xs text-gray-300 pt-1 leading-relaxed font-mono">{spec.accessibility}</p>
          </div>
        </div>
      </div>

      {/* Revision Form */}
      {showRevisionForm && (
        <div className="bg-gray-950 border border-amber-800/50 rounded-lg p-4 space-y-3">
          <label className="block text-xs font-mono font-bold text-amber-400">
            Request Revision — Feedback for Designer Agent:
          </label>
          <textarea
            value={revisionFeedback}
            onChange={(e) => setRevisionFeedback(e.target.value)}
            placeholder="Explain required UI/UX, color, or layout changes..."
            className="w-full bg-gray-900 border border-gray-800 rounded-md p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowRevisionForm(false)} className="text-xs text-gray-400">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => onRequestRevision(revisionFeedback)}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-bold"
            >
              Submit Design Feedback
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
        <Button
          variant="outline"
          onClick={() => setShowRevisionForm(!showRevisionForm)}
          className="border-gray-800 text-gray-300 hover:text-white text-xs gap-1.5 font-mono"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Request Revision
        </Button>

        <Button
          onClick={onApprove}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs px-6 py-2 gap-2 shadow-lg shadow-indigo-600/20"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          Approve Design Specification →
        </Button>
      </div>
    </div>
  );
}
