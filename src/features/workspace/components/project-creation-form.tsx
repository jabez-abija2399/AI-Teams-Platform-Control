'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, KeyRound, Loader2, Sparkles, Layers, CheckCircle2, Lightbulb } from 'lucide-react';
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
    title: 'Collaborative Kanban',
    idea: 'A modern real-time task board for agile engineering teams with sprint tracking and analytics.',
    stack: 'react' as const,
  },
  {
    title: 'SaaS Booking Portal',
    idea: 'A full-featured booking website where clients search availability, reserve slots, and owners manage listings.',
    stack: 'nextjs' as const,
  },
  {
    title: 'Clean Static Portfolio',
    idea: 'Static HTML and CSS landing page and contact form — sleek, lightweight, zero build framework required.',
    stack: 'static-html' as const,
  },
] as const;

function deriveName(idea: string): string {
  const cleaned = idea.trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'My AI Project';
  const firstSentence = cleaned.split(/[.!?]/)[0] || cleaned;
  return firstSentence.slice(0, 48).trim() || 'My AI Project';
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

  const canSubmit = idea.trim().length >= 12 && stack !== null && stack !== 'unknown' && hasApiKey;
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
      if (!projectId) throw new Error('No project ID returned');

      toast.success('Project initialized', { description: 'Opening Mission Control…' });
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
    <div className="mx-auto w-full max-w-2xl animate-fade-up">
      <Link
        href={ROUTES.projects}
        className="group mb-6 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
        Back to projects
      </Link>

      <div className="relative mb-8 overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card to-background p-6 shadow-sm sm:p-8">
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative z-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AI Software Organization
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {hasApiKey ? 'What software do you want to build?' : 'Set up your AI API key'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {hasApiKey
              ? 'Your 5-agent engineering team (PM, Architect, Designer, Developer, QA) will collaborate to plan, design, code, and test your product.'
              : 'Connect an AI provider to empower your autonomous team. Free tiers (Google Gemini, Groq) work out of the box.'}
          </p>
        </div>
      </div>

      {checkingKey ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-border/80 bg-card py-20 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Configuring autonomous workforce…</span>
        </div>
      ) : !hasApiKey ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-accent/25 bg-accent/[0.06] p-5 shadow-sm">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Step 1 — Connect AI Provider</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Pick your favorite provider (OpenAI, Anthropic, Gemini, Groq), enter your key, and start building.
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
          className="space-y-6 rounded-2xl border border-border/90 bg-card p-6 shadow-sm sm:p-8"
        >
          {error && (
            <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive">
              {error}
            </div>
          )}

          {/* Prompt / Idea Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="project-idea" className="text-sm font-semibold text-foreground">
                Project Vision & Requirements
              </label>
              <span className="text-[11px] text-muted-foreground">
                {idea.length}/1000 characters
              </span>
            </div>
            <textarea
              id="project-idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe what you want to build in detail. E.g. A real-time team retrospective tool with live voting, action items, and automated export…"
              rows={4}
              autoFocus
              required
              className="w-full resize-none rounded-xl border border-input bg-background/50 px-4 py-3 text-sm leading-relaxed outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Quick Examples */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              <span>Or click an inspiration template:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.title}
                  type="button"
                  onClick={() => {
                    setIdea(ex.idea);
                    setStack(ex.stack);
                    if (!name.trim()) setName(ex.title);
                  }}
                  className={cn(
                    'rounded-lg border border-border/80 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-all',
                    'hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:scale-95',
                  )}
                >
                  {ex.title}
                </button>
              ))}
            </div>
          </div>

          {/* Project Name (Optional) */}
          <div className="space-y-2">
            <label htmlFor="project-name" className="text-sm font-semibold text-foreground">
              Project Name <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
            </label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={previewName}
              className="h-11 rounded-xl bg-background/50 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Delivery Stack Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">
                Target Architecture Stack <span className="text-destructive">*</span>
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Architect and Developer agents will strictly generate files according to this technology standard.
            </p>
            <StackSelect value={stack} onChange={setStack} />
          </div>

          {/* Live Summary Pill */}
          {idea.trim().length >= 12 && (
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-primary">Ready to Launch</p>
                <p className="truncate text-muted-foreground">
                  <span className="font-medium text-foreground">{previewName}</span> · Stack:{' '}
                  <span className="font-mono uppercase">{stack}</span>
                </p>
              </div>
            </div>
          )}

          {/* Primary Action CTA */}
          <Button
            type="submit"
            size="lg"
            disabled={!canSubmit || loading}
            className="h-12 w-full rounded-xl font-semibold shadow-md transition-all hover:shadow-lg active:scale-[0.99]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Initializing Project & AI Team…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Create & Open Mission Control
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
