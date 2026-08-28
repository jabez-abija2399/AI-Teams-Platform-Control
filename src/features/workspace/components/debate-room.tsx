'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ThumbsUp,
  Award,
  Vote,
} from 'lucide-react';
import { GlassCard, NeonButton, StatusBadge, AgentAvatar } from '@/packages/ui';
import { fadeUpVariant, staggerContainer } from '@/packages/motion';

interface DebateTopic {
  id: string;
  category: string;
  question: string;
  architectStance: {
    agent: 'ARCHITECT';
    proposal: string;
    reason: string;
  };
  developerStance: {
    agent: 'DEVELOPER';
    proposal: string;
    reason: string;
  };
  consensusScore: number;
  resolved: boolean;
  winner?: 'ARCHITECT' | 'DEVELOPER';
}

const INITIAL_TOPICS: DebateTopic[] = [
  {
    id: '1',
    category: 'Persistence & Schema',
    question: 'Database Migration Strategy: Relational PostgreSQL vs Serverless Neon',
    architectStance: {
      agent: 'ARCHITECT',
      proposal: 'Strict Prisma Schema with ACID Transactions',
      reason: 'Guarantees relational integrity, migrations history, and prevents orphan tasks in enterprise pipelines.',
    },
    developerStance: {
      agent: 'DEVELOPER',
      proposal: 'Edge Connection Pooling with Prepared Statements',
      reason: 'Faster cold start on Serverless functions with minimal ORM serialization overhead.',
    },
    consensusScore: 92,
    resolved: true,
    winner: 'ARCHITECT',
  },
  {
    id: '2',
    category: 'State & React Lifecycle',
    question: 'Client State Architecture: Zustand Store vs Server Actions Only',
    architectStance: {
      agent: 'ARCHITECT',
      proposal: 'Zustand Reactive Store for SSE Stream Sync',
      reason: 'Enables sub-second updates to Monaco Editor cursor and live chat without full-page revalidation.',
    },
    developerStance: {
      agent: 'DEVELOPER',
      proposal: 'React 19 Server Actions with Optimistic Hooks',
      reason: 'Zero bundle size increase on initial client load.',
    },
    consensusScore: 84,
    resolved: false,
  },
];

export function DebateRoom() {
  const [topics, setTopics] = useState<DebateTopic[]>(INITIAL_TOPICS);

  const handleVote = (topicId: string, choice: 'ARCHITECT' | 'DEVELOPER') => {
    setTopics((prev) =>
      prev.map((t) =>
        t.id === topicId ? { ...t, resolved: true, winner: choice, consensusScore: 100 } : t,
      ),
    );
  };

  const MotionDiv = motion.div as any;

  return (
    <GlassCard className="w-full h-full flex flex-col p-6 border-white/10 shadow-2xl bg-surface-glass/90 overflow-y-auto scrollbar-hide">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Scale className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              Architecture & Code Debate Arena
            </h2>
          </div>
          <p className="text-xs text-white/50">
            Specialists debate design tradeoffs and reach consensus before code generation.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-mono font-bold text-primary">Consensus Engine Active</span>
        </div>
      </div>

      {/* Topics Stream */}
      <MotionDiv
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-6 flex-1"
      >
        {topics.map((topic) => (
          <MotionDiv key={topic.id} variants={fadeUpVariant}>
            <GlassCard className="p-6 border-white/10 bg-white/[0.02] shadow-xl space-y-6">
              {/* Category & Topic Header */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20">
                  {topic.category}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-white/40">Consensus:</span>
                  <span
                    className={`text-xs font-mono font-bold ${
                      topic.consensusScore >= 90
                        ? 'text-success'
                        : topic.consensusScore >= 75
                        ? 'text-warning'
                        : 'text-danger'
                    }`}
                  >
                    {topic.consensusScore}%
                  </span>
                  {topic.resolved && (
                    <span className="rounded-full bg-success/20 text-success border border-success/30 px-2 py-0.5 text-[9px] font-mono font-bold uppercase">
                      Resolved
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-base font-bold text-white tracking-tight">{topic.question}</h3>

              {/* Stance Split Arena */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Architect Card */}
                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    topic.winner === 'ARCHITECT'
                      ? 'border-primary/80 bg-primary/15 shadow-[0_0_20px_rgba(99,102,241,0.25)] ring-1 ring-primary/60'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <AgentAvatar role="ARCHITECT" size="sm" />
                      <div>
                        <p className="text-xs font-bold text-white">Marcus</p>
                        <p className="text-[9px] text-white/40 uppercase font-mono">System Architect</p>
                      </div>
                    </div>
                    {topic.winner === 'ARCHITECT' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase font-mono">
                        <Award className="w-3.5 h-3.5" />
                        Approved
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-white/90 mb-1">
                    {topic.architectStance.proposal}
                  </p>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {topic.architectStance.reason}
                  </p>
                  {!topic.resolved && (
                    <button
                      type="button"
                      onClick={() => handleVote(topic.id, 'ARCHITECT')}
                      className="mt-4 w-full py-2 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Vote className="w-3.5 h-3.5" />
                      Vote with Architect
                    </button>
                  )}
                </div>

                {/* Developer Card */}
                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    topic.winner === 'DEVELOPER'
                      ? 'border-secondary/80 bg-secondary/15 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-secondary/60'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <AgentAvatar role="DEVELOPER" size="sm" />
                      <div>
                        <p className="text-xs font-bold text-white">Alex</p>
                        <p className="text-[9px] text-white/40 uppercase font-mono">Lead Developer</p>
                      </div>
                    </div>
                    {topic.winner === 'DEVELOPER' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-secondary uppercase font-mono">
                        <Award className="w-3.5 h-3.5" />
                        Approved
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-white/90 mb-1">
                    {topic.developerStance.proposal}
                  </p>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {topic.developerStance.reason}
                  </p>
                  {!topic.resolved && (
                    <button
                      type="button"
                      onClick={() => handleVote(topic.id, 'DEVELOPER')}
                      className="mt-4 w-full py-2 rounded-xl border border-secondary/30 bg-secondary/10 text-secondary hover:bg-secondary/20 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Vote className="w-3.5 h-3.5" />
                      Vote with Developer
                    </button>
                  )}
                </div>
              </div>
            </GlassCard>
          </MotionDiv>
        ))}
      </MotionDiv>
    </GlassCard>
  );
}
