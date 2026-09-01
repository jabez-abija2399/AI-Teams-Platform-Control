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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-4xl mx-auto font-sans text-gray-200 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white font-mono">Architect — System Architecture Review</h2>
            <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">Checkpoint Gate</Badge>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Review technology stack choices, API designs, and implementation steps before advancing to Designer phase.
          </p>
        </div>
      </div>

      {/* Tech Stack Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
        <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-3 space-y-1">
          <span className="text-indigo-400 font-bold flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5" /> Frontend
          </span>
          <p className="text-white text-xs leading-snug">{spec.techStack.frontend}</p>
        </div>

        <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-3 space-y-1">
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <Server className="w-3.5 h-3.5" /> Backend
          </span>
          <p className="text-white text-xs leading-snug">{spec.techStack.backend}</p>
        </div>

        <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-3 space-y-1">
          <span className="text-blue-400 font-bold flex items-center gap-1">
            <Database className="w-3.5 h-3.5" /> Database
          </span>
          <p className="text-white text-xs leading-snug">{spec.techStack.database}</p>
        </div>

        <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-3 space-y-1">
          <span className="text-purple-400 font-bold flex items-center gap-1">
            <Workflow className="w-3.5 h-3.5" /> Auth & Security
          </span>
          <p className="text-white text-xs leading-snug">{spec.techStack.authentication}</p>
        </div>
      </div>

      {/* API Design & Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        {/* API Design */}
        <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-4 space-y-2">
          <h3 className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-wider">Designed API Endpoints</h3>
          <div className="space-y-1.5 font-mono text-xs">
            {spec.apiEndpoints?.map((ep: string, idx: number) => (
              <div key={idx} className="bg-gray-900 border border-gray-800 px-3 py-1.5 rounded text-gray-300">
                {ep}
              </div>
            ))}
          </div>
        </div>

        {/* Implementation Steps */}
        <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-4 space-y-2">
          <h3 className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider">Implementation Plan Steps</h3>
          <ol className="space-y-2 font-mono text-xs pt-1">
            {spec.implementationSteps?.map((step: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-gray-300">
                <span className="text-emerald-400 font-bold">{idx + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Revision Form */}
      {showRevisionForm && (
        <div className="bg-gray-950 border border-amber-800/50 rounded-lg p-4 space-y-3">
          <label className="block text-xs font-mono font-bold text-amber-400">
            Request Revision — Feedback for Architect Agent:
          </label>
          <textarea
            value={revisionFeedback}
            onChange={(e) => setRevisionFeedback(e.target.value)}
            placeholder="Explain required architecture changes or technical constraints..."
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
              Submit Architecture Feedback
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
          Approve Architecture →
        </Button>
      </div>
    </div>
  );
}
