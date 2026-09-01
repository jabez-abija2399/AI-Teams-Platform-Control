'use client';

import React, { useState } from 'react';
import { Check, RotateCcw, Cpu, Database, Server, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ArchitectReviewCheckpointProps {
  architectureSpec: any;
  onApprove: () => void;
  onRequestRevision: (feedback: string) => void;
}

export function ArchitectReviewCheckpoint({
  architectureSpec,
  onApprove,
  onRequestRevision,
}: ArchitectReviewCheckpointProps) {
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  const spec = architectureSpec || {
    techStack: {
      frontend: 'Next.js 14 App Router, TypeScript, Tailwind CSS',
      backend: 'Next.js Server Actions & Route Handlers',
      database: 'PostgreSQL with Prisma ORM',
      authentication: 'NextAuth.js JWT strategy',
    },
    systemOverview: 'Modular monolith Next.js application structured around features.',
    apiEndpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/bookings',
      'POST /api/bookings',
      'PUT /api/bookings/[id]',
    ],
    implementationSteps: [
      'Initialize database schema with Prisma models',
      'Implement auth API handlers and session middleware',
      'Build core booking domain services and endpoints',
    ],
  };

  return (
    <div className="bg-[#1b1b1b] border border-[#3c4949] rounded-sm p-6 max-w-4xl mx-auto font-sans text-[#e2e2e2] space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#3c4949] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#56d9d9] font-mono uppercase tracking-wider">ARCHITECT — SYSTEM ARCHITECTURE REVIEW</h2>
            <span className="bg-[#56d9d9]/10 text-[#56d9d9] border border-[#56d9d9]/30 text-[10px] font-mono px-2 py-0.5 rounded-sm uppercase tracking-widest font-bold">
              CHECKPOINT GATE
            </span>
          </div>
          <p className="text-xs text-[#bbc9c8] mt-1 font-sans">
            Review technology stack choices, API designs, and implementation steps before advancing to Designer phase.
          </p>
        </div>
      </div>

      {/* Tech Stack Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className="bg-[#131313] border border-[#3c4949] rounded-sm p-3 space-y-1">
          <span className="text-[#56d9d9] font-bold flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5" /> Frontend
          </span>
          <p className="text-[#e2e2e2] text-xs leading-snug">{spec.techStack.frontend}</p>
        </div>

        <div className="bg-[#131313] border border-[#3c4949] rounded-sm p-3 space-y-1">
          <span className="text-[#56d9d9] font-bold flex items-center gap-1">
            <Server className="w-3.5 h-3.5" /> Backend
          </span>
          <p className="text-[#e2e2e2] text-xs leading-snug">{spec.techStack.backend}</p>
        </div>

        <div className="bg-[#131313] border border-[#3c4949] rounded-sm p-3 space-y-1">
          <span className="text-[#56d9d9] font-bold flex items-center gap-1">
            <Database className="w-3.5 h-3.5" /> Database
          </span>
          <p className="text-[#e2e2e2] text-xs leading-snug">{spec.techStack.database}</p>
        </div>

        <div className="bg-[#131313] border border-[#3c4949] rounded-sm p-3 space-y-1">
          <span className="text-[#e1824e] font-bold flex items-center gap-1">
            <Workflow className="w-3.5 h-3.5" /> Security
          </span>
          <p className="text-[#e2e2e2] text-xs leading-snug">{spec.techStack.authentication}</p>
        </div>
      </div>

      {/* API Design & Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* API Design */}
        <div className="bg-[#131313] border border-[#3c4949] rounded-sm p-4 space-y-2">
          <h3 className="font-mono text-xs font-bold text-[#56d9d9] uppercase tracking-wider">Designed API Endpoints</h3>
          <div className="space-y-1.5 font-mono text-xs">
            {spec.apiEndpoints?.map((ep: string, idx: number) => (
              <div key={idx} className="bg-[#1b1b1b] border border-[#3c4949] px-3 py-1.5 rounded-sm text-[#e2e2e2]">
                {ep}
              </div>
            ))}
          </div>
        </div>

        {/* Implementation Steps */}
        <div className="bg-[#131313] border border-[#3c4949] rounded-sm p-4 space-y-2">
          <h3 className="font-mono text-xs font-bold text-[#56d9d9] uppercase tracking-wider">Implementation Plan Steps</h3>
          <ol className="space-y-2 font-mono text-xs pt-1">
            {spec.implementationSteps?.map((step: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-[#e2e2e2]">
                <span className="text-[#56d9d9] font-bold">{idx + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Revision Form */}
      {showRevisionForm && (
        <div className="bg-[#0e0e0e] border border-[#e1824e]/50 rounded-sm p-4 space-y-3">
          <label className="block text-xs font-mono font-bold text-[#e1824e]">
            Request Revision — Feedback for Architect Agent:
          </label>
          <textarea
            value={revisionFeedback}
            onChange={(e) => setRevisionFeedback(e.target.value)}
            placeholder="Explain required architecture changes or technical constraints..."
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
              Submit Architecture Feedback
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
          Approve Architecture →
        </Button>
      </div>
    </div>
  );
}
