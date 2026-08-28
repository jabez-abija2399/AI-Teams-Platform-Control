'use client';

// Import core React hooks for state, memoization, and side-effects.
import { useEffect, useMemo, useState } from 'react';
// Import Next.js navigation primitives for routing and link jumps.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// Import Sonner for high-contrast toast notifications.
import { toast } from 'sonner';
// Import Lucide icons for rich iconography throughout the creation wizard.
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Loader2,
  Sparkles,
  Layers,
  Lightbulb,
  Bot,
  Wand2,
} from 'lucide-react';
// Import Framer Motion for entrance and layout animations.
import { motion, AnimatePresence } from 'framer-motion';
// Import our centralized Atomic UI components from packages/ui.
import { GlassCard, NeonButton, StatusBadge } from '@/packages/ui';
// Import motion physics variants from packages/motion.
import { fadeUpVariant, staggerContainer } from '@/packages/motion';
// Import classnames utility and application routing constants.
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/constants';
// Import the upgraded Cyber Void stack selector component.
import { StackSelect } from './stack-select';
import {
  DEFAULT_PROJECT_STACK,
  type ProjectStackId,
} from '@/core/project-stack/stack-catalog';
// Import credentials form for setting up AI provider API keys.
import { AiCredentialsForm } from '@/features/settings/components/ai-credentials-form';

// Curated inspiration prompts for rapid project prototyping.
const EXAMPLES = [
  {
    title: 'Enterprise Kanban Platform',
    idea: 'A collaborative real-time agile Kanban board with sprint planning, drag-and-drop tasks, subtasks, and progress analytics.',
    stack: 'nextjs' as const,
  },
  {
    title: 'Modern SaaS Billing Portal',
    idea: 'A full-featured SaaS subscription management portal with customer metrics, revenue charts, plan upgrade flows, and webhook integrations.',
    stack: 'nextjs' as const,
  },
  {
    title: 'Realtime Chat & Team Hub',
    idea: 'A modern messaging app with direct channels, thread replies, user presence, typing indicators, and markdown formatting.',
    stack: 'nextjs' as const,
  },
  {
    title: 'Sleek Product Landing Page',
    idea: 'A high-converting product marketing landing page with interactive pricing tiers, feature showcase, and responsive dark mode.',
    stack: 'static-html' as const,
  },
] as const;

// Helper to derive a clean project name from the initial idea description.
function deriveName(idea: string): string {
  const cleaned = idea.trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'My Software Project';
  const firstSentence = cleaned.split(/[.!?\n]/)[0] || cleaned;
  return firstSentence.slice(0, 48).trim() || 'My Software Project';
}

/**
 * Ultra-Modern Project Creation Wizard.
 * Guides the user through connecting AI keys, defining software specs, selecting tech stacks,
 * and initializing their autonomous AI software engineering organization.
 */
