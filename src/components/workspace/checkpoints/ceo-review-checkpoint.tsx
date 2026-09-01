'use client';

import React, { useState } from 'react';
import { Check, RotateCcw, FileText, Target, Users, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CEOReviewCheckpointProps {
  proposal: any;
  onApprove: () => void;
  onRequestRevision: (feedback: string) => void;
}

export function CEOReviewCheckpoint({
  proposal,
  onApprove,
  onRequestRevision,
}: CEOReviewCheckpointProps) {
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  const spec = proposal || {
    productName: 'Restaurant Booking Platform',
    vision: 'A modern platform connecting diners with table reservations.',
    problemStatement: 'Managing reservations and waitlists via phone causes high drop-off and manual overhead.',
    targetAudience: 'Restaurant owners, hosts, and tech-savvy diners',
    mvpFeatures: [
      'Customer table reservation booking flow',
      'Restaurant admin dashboard for managing bookings',
      'Automated email confirmation notifications',
    ],
    outOfScope: ['Mobile app native builds', 'Third-party POS hardware integrations'],
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-4xl mx-auto font-sans text-gray-200 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white font-mono">CEO — Product Definition Review</h2>
            <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">Checkpoint Gate</Badge>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Inspect the product scope defined by the CEO Agent before advancing to Architecture design.
          </p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        {/* Product Goal & Vision */}
        <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-mono font-bold text-xs">
            <Target className="w-4 h-4" />
            Product Vision & Problem
          </div>
          <p className="text-white font-medium">{spec.productName}</p>
          <p className="text-xs text-gray-400 leading-relaxed">{spec.vision}</p>
          <div className="pt-2 border-t border-gray-800/80">
            <span className="text-[11px] font-mono text-gray-500 block">Problem Statement:</span>
            <p className="text-xs text-gray-300 italic">{spec.problemStatement}</p>
          </div>
        </div>

        {/* Target Audience */}
        <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-mono font-bold text-xs">
            <Users className="w-4 h-4" />
            Target Audience
          </div>
          <p className="text-xs text-gray-300">{spec.targetAudience}</p>
        </div>

        {/* MVP Features */}
        <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-4 space-y-2 md:col-span-2">
          <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs">
            <FileText className="w-4 h-4" />
            MVP Core Scope
          </div>
          <ul className="space-y-2 pt-1">
            {spec.mvpFeatures?.map((feat: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-200">
                <span className="text-emerald-400 font-mono font-bold">{i + 1}.</span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Out of Scope */}
        {spec.outOfScope && spec.outOfScope.length > 0 && (
          <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-4 space-y-2 md:col-span-2">
            <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
              Explicitly Out of Scope (Deferred)
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {spec.outOfScope.map((item: string, i: number) => (
                <span key={i} className="bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs px-2.5 py-1 rounded">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Revision Input Form */}
      {showRevisionForm && (
        <div className="bg-gray-950 border border-amber-800/50 rounded-lg p-4 space-y-3">
          <label className="block text-xs font-mono font-bold text-amber-400">
            Request Revision — Provide Feedback to CEO Agent:
          </label>
          <textarea
            value={revisionFeedback}
            onChange={(e) => setRevisionFeedback(e.target.value)}
            placeholder="Explain what needs to change in the Product Specification..."
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
              Submit Revision Request
            </Button>
          </div>
        </div>
      )}

      {/* Action Footer */}
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
          Approve Product Definition →
        </Button>
      </div>
    </div>
  );
}
