'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowRight,
  Brain,
  Layers,
  Sparkles,
  Terminal,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  Loader2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

type WizardStep = 'define' | 'review' | 'prepare' | 'launching';

interface ProposalData {
  productName?: string;
  vision?: string;
  problemStatement?: string;
  targetAudience?: string;
  platform?: string;
  complexity?: string;
  mvpFeatures?: string[];
  overallScore?: number;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS: { id: WizardStep; label: string; code: string }[] = [
  { id: 'define', label: 'Define', code: '01' },
  { id: 'review', label: 'Review', code: '02' },
  { id: 'prepare', label: 'Prepare', code: '03' },
  { id: 'launching', label: 'Launch', code: '04' },
];

function StepIndicator({ current }: { current: WizardStep }) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center gap-1.5 font-mono text-xs text-on-surface-variant">
      {STEPS.map((step, i) => (
        <React.Fragment key={step.id}>
          <span
            className={cn(
              i === currentIdx && 'text-primary font-bold border-b border-primary pb-0.5',
              i < currentIdx && 'text-on-surface-variant/50 line-through',
            )}
          >
            {step.code} / {step.label}
          </span>
          {i < STEPS.length - 1 && (
            <ChevronRight className="w-3 h-3 opacity-30" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export function NewProjectWizard() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>('define');
  const [ideaText, setIdeaText] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [revisionComment, setRevisionComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [launchProgress, setLaunchProgress] = useState(0);

  // ── Step 1 → create project & fetch proposal ────────────────────────────────

  const handleDefineSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaText.trim()) {
      toast.error('Please describe your software idea.');
      return;
    }

    const generatedName = ideaText.trim().split(/\s+/).slice(0, 3).join(' ') || 'AI Project';
    const name = projectName.trim() || generatedName;

    setLoading(true);
    setError(null);

    try {
      // 1. Create project
      const createRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: ideaText.trim() }),
      });
      const createData = await createRes.json();
      if (!createRes.ok || !createData.success) {
        throw new Error(createData.error?.message || 'Failed to create project.');
      }

      const id = createData.data.id as string;
      setProjectId(id);
      setProjectName(name);

      // 2. Fetch proposal (may or may not exist yet — try once, show skeleton if not ready)
      try {
        const proposalRes = await fetch(`/api/projects/${id}/proposal`, {
          headers: { 'Content-Type': 'application/json' },
        });
        const proposalData = await proposalRes.json();
        if (proposalRes.ok && proposalData.success && proposalData.data?.proposal) {
          setProposal(proposalData.data.proposal as ProposalData);
        }
        // If no proposal yet, proposal stays null — review step shows a placeholder
      } catch {
        // Proposal endpoint may not respond yet; proceed anyway
      }

      setStep('review');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Project creation failed.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [ideaText, projectName]);

  // ── Step 2 → approve proposal ─────────────────────────────────────────────

  const handleApproveProposal = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/proposal/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        // If proposal doesn't exist yet, just continue
        if (res.status === 404) {
          setStep('prepare');
          return;
        }
        throw new Error(data.error?.message || 'Approval failed.');
      }
      toast.success('Proposal approved.');
      setStep('prepare');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Approval failed.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // ── Step 2 → request revision ─────────────────────────────────────────────

