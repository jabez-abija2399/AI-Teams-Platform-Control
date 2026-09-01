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
    <div className="bg-[#1b1b1b] border border-[#3c4949] rounded-sm p-6 max-w-4xl mx-auto font-sans text-[#e2e2e2] space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#3c4949] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#56d9d9] font-mono uppercase tracking-wider">CEO — PRODUCT DEFINITION REVIEW</h2>
            <span className="bg-[#56d9d9]/10 text-[#56d9d9] border border-[#56d9d9]/30 text-[10px] font-mono px-2 py-0.5 rounded-sm uppercase tracking-widest font-bold">
              CHECKPOINT GATE
            </span>
          </div>
          <p className="text-xs text-[#bbc9c8] mt-1 font-sans">
            Inspect the product scope defined by the CEO Agent before advancing to Architecture design.
          </p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* Product Goal & Vision */}
        <div className="bg-[#131313] border border-[#3c4949] rounded-sm p-4 space-y-2">
          <div className="flex items-center gap-2 text-[#56d9d9] font-mono font-bold text-xs uppercase tracking-wider">
            <Target className="w-4 h-4" />
            Product Vision & Problem
          </div>
          <p className="text-[#e2e2e2] font-bold">{spec.productName}</p>
          <p className="text-xs text-[#bbc9c8] leading-relaxed">{spec.vision}</p>
          <div className="pt-2 border-t border-[#3c4949]">
            <span className="text-[11px] font-mono text-[#869393] block">Problem Statement:</span>
            <p className="text-xs text-[#e2e2e2] italic">{spec.problemStatement}</p>
          </div>
        </div>

        {/* Target Audience */}
        <div className="bg-[#131313] border border-[#3c4949] rounded-sm p-4 space-y-2">
          <div className="flex items-center gap-2 text-[#56d9d9] font-mono font-bold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4" />
            Target Audience
          </div>
          <p className="text-xs text-[#e2e2e2] font-mono">{spec.targetAudience}</p>
        </div>

        {/* MVP Features */}
        <div className="bg-[#131313] border border-[#3c4949] rounded-sm p-4 space-y-2 md:col-span-2">
          <div className="flex items-center gap-2 text-[#56d9d9] font-mono font-bold text-xs uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            MVP Core Scope
          </div>
          <ul className="space-y-2 pt-1 font-mono text-xs">
            {spec.mvpFeatures?.map((feat: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-[#e2e2e2]">
                <span className="text-[#56d9d9] font-bold">{i + 1}.</span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Out of Scope */}
        {spec.outOfScope && spec.outOfScope.length > 0 && (
          <div className="bg-[#131313] border border-[#3c4949] rounded-sm p-4 space-y-2 md:col-span-2">
            <div className="flex items-center gap-2 text-[#e1824e] font-mono font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              Explicitly Out of Scope (Deferred)
            </div>
            <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs">
              {spec.outOfScope.map((item: string, i: number) => (
                <span key={i} className="bg-[#e1824e]/10 border border-[#e1824e]/40 text-[#e1824e] text-xs px-2.5 py-1 rounded-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Revision Input Form */}
      {showRevisionForm && (
        <div className="bg-[#0e0e0e] border border-[#e1824e]/50 rounded-sm p-4 space-y-3">
          <label className="block text-xs font-mono font-bold text-[#e1824e]">
            Request Revision — Provide Feedback to CEO Agent:
          </label>
          <textarea
            value={revisionFeedback}
            onChange={(e) => setRevisionFeedback(e.target.value)}
            placeholder="Explain what needs to change in the Product Specification..."
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
              Submit Revision Request
            </Button>
          </div>
        </div>
      )}

      {/* Action Footer */}
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
          Approve Product Definition →
        </Button>
      </div>
    </div>
  );
}
