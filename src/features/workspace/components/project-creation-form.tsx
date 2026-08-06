'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, KeyRound, Loader2, Sparkles } from 'lucide-react';
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
    title: 'Static login',
    idea: 'Static HTML and CSS login and signup pages only — no backend, no framework.',
    stack: 'static-html' as const,
  },
  {
    title: 'Hotel booking',
    idea: 'A hotel booking website where travelers search rooms, reserve stays, and hotel owners manage listings.',
    stack: 'nextjs' as const,
  },
  {
    title: 'Team tasks',
    idea: 'A lightweight React task board for small teams with assignments and due dates.',
    stack: 'react' as const,
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
    if (!canSubmit || loading || !stack || stack === 'unknown') return;

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

      toast.success('Project created', { description: 'Opening Mission Control…' });
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
    <div className="mx-auto w-full max-w-xl">
      <Link
        href={ROUTES.projects}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      <div className="mb-8">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {hasApiKey ? 'What do you want to build?' : 'Set up your AI API key'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {hasApiKey
            ? 'Describe your idea, then choose how it should be built. Mission Control, agents, and Preview all share that stack from day one.'
            : 'Before creating a project, connect an AI provider. Prefer Google Gemini or Groq for a free tier — no payment needed to start. Your AI company uses this key to plan, design, code, test, and deploy.'}
        </p>
      </div>

      {checkingKey ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card/80 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Checking AI setup…
        </div>
      ) : !hasApiKey ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-accent/25 bg-accent/[0.06] p-4">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Step 1 of 2 — API key</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Pick a provider, follow the short guide, paste your key, then continue to describe
                  your idea.
                </p>
              </div>
            </div>
          </div>
          <AiCredentialsForm
            embedded
            onConfigured={() => {
              setHasApiKey(true);
              toast.success('API key ready', {
                description: 'You can create your project now.',
              });
            }}
          />
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7"
        >
          {error && (
            <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="project-idea" className="text-sm font-medium">
              Your idea
            </label>
            <textarea
              id="project-idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g. A hotel booking site with room search, reservations, and an owner dashboard…"
              rows={5}
              autoFocus
              required
              className="w-full resize-none rounded-xl border border-input bg-background px-3.5 py-3 text-sm leading-relaxed outline-none ring-ring focus:ring-2"
            />
            <p className="text-[11px] text-muted-foreground">
              {idea.trim().length < 12
                ? 'Add a bit more detail (at least a short sentence).'
                : 'Looks good — pick a stack next.'}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="project-name" className="text-sm font-medium">
              Project name <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={previewName}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              Delivery stack <span className="font-normal text-destructive">*</span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              Chosen once here — Preview and agents reuse it (no re-ask). Not sure? Keep the
              Recommended default.
            </p>
            <StackSelect value={stack} onChange={setStack} />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Or try an example
            </p>
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
                    'rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors',
                    'hover:border-primary/40 hover:bg-primary/5 hover:text-foreground',
                  )}
                >
                  {ex.title}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={!canSubmit || loading}
            className="h-11 w-full rounded-xl font-semibold"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating project…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Continue to Mission Control
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          <ol className="space-y-1.5 border-t border-border pt-4 text-xs text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">1.</span> API key saved (Settings anytime)
            </li>
            <li>
              <span className="font-medium text-foreground">2.</span> Idea + stack
            </li>
            <li>
              <span className="font-medium text-foreground">3.</span> Start the AI pipeline in Mission
              Control
            </li>
          </ol>
        </form>
      )}
    </div>
  );
}