  const handleRequestRevision = useCallback(async () => {
    if (!projectId || !revisionComment.trim()) {
      toast.error('Please enter your revision feedback.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/proposal/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: revisionComment.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 404) {
          // No proposal engine — just proceed
          setRevisionComment('');
          setStep('prepare');
          return;
        }
        throw new Error(data.error?.message || 'Revision request failed.');
      }
      // Refresh proposal
      const updated = await fetch(`/api/projects/${projectId}/proposal`);
      const updatedData = await updated.json();
      if (updatedData.success && updatedData.data?.proposal) {
        setProposal(updatedData.data.proposal as ProposalData);
      }
      setRevisionComment('');
      toast.success('Revision requested. Proposal updated.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Revision failed.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [projectId, revisionComment]);

  // ── Step 3 → confirm & launch ─────────────────────────────────────────────

  const handleLaunchProject = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    setStep('launching');
    setLaunchProgress(0);

    // Animate progress bar
    const interval = window.setInterval(() => {
      setLaunchProgress((prev) => {
        if (prev >= 85) {
          window.clearInterval(interval);
          return 85;
        }
        return prev + Math.random() * 12;
      });
    }, 400);

    try {
      const res = await fetch(`/api/projects/${projectId}/lifecycle/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIdea: ideaText || projectName }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || `Could not start pipeline (${res.status})`);
      }

      window.clearInterval(interval);
      setLaunchProgress(100);
      toast.success('AI company deployed!', { description: 'Redirecting to Mission Control…' });

      setTimeout(() => {
        router.push(`${ROUTES.projects}/${projectId}/workspace`);
        router.refresh();
      }, 800);
    } catch (err) {
      window.clearInterval(interval);
      const msg = err instanceof Error ? err.message : 'Could not start pipeline.';
      setError(msg);
      toast.error('Launch failed', { description: msg });
      setStep('prepare');
    } finally {
      setLoading(false);
    }
  }, [projectId, ideaText, projectName, router]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans selection:bg-primary selection:text-black">
      {/* Top Navigation */}
      <header className="bg-background border-b border-outline-variant/60 flex justify-between items-center w-full px-6 py-3.5 h-14 sticky top-0 z-50">
        <span className="font-mono text-xs font-bold text-primary border border-primary/30 px-2.5 py-1 rounded-sm">
          HibirDev AI
        </span>
        <StepIndicator current={step} />
        <div className="w-24" /> {/* balance */}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-10">

        {/* ── STEP: DEFINE ── */}
        {step === 'define' && (
          <div className="bg-surface-container-low border border-outline-variant/60 w-full max-w-3xl flex flex-col rounded-sm overflow-hidden">
            <div className="p-6 md:p-8 border-b border-outline-variant/60 flex items-center justify-between">
              <div>
                <h1 className="font-sans text-2xl font-bold text-on-surface mb-1">Define Your Idea</h1>
                <p className="font-sans text-xs text-on-surface-variant max-w-lg">
                  Describe the product you want to build. Be as detailed as you like — the AI CEO will structure it.
                </p>
              </div>
              <span className="font-mono text-[10px] text-on-surface-variant px-2.5 py-1 border border-outline-variant/60 rounded-sm hidden sm:block">
                STEP_01_DEFINE
              </span>
            </div>

            <form onSubmit={handleDefineSubmit} className="p-6 md:p-8 flex flex-col gap-5">
              {/* Optional project name */}
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="project-name">
                  Project Name <span className="text-on-surface-variant/50 normal-case tracking-normal">(optional)</span>
                </label>
                <input
                  id="project-name"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Auto-generated from your idea if blank"
                  className="w-full bg-background border border-outline-variant/60 focus:border-primary text-on-surface font-mono text-xs p-3 outline-none transition-colors rounded-sm"
                />
              </div>

              {/* Idea textarea */}
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="idea-text">
                  Software Idea <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                  <textarea
                    id="idea-text"
                    value={ideaText}
                    onChange={(e) => setIdeaText(e.target.value)}
                    placeholder="Describe your software idea in detail. E.g. Build an AI-powered study assistant with real-time markdown notes, automated flashcard generation, and spaced repetition..."
                    className="w-full bg-background border border-outline-variant/60 focus:border-primary text-on-surface font-mono text-xs p-4 pl-5 min-h-[200px] resize-none outline-none transition-colors rounded-sm"
                    spellCheck={false}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 border border-danger/30 bg-danger/10 p-3 rounded-sm text-xs text-danger font-mono">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t border-outline-variant/60">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <Lightbulb className="w-3.5 h-3.5 text-primary" />
                  <span className="font-mono text-[11px]">Include: who is it for? what problem does it solve?</span>
                </div>
                <button
                  type="submit"
                  disabled={loading || !ideaText.trim()}
                  className="bg-primary text-black font-mono text-xs font-bold px-6 py-2.5 rounded-sm hover:bg-primary-container transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                    <>Continue <ArrowRight className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── STEP: CEO REVIEW ── */}
        {step === 'review' && (
          <div className="bg-surface-container-low border border-outline-variant/60 w-full max-w-3xl flex flex-col rounded-sm overflow-hidden">
            <div className="p-6 md:p-8 border-b border-outline-variant/60 flex items-center justify-between">
              <div>
                <h1 className="font-sans text-2xl font-bold text-on-surface mb-1">CEO Review</h1>
                <p className="font-sans text-xs text-on-surface-variant">
                  Review the AI CEO's product analysis. Approve to continue or request revisions.
                </p>
              </div>
              <span className="font-mono text-[10px] text-primary px-2.5 py-1 border border-primary/30 rounded-sm font-bold hidden sm:block">
                02 / REVIEW
              </span>
            </div>

            <div className="p-6 md:p-8 flex flex-col gap-5">
              {proposal ? (
                <>
                  {proposal.productName && (
                    <div className="bg-background border border-outline-variant/60 p-4 rounded-sm">
                      <p className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">Product Name</p>
                      <p className="font-sans text-base font-bold text-on-surface">{proposal.productName}</p>
                    </div>
                  )}
                  {proposal.vision && (
                    <div className="bg-background border border-outline-variant/60 p-4 rounded-sm">
                      <p className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">Vision</p>
                      <p className="font-sans text-sm text-on-surface leading-relaxed">{proposal.vision}</p>
                    </div>
                  )}
                  {proposal.problemStatement && (
                    <div className="bg-background border border-outline-variant/60 p-4 rounded-sm">
                      <p className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">Problem Statement</p>
                      <p className="font-sans text-sm text-on-surface-variant leading-relaxed">{proposal.problemStatement}</p>
                    </div>
                  )}
                  {(proposal.mvpFeatures ?? []).length > 0 && (
                    <div className="bg-background border border-outline-variant/60 p-4 rounded-sm">
                      <p className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider mb-2">MVP Features</p>
                      <ul className="space-y-1.5">
                        {(proposal.mvpFeatures ?? []).map((f, i) => (
                          <li key={i} className="flex items-start gap-2 font-sans text-xs text-on-surface-variant">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {proposal.overallScore !== undefined && (
                    <div className="flex items-center gap-2 font-mono text-xs text-on-surface-variant">
                      <span>Proposal Score:</span>
                      <span className="text-primary font-bold">{Math.round(proposal.overallScore * 100)}%</span>
                    </div>
                  )}
                </>
              ) : (
                // No proposal available — show idea summary as fallback
                <div className="bg-background border border-outline-variant/60 p-4 rounded-sm">
                  <p className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider mb-2">Your Idea</p>
                  <p className="font-sans text-sm text-on-surface-variant leading-relaxed">{ideaText}</p>
                </div>
              )}

              {/* Revision input */}
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider" htmlFor="revision">
                  Request Revision <span className="text-on-surface-variant/50 normal-case">(optional)</span>
                </label>
                <textarea
                  id="revision"
                  value={revisionComment}
                  onChange={(e) => setRevisionComment(e.target.value)}
                  placeholder="Describe any changes you'd like the CEO to incorporate..."
                  className="w-full bg-background border border-outline-variant/60 focus:border-primary text-on-surface font-mono text-xs p-3 h-20 resize-none outline-none transition-colors rounded-sm"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 border border-danger/30 bg-danger/10 p-3 rounded-sm text-xs text-danger font-mono">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setStep('define')}
                  className="text-on-surface-variant hover:text-on-surface font-mono text-xs px-3 py-2 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" /> Edit idea
                </button>
                <div className="flex items-center gap-2">
                  {revisionComment.trim() && (
                    <button
                      type="button"
                      onClick={() => void handleRequestRevision()}
                      disabled={loading}
                      className="font-mono text-xs text-on-surface-variant border border-outline-variant/60 px-4 py-2.5 rounded-sm hover:border-primary hover:text-primary transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Request Revision
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleApproveProposal()}
                    disabled={loading}
                    className="bg-primary text-black font-mono text-xs font-bold px-6 py-2.5 rounded-sm hover:bg-primary-container transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                      <>Approve & Continue <ArrowRight className="w-3.5 h-3.5" /></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: PREPARE ── */}
        {step === 'prepare' && (
          <div className="bg-surface-container-low border border-outline-variant/60 w-full max-w-3xl flex flex-col rounded-sm overflow-hidden">
            <div className="p-6 md:p-8 border-b border-outline-variant/60 text-center">
              <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/5 px-3 py-1 rounded-sm mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="font-mono text-[10px] font-bold text-primary uppercase tracking-wider">
                  SYSTEM READY
                </span>
              </div>
              <h1 className="font-sans text-2xl font-bold text-on-surface mb-2">
                Your AI team is ready.
              </h1>
              <p className="font-sans text-xs text-on-surface-variant max-w-md mx-auto">
                Four specialized agents will build your software end-to-end. You'll review their work at each checkpoint.
              </p>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { node: 'NODE_01', icon: Brain, label: 'CEO', desc: 'Product Strategy & PRD' },
                { node: 'NODE_02', icon: Layers, label: 'ARCHITECT', desc: 'System Architecture' },
                { node: 'NODE_03', icon: Sparkles, label: 'DESIGNER', desc: 'UI/UX & Design Tokens' },
                { node: 'NODE_04', icon: Terminal, label: 'DEVELOPER', desc: 'Code & Implementation' },
              ].map(({ node, icon: Icon, label, desc }) => (
                <div key={node} className="bg-background border border-outline-variant/60 p-4 rounded-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
                    <span className="font-mono text-[10px] font-bold text-primary">{node}</span>
                    <Icon className="w-4 h-4 text-on-surface-variant" />
                  </div>
                  <h3 className="font-sans text-sm font-bold text-on-surface">{label}</h3>
                  <p className="font-mono text-[11px] text-on-surface-variant">{desc}</p>
                  <div className="mt-auto pt-2 border-t border-outline-variant/40 flex justify-between items-center font-mono text-[10px]">
                    <span className="text-on-surface-variant">STATUS</span>
                    <span className="text-primary font-bold">READY</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 md:p-8 pt-0 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep('review')}
                className="text-on-surface-variant hover:text-on-surface font-mono text-xs px-3 py-2"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => void handleLaunchProject()}
                disabled={loading}
                className="bg-primary text-black font-mono text-xs font-bold px-8 py-3 rounded-sm hover:bg-primary-container transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <span>Confirm & Launch Mission Control</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: LAUNCHING ── */}
        {step === 'launching' && (
          <div className="bg-surface-container-low border border-outline-variant/60 w-full max-w-xl flex flex-col rounded-sm overflow-hidden">
            <div className="p-8 md:p-12 flex flex-col items-center gap-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-sm border border-primary/30 bg-primary/5">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div>
                <h1 className="font-sans text-2xl font-bold text-on-surface mb-2">Deploying AI Workforce…</h1>
                <p className="font-sans text-xs text-on-surface-variant">Your agents are being initialized and connected.</p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-background border border-outline-variant/40 rounded-sm h-1.5 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(launchProgress, 100)}%` }}
                />
              </div>
              <span className="font-mono text-xs text-primary font-bold tabular-nums">
                {Math.round(Math.min(launchProgress, 100))}%
              </span>

              {error && (
                <div className="flex items-center gap-2 border border-danger/30 bg-danger/10 p-3 rounded-sm text-xs text-danger font-mono w-full text-left">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