export function ProjectCreationForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [idea, setIdea] = useState('');
  const [stack, setStack] = useState<ProjectStackId | null>(DEFAULT_PROJECT_STACK);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingKey, setCheckingKey] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Form submission criteria validation
  const canSubmit = idea.trim().length >= 8 && stack !== null && stack !== 'unknown' && hasApiKey;
  // Memoized preview title
  const previewName = useMemo(() => (name.trim() ? name.trim() : deriveName(idea)), [name, idea]);

  // Check if the user has an active AI API key configured
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/settings/ai-credentials', { cache: 'no-store' });
        const json = await res.json();
        if (!cancelled) {
          setHasApiKey(Boolean(json?.data?.status?.configured));
        }
      } catch {
        if (!cancelled) setHasApiKey(false);
      } finally {
        if (!cancelled) setCheckingKey(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Form submission handler to register the project in the database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading || !stack) return;

    setError(null);
    setLoading(true);

    try {
      const projectName = name.trim() || deriveName(idea);
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          description: idea.trim(),
          stack,
        }),
      });

      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.success) {
        if (result?.error?.code === 'API_KEY_REQUIRED') {
          setHasApiKey(false);
        }
        throw new Error(result?.error?.message || 'Could not create project');
      }

      const projectId = result.data?.id;
      if (!projectId) throw new Error('No project ID returned from server');

      toast.success('Project Created', {
        description: `"${projectName}" initialized. Entering workspace…`,
      });
      router.push(`/dashboard/projects/${projectId}/workspace`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
      toast.error('Could not create project', { description: message });
      setLoading(false);
    }
  };

  const MotionDiv = motion.div as any;

  return (
    <MotionDiv
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-4xl space-y-8 py-4"
    >
      {/* Back to projects navigation button */}
      <MotionDiv variants={fadeUpVariant}>
        <Link
          href={ROUTES.projects}
          className="group inline-flex items-center gap-2 text-xs font-semibold text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to projects
        </Link>
      </MotionDiv>

      {/* Cyber Void Hero Header Banner */}
      <MotionDiv variants={fadeUpVariant}>
        <GlassCard className="relative overflow-hidden p-8 border-primary/20 bg-gradient-to-br from-surface-glass/80 via-primary/5 to-secondary/5">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Sparkles className="h-3.5 w-3.5" />
              Autonomous Engineering Organization
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {hasApiKey ? 'What would you like to build?' : 'Connect Your AI Workforce'}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/60 max-w-2xl">
              {hasApiKey
                ? 'Your dedicated team of 5 AI specialists (Product Manager, Architect, Designer, Developer, QA) will collaborate in real time to build production-ready software.'
                : 'Connect an AI provider to empower your autonomous team. Free tiers (Google Gemini, Groq) work out of the box.'}
            </p>
          </div>
        </GlassCard>
      </MotionDiv>

      {/* Loading state for credentials verification */}
      {checkingKey ? (
        <MotionDiv variants={fadeUpVariant}>
          <GlassCard className="flex items-center justify-center gap-3 py-20 text-sm text-white/50">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Verifying AI workforce credentials…</span>
          </GlassCard>
        </MotionDiv>
      ) : !hasApiKey ? (
        /* Unconfigured API Key State */
        <MotionDiv variants={fadeUpVariant} className="space-y-6">
          <GlassCard className="border-warning/30 bg-warning/5 p-6">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning border border-warning/30">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Step 1 — Connect AI Provider</p>
                <p className="mt-1 text-xs leading-relaxed text-white/60">
                  Pick your provider (Google Gemini, Groq, OpenRouter, OpenAI, Anthropic) and enter your key. Keys are encrypted with AES-256-GCM at rest.
                </p>
              </div>
            </div>
          </GlassCard>
          <AiCredentialsForm
            embedded
            onConfigured={() => {
              setHasApiKey(true);
              toast.success('AI Provider Connected', {
                description: 'You can now create your project.',
              });
            }}
          />
        </MotionDiv>
      ) : (
        /* Main Project Creation Form */
        <MotionDiv variants={fadeUpVariant}>
          <form onSubmit={handleSubmit} className="space-y-8">
            <GlassCard className="p-8 space-y-7 border-white/10 shadow-2xl">
              {/* Error banner if submission fails */}
              {error && (
                <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs font-medium text-danger">
                  {error}
                </div>
              )}

              {/* Prompt / Vision Field */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="project-idea" className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
                    <Wand2 className="w-3.5 h-3.5 text-primary" />
                    Software Vision & Requirements <span className="text-danger">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-white/40">
                    {idea.length}/1000
                  </span>
                </div>
                <textarea
                  id="project-idea"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Describe your software idea in detail. E.g. A real-time collaborative Kanban board with sprint analytics, drag-and-drop tasks, and automated export…"
                  rows={4}
                  autoFocus
                  required
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-white outline-none transition-all placeholder:text-white/30 focus:border-primary/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-primary/20 font-sans backdrop-blur-md"
                />
              </div>

              {/* Quick Inspiration Templates */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/60">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                  <span>Or select an inspiration template:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {EXAMPLES.map((ex) => {
                    const isSelected = name === ex.title;
                    return (
                      <button
                        key={ex.title}
                        type="button"
                        onClick={() => {
                          setIdea(ex.idea);
                          setStack(ex.stack);
                          setName(ex.title);
                        }}
                        className={cn(
                          'flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 backdrop-blur-md',
                          isSelected
                            ? 'border-primary/80 bg-primary/15 shadow-[0_0_20px_rgba(99,102,241,0.2)] ring-1 ring-primary/60'
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 active:scale-[0.99]'
                        )}
                      >
                        <span className="text-xs font-bold text-white">{ex.title}</span>
                        <span className="mt-1 text-[11px] text-white/50 line-clamp-1">{ex.idea}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Project Name (Optional) */}
              <div className="space-y-2.5">
                <label htmlFor="project-name" className="text-xs font-bold uppercase tracking-wider text-white/70">
                  Project Name <span className="text-xs font-normal text-white/40">(optional — auto-derived from vision)</span>
                </label>
                <input
                  id="project-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={previewName}
                  className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 backdrop-blur-md"
                />
              </div>

              {/* Delivery Tech Stack Selection */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                    Architecture & Target Stack
                  </p>
                </div>
                <StackSelect value={stack} onChange={setStack} />
              </div>

              {/* Live Team Assignment Summary Card */}
              {idea.trim().length >= 8 && (
                <AnimatePresence>
                  <MotionDiv
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-xs shadow-inner"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/40">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white">{previewName}</p>
                      <p className="mt-0.5 text-white/60">
                        5 Specialists Assigned · Delivery Engine: <span className="font-bold text-primary uppercase">{stack}</span>
                      </p>
                    </div>
                    <StatusBadge status="HEALTHY" />
                  </MotionDiv>
                </AnimatePresence>
              )}

              {/* Primary Action Button */}
              <div className="pt-4">
                <NeonButton
                  type="submit"
                  variant="primary"
                  isLoading={loading}
                  disabled={!canSubmit || loading}
                  className="w-full h-13 text-sm font-bold shadow-xl flex items-center justify-center gap-2"
                >
                  {loading ? (
                    'Initializing AI Company & Generating Specs…'
                  ) : (
                    <>
                      <span>Launch Project & Assemble AI Team</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </NeonButton>
              </div>
            </GlassCard>
          </form>
        </MotionDiv>
      )}
    </MotionDiv>
  );
}
