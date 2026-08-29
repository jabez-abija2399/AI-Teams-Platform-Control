'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Cpu,
  Layers,
  Bot,
  Terminal,
  Settings,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { ROUTES } from '@/config/constants';
import { AiCredentialsForm } from '@/features/settings/components/ai-credentials-form';

export function ProjectCreationForm() {
  const router = useRouter();
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingKey, setCheckingKey] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check if API key is active
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
    if (!idea.trim() || loading || !hasApiKey) return;

    setLoading(true);
    setError(null);

    try {
      const firstSentence = idea.trim().split(/[.!?\n]/)[0] || 'My Project';
      const projectName = firstSentence.slice(0, 40).trim() || 'My Project';
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          description: idea.trim(),
          stack: 'nextjs',
        }),
      });

      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.success) {
        throw new Error(result?.error?.message || 'Could not create project');
      }

      const projectId = result.data?.id;
      if (!projectId) throw new Error('No project ID returned');

      // Trigger automatic pipeline start
      try {
        await fetch(`/api/projects/${projectId}/lifecycle/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIdea: idea.trim() }),
        });
      } catch (err) {
        console.warn('Network error triggering start:', err);
      }

      toast.success('Workspace Initialized', { description: `"${projectName}" is now compiling.` });
      router.push(`/dashboard/projects/${projectId}/workspace`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not create project';
      setError(msg);
      toast.error('Initialization Failed', { description: msg });
      setLoading(false);
    }
  };

  if (checkingKey) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-sm text-on-surface-variant font-mono">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Verifying AI workforce credentials…</span>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-8">
        <div className="border border-warning bg-warning/5 p-6 glass-card">
          <p className="font-mono text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-warning" /> Step 1 — Connect AI Provider Gateway
          </p>
          <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
            A key is required to bootstrap your workspace (Gemini Free works out of the box). Keys are stored locally and encrypted.
          </p>
        </div>
        <AiCredentialsForm
          embedded
          onConfigured={() => {
            setHasApiKey(true);
            toast.success('AI Provider Connected');
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 w-full pb-32">
      {/* SECTION 1: BREADCRUMB PROGRESS BAR */}
      <section className="mb-12">
        <nav aria-label="Progress">
          <ol className="flex items-center border border-white/10 p-4 bg-surface/90 glass-card" role="list">
            <li className="relative pr-8 sm:pr-20">
              <div aria-hidden="true" className="absolute inset-0 flex items-center">
                <div className="h-0.5 w-full bg-primary/40"></div>
              </div>
              <div className="relative flex h-8 w-8 items-center justify-center bg-primary text-background border border-primary font-bold">
                <Check className="w-4 h-4" />
              </div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-wider text-primary font-bold whitespace-nowrap hidden sm:block">
                Define Concept
              </span>
            </li>
            <li className="relative pr-8 sm:pr-20">
              <div aria-hidden="true" className="absolute inset-0 flex items-center">
                <div className="h-0.5 w-full bg-white/10"></div>
              </div>
              <div className="relative flex h-8 w-8 items-center justify-center bg-primary text-background border border-primary font-bold font-mono text-xs glow-cyan">
                2
              </div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-wider text-primary font-bold whitespace-nowrap hidden sm:block">
                Generate Stack
              </span>
            </li>
            <li className="relative pr-8 sm:pr-20">
              <div aria-hidden="true" className="absolute inset-0 flex items-center">
                <div className="h-0.5 w-full bg-white/10"></div>
              </div>
              <div className="relative flex h-8 w-8 items-center justify-center bg-surface border border-white/10 text-on-surface-variant font-bold font-mono text-xs">
                3
              </div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant whitespace-nowrap hidden sm:block">
                Assemble Team
              </span>
            </li>
            <li className="relative">
              <div className="relative flex h-8 w-8 items-center justify-center bg-surface border border-white/10 text-on-surface-variant font-bold font-mono text-xs">
                4
              </div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant whitespace-nowrap hidden sm:block">
                Launch Build
              </span>
            </li>
          </ol>
        </nav>
      </section>

      <form onSubmit={handleSubmit} className="space-y-12">
        {error && (
          <div className="rounded-none border border-danger/40 bg-danger/10 p-4 text-xs font-semibold text-danger">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* SECTION 2: CONCEPT DEFINITION PANEL */}
          <section className="lg:col-span-7 flex flex-col gap-4">
            <div className="border border-white/10 p-6 bg-surface glass-card relative group offset-shadow">
              <label className="block font-mono text-xs uppercase tracking-wider text-white font-bold mb-4" htmlFor="concept-input">
                Describe your app idea
              </label>
              <textarea
                id="concept-input"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="e.g., A multi-tenant SaaS platform for managing autonomous delivery drones. Needs real-time tracking, a manager dashboard, and API access for third-party logistics integrations..."
                rows={12}
                className="w-full bg-background/80 border border-white/10 p-4 font-mono text-xs text-white placeholder:text-on-surface-variant/40 resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary leading-relaxed"
                required
              />
              <div className="mt-4 flex justify-between items-center border-t border-white/10 pt-4">
                <span className="font-mono text-xs text-on-surface-variant">Markdown Supported</span>
                <button
                  type="button"
                  className="bg-surface-container-high border border-white/10 px-4 py-2 font-mono text-xs text-white hover:border-primary hover:text-primary transition-colors font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Analyze Concept
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 3: ARCHITECT RECOMMENDED STACK CARD */}
          <section className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-surface border border-white/10 p-6 h-full flex flex-col relative overflow-hidden glass-card offset-shadow">
              <div className="flex items-center gap-2 mb-6 relative z-10">
                <Layers className="text-primary w-5 h-5" />
                <h3 className="font-heading text-lg font-bold text-white">System Architecture Recommendation</h3>
              </div>
              <div className="flex-1 space-y-4 relative z-10">
                {/* Stack Items */}
                <div className="border border-white/10 bg-surface-container-high p-4 flex items-center justify-between group hover:border-primary transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-surface flex items-center justify-center border border-primary/40 font-mono text-xs font-bold text-primary">
                      Re
                    </div>
                    <div>
                      <p className="font-mono text-xs font-bold uppercase tracking-wider text-white">React / Next.js</p>
                      <p className="font-mono text-[10px] text-on-surface-variant mt-0.5">Frontend Framework</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <div className="border border-white/10 bg-surface-container-high p-4 flex items-center justify-between group hover:border-primary transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-surface flex items-center justify-center border border-primary/40 font-mono text-xs font-bold text-primary">
                      No
                    </div>
                    <div>
                      <p className="font-mono text-xs font-bold uppercase tracking-wider text-white">Node.js / Express</p>
                      <p className="font-mono text-[10px] text-on-surface-variant mt-0.5">Runtime Environment</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <div className="border border-white/10 bg-surface-container-high p-4 flex items-center justify-between group hover:border-primary transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-surface flex items-center justify-center border border-primary/40 font-mono text-xs font-bold text-primary">
                      Pr
                    </div>
                    <div>
                      <p className="font-mono text-xs font-bold uppercase tracking-wider text-white">Prisma ORM</p>
                      <p className="font-mono text-[10px] text-on-surface-variant mt-0.5">Database Client</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <div className="border border-white/10 bg-surface-container-high p-4 flex items-center justify-between group hover:border-primary transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-surface flex items-center justify-center border border-primary/40 font-mono text-xs font-bold text-primary">
                      Pg
                    </div>
                    <div>
                      <p className="font-mono text-xs font-bold uppercase tracking-wider text-white">PostgreSQL</p>
                      <p className="font-mono text-[10px] text-on-surface-variant mt-0.5">Relational Database</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 relative z-10">
                <button
                  type="button"
                  className="w-full bg-transparent border border-white/20 hover:border-primary text-white hover:text-primary py-3 font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  Customize Stack Parameters
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* SECTION 4: AGENT WORKFORCE ASSIGNMENT */}
        <section className="mb-12 border-t border-white/10 pt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading text-lg font-bold text-white">Agent Workforce Assignment</h3>
            <span className="font-mono text-xs text-primary font-bold bg-primary/10 px-3 py-1 border border-primary/30 rounded-full">
              3 Agents Assigned
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Agent 1 */}
            <div className="border border-white/10 p-5 bg-surface hover:border-primary/50 transition-colors group relative glass-card offset-shadow">
              <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-surface-container border border-primary/40 flex items-center justify-center overflow-hidden font-bold text-primary font-heading text-lg">
                  SP
                </div>
                <div>
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">Sarah</h4>
                  <p className="font-mono text-[10px] text-on-surface-variant mt-0.5">Project Manager</p>
                </div>
              </div>
              <div className="font-mono text-xs text-on-surface-variant border-t border-white/10 pt-3 flex justify-between">
                <span>Status: <span className="text-primary font-bold">Ready</span></span>
                <Bot className="w-4 h-4 text-primary" />
              </div>
            </div>

            {/* Agent 2 */}
            <div className="border border-white/10 p-5 bg-surface hover:border-primary/50 transition-colors group relative glass-card offset-shadow">
              <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-surface-container border border-primary/40 flex items-center justify-center overflow-hidden font-bold text-primary font-heading text-lg">
                  MA
                </div>
                <div>
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">Marcus</h4>
                  <p className="font-mono text-[10px] text-on-surface-variant mt-0.5">System Architect</p>
                </div>
              </div>
              <div className="font-mono text-xs text-on-surface-variant border-t border-white/10 pt-3 flex justify-between">
                <span>Status: <span className="text-primary font-bold">Analyzing</span></span>
                <Layers className="w-4 h-4 text-primary" />
              </div>
            </div>

            {/* Agent 3 */}
            <div className="border border-white/10 p-5 bg-surface hover:border-primary/50 transition-colors group relative glass-card offset-shadow">
              <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-on-surface-variant/40"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-surface-container border border-white/10 flex items-center justify-center overflow-hidden font-bold text-on-surface-variant font-heading text-lg">
                  AD
                </div>
                <div>
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">Alex</h4>
                  <p className="font-mono text-[10px] text-on-surface-variant mt-0.5">Full Stack Developer</p>
                </div>
              </div>
              <div className="font-mono text-xs text-on-surface-variant border-t border-white/10 pt-3 flex justify-between">
                <span>Status: <span className="text-on-surface-variant">Standby</span></span>
                <Terminal className="w-4 h-4 text-on-surface-variant" />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: PRIMARY SUBMIT FOOTER */}
        <footer className="fixed bottom-0 left-0 md:left-64 right-0 bg-background/95 backdrop-blur-md border-t border-white/10 p-6 z-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-on-surface-variant font-mono text-xs">
            Estimated build configuration time: <span className="text-primary font-bold">~2 mins</span>
          </div>
          <button
            type="submit"
            disabled={loading || !idea.trim()}
            className="w-full sm:w-auto bg-primary text-background font-mono text-xs font-bold px-8 py-4 hover:bg-transparent hover:text-primary border border-primary transition-all flex items-center justify-center gap-2 group uppercase tracking-wider offset-shadow"
          >
            {loading ? 'Assembling AI Team...' : 'Confirm Stack & Assemble Team'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </footer>
      </form>
    </div>
  );
}
