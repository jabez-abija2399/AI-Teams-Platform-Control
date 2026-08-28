'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Loader2,
  Sparkles,
  Layers,
  CheckCircle2,
  Lightbulb,
  Bot,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/constants';
import { StackSelect } from './stack-select';
import {
  DEFAULT_PROJECT_STACK,
  type ProjectStackId,
} from '@/core/project-stack/stack-catalog';
import { AiCredentialsForm } from '@/features/settings/components/ai-credentials-form';

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

function deriveName(idea: string): string {
  const cleaned = idea.trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'My Software Project';
  const firstSentence = cleaned.split(/[.!?\n]/)[0] || cleaned;
  return firstSentence.slice(0, 48).trim() || 'My Software Project';
}

export function ProjectCreationForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [idea, setIdea] = useState('');
  const [stack, setStack] = useState<ProjectStackId | null>(DEFAULT_PROJECT_STACK);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingKey, setCheckingKey] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);

  const canSubmit = idea.trim().length >= 8 && stack !== null && stack !== 'unknown' && hasApiKey;
  const previewName = useMemo(() => (name.trim() ? name.trim() : deriveName(idea)), [name, idea]);

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

  return (
    <div className="mx-auto w-full max-w-3xl animate-fade-up space-y-6">
      <Link
        href={ROUTES.projects}
        className="group inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back to projects
      </Link>

      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card/90 to-background p-6 shadow-sm sm:p-8">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative z-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AI Engineering Company
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {hasApiKey ? 'What would you like to build?' : 'Set up your AI API key'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-xl">
            {hasApiKey
              ? 'Your dedicated team of 5 AI specialists (Product Manager, Architect, Designer, Developer, QA) will collaborate to build validated, production-ready software.'
              : 'Connect an AI provider to empower your autonomous team. Free tiers (Google Gemini, Groq) work out of the box.'}
          </p>
        </div>
      </div>

      {checkingKey ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-border/80 bg-card py-20 text-sm text-muted-foreground shadow-xs">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Configuring AI workforce…</span>
        </div>
      ) : !hasApiKey ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-accent/25 bg-accent/[0.06] p-5 shadow-xs">
            <div className="flex gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Step 1 — Connect AI Provider</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Pick your provider (Google Gemini, Groq, OpenRouter, OpenAI, Anthropic) and enter your key. Keys are encrypted with AES-256-GCM at rest.
                </p>
              </div>
            </div>
          </div>
          <AiCredentialsForm
            embedded
            onConfigured={() => {
              setHasApiKey(true);
              toast.success('AI Provider Connected', {
                description: 'You can now create your project.',
              });
            }}
          />
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-border/80 glass-card p-6 shadow-xl sm:p-8"
        >
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive">
              {error}
            </div>
          )}

          {/* Prompt / Idea Field */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="project-idea" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Software Vision & Requirements <span className="text-destructive">*</span>
              </label>
              <span className="text-[11px] font-mono text-muted-foreground">
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
              className="w-full resize-none rounded-2xl border border-input bg-background/60 px-4 py-3.5 text-sm leading-relaxed outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:ring-3 focus:ring-primary/20 font-sans"
            />
          </div>

          {/* Quick Examples */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              <span>Or click an inspiration template:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.title}
                  type="button"
                  onClick={() => {
                    setIdea(ex.idea);
                    setStack(ex.stack);
                    setName(ex.title);
                  }}
                  className={cn(
                    'flex flex-col items-start p-3 rounded-xl border border-border/80 bg-background/50 text-left transition-all',
                    'hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]',
                    name === ex.title && 'border-primary bg-primary/10 ring-1 ring-primary',
                  )}
                >
                  <span className="text-xs font-bold text-foreground">{ex.title}</span>
                  <span className="mt-1 text-[11px] text-muted-foreground line-clamp-1">{ex.idea}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Project Name (Optional) */}
          <div className="space-y-2">
            <label htmlFor="project-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Project Name <span className="text-xs font-normal lowercase text-muted-foreground">(optional — auto-generated from idea)</span>
            </label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={previewName}
              className="h-11 rounded-xl bg-background/60 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Delivery Stack Selection */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-primary" />
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Architecture & Technology Stack
                </p>
              </div>
            </div>
            <StackSelect value={stack} onChange={setStack} />
          </div>

          {/* Live Summary Card */}
          {idea.trim().length >= 8 && (
            <div className="flex items-center gap-3.5 rounded-2xl border border-primary/30 bg-primary/[0.06] p-4 text-xs">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground">{previewName}</p>
                <p className="mt-0.5 text-muted-foreground">
                  5-Agent Team Assigned · Delivery Stack: <span className="font-semibold text-foreground uppercase">{stack}</span>
                </p>
              </div>
            </div>
          )}

          {/* Primary Action CTA */}
          <Button
            type="submit"
            size="lg"
            disabled={!canSubmit || loading}
            className="h-12 w-full rounded-2xl font-bold text-sm shadow-md transition-all hover:shadow-lg active:scale-[0.99]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Project & Initializing Team…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Create Project & Open Mission Control
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
