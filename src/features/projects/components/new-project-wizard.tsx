'use client';

import React, { useState } from 'react';
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
  AlertTriangle,
  RefreshCw,
  Loader2,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { ROUTES } from '@/config/constants';

export function NewProjectWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [ideaText, setIdeaText] = useState('');
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaText.trim()) {
      toast.error('Please enter a description for your software project.');
      return;
    }
    const generatedName = ideaText.split(' ').slice(0, 3).join(' ') || 'New AI Project';
    setProjectName(generatedName);
    setStep(2);
  };

  const handleLaunchProject = async () => {
    if (loading) return;
    setLoading(true);
    setStep(4);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName || 'AI Software Build',
          description: ideaText,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.error?.message || 'Failed to initialize project.');
        setLoading(false);
        setStep(3);
        return;
      }

      toast.success('AI Workforce deployed! Launching workspace...');
      setTimeout(() => {
        router.push(`${ROUTES.projects}/${result.data.id}/workspace`);
        router.refresh();
      }, 1200);
    } catch {
      toast.error('Project creation failed. Please try again.');
      setLoading(false);
      setStep(3);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-sans selection:bg-primary selection:text-black">
      {/* Top Navigation Anchor */}
      <header className="bg-background border-b border-white/10 flex justify-between items-center w-full px-6 py-4 h-16 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold text-primary border border-primary px-2.5 py-1 uppercase">
            NEURAL_FLOW
          </span>
        </div>

        {/* Progress Bar Indicator */}
        <div className="flex items-center gap-2 font-mono text-xs text-on-surface-variant">
          <span className={step === 1 ? 'text-primary border-b border-primary pb-0.5 font-bold' : ''}>
            01 / Define
          </span>
          <ChevronRight className="w-3 h-3 opacity-40" />
          <span className={step === 2 ? 'text-primary border-b border-primary pb-0.5 font-bold' : ''}>
            02 / Understand
          </span>
          <ChevronRight className="w-3 h-3 opacity-40" />
          <span className={step === 3 ? 'text-primary border-b border-primary pb-0.5 font-bold' : ''}>
            03 / Prepare
          </span>
          <ChevronRight className="w-3 h-3 opacity-40" />
          <span className={step === 4 ? 'text-primary border-b border-primary pb-0.5 font-bold' : ''}>
            04 / Launch
          </span>
        </div>

        <div className="flex items-center gap-3 text-on-surface-variant">
          <Settings className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
          <Terminal className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10">
        {/* STEP 1: DEFINE */}
        {step === 1 && (
          <div className="bg-surface border border-white/10 w-full max-w-4xl flex flex-col rounded-xl overflow-hidden">
            <div className="p-6 md:p-8 border-b border-white/10 flex items-center justify-between">
              <div>
                <h1 className="font-heading text-3xl font-extrabold text-white mb-1">Define Your Idea</h1>
                <p className="font-sans text-xs text-on-surface-variant max-w-2xl">
                  Describe the product you have in mind. Don't worry about getting everything perfect—we'll structure it with you.
                </p>
              </div>
              <div className="font-mono text-xs text-on-surface-variant px-3 py-1 border border-white/10 rounded">
                STEP_01_INIT
              </div>
            </div>

            <form onSubmit={handleStep1Submit} className="p-6 md:p-8 flex flex-col gap-6 relative">
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                <textarea
                  value={ideaText}
                  onChange={(e) => setIdeaText(e.target.value)}
                  placeholder="Describe your software idea... (e.g. Build an AI-powered study assistant application with real-time markdown notes, automated flashcard generation, and spaced repetition algorithm)."
                  className="w-full bg-background border border-white/10 focus:border-primary text-white font-mono text-xs p-4 min-h-[260px] resize-none outline-none transition-colors rounded-xl pl-4"
                  spellCheck={false}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  <span className="font-mono text-xs text-on-surface-variant">
                    Try including: Who is it for? What problem does it solve?
                  </span>
                </div>
                <button
                  type="submit"
                  className="bg-primary text-black font-mono text-xs font-bold px-6 py-3 rounded-xl hover:bg-primary-container transition-colors flex items-center gap-2 uppercase tracking-wider glow-cyan"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: UNDERSTAND */}
        {step === 2 && (
          <div className="bg-surface border border-white/10 w-full max-w-4xl flex flex-col rounded-xl overflow-hidden">
            <div className="p-6 md:p-8 border-b border-white/10 flex items-center justify-between">
              <div>
                <h1 className="font-heading text-3xl font-extrabold text-white mb-1">Requirements Analysis</h1>
                <p className="font-sans text-xs text-on-surface-variant max-w-2xl">
                  AI CEO & Architect have processed your project prompt into functional specifications.
                </p>
              </div>
              <div className="font-mono text-xs text-primary px-3 py-1 border border-primary/40 rounded font-bold">
                02 / UNDERSTAND
              </div>
            </div>

            <div className="p-6 md:p-8 flex flex-col gap-6 font-mono text-xs">
              {/* Target Audience */}
              <div className="bg-background border border-white/10 p-5 rounded-xl">
                <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2">
                  <h3 className="font-sans text-sm font-bold text-white">Target Audience</h3>
                  <span className="text-[10px] text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded font-bold">
                    INFERRED
                  </span>
                </div>
                <ul className="space-y-1.5 text-on-surface-variant pl-2 border-l-2 border-primary">
                  <li className="flex items-center gap-2">• Students & Researchers requiring structured synthesis</li>
                  <li className="flex items-center gap-2">• Developers building automated learning tools</li>
                  <li className="flex items-center gap-2">• Technical PMs requiring concise specification summaries</li>
                </ul>
              </div>

              {/* Core Features Table */}
              <div className="bg-background border border-white/10 p-5 rounded-xl">
                <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2">
                  <h3 className="font-sans text-sm font-bold text-white">Core Features Architecture</h3>
                  <span className="text-[10px] text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded font-bold">
                    SPECIFIED
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white font-bold">AI Flashcard Generator</span>
                    <span className="text-primary font-bold">INFERRED</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white font-bold">Spaced Repetition Scheduler</span>
                    <span className="text-primary font-bold">PROVIDED</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-white font-bold">Vector Database Search</span>
                    <span className="text-warning font-bold">READY</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-on-surface-variant hover:text-white font-mono text-xs px-4 py-2"
                >
                  ← Edit Scope
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="bg-primary text-black font-mono text-xs font-bold px-6 py-3 rounded-xl hover:bg-primary-container transition-colors flex items-center gap-2 uppercase tracking-wider glow-cyan"
                >
                  <span>Prepare AI Team</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PREPARE */}
        {step === 3 && (
          <div className="bg-surface border border-white/10 w-full max-w-4xl flex flex-col rounded-xl overflow-hidden">
            <div className="p-6 md:p-8 border-b border-white/10 text-center">
              <div className="inline-flex items-center justify-center border border-primary/40 px-3 py-1 mb-3 rounded">
                <span className="font-mono text-[10px] text-primary uppercase font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> SYSTEM READY
                </span>
              </div>
              <h1 className="font-heading text-3xl font-extrabold text-white mb-2">Your software team is ready.</h1>
              <p className="font-sans text-xs text-on-surface-variant max-w-xl mx-auto">
                Each specialist handles a different part of the software-building process. They are connected and ready for execution.
              </p>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* CEO */}
              <div className="bg-background border border-white/10 p-4 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-mono text-xs font-bold text-primary">NODE_01</span>
                  <Brain className="w-4 h-4 text-on-surface-variant" />
                </div>
                <h3 className="font-sans text-sm font-bold text-white">CEO</h3>
                <p className="font-mono text-[11px] text-on-surface-variant">Product Strategy & PRD</p>
                <div className="mt-auto pt-2 border-t border-white/10 flex justify-between items-center font-mono text-[10px]">
                  <span className="text-on-surface-variant">STATUS</span>
                  <span className="text-primary font-bold">READY</span>
                </div>
              </div>

              {/* Architect */}
              <div className="bg-background border border-white/10 p-4 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-mono text-xs font-bold text-primary">NODE_02</span>
                  <Layers className="w-4 h-4 text-on-surface-variant" />
                </div>
                <h3 className="font-sans text-sm font-bold text-white">ARCHITECT</h3>
                <p className="font-mono text-[11px] text-on-surface-variant">System Architecture</p>
                <div className="mt-auto pt-2 border-t border-white/10 flex justify-between items-center font-mono text-[10px]">
                  <span className="text-on-surface-variant">STATUS</span>
                  <span className="text-primary font-bold">READY</span>
                </div>
              </div>

              {/* Designer */}
              <div className="bg-background border border-white/10 p-4 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-mono text-xs font-bold text-primary">NODE_03</span>
                  <Sparkles className="w-4 h-4 text-on-surface-variant" />
                </div>
                <h3 className="font-sans text-sm font-bold text-white">DESIGNER</h3>
                <p className="font-mono text-[11px] text-on-surface-variant">UI/UX & Design Tokens</p>
                <div className="mt-auto pt-2 border-t border-white/10 flex justify-between items-center font-mono text-[10px]">
                  <span className="text-on-surface-variant">STATUS</span>
                  <span className="text-primary font-bold">READY</span>
                </div>
              </div>

              {/* Developer */}
              <div className="bg-background border border-white/10 p-4 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-mono text-xs font-bold text-primary">NODE_04</span>
                  <Terminal className="w-4 h-4 text-on-surface-variant" />
                </div>
                <h3 className="font-sans text-sm font-bold text-white">DEVELOPER</h3>
                <p className="font-mono text-[11px] text-on-surface-variant">Code & Implementation</p>
                <div className="mt-auto pt-2 border-t border-white/10 flex justify-between items-center font-mono text-[10px]">
                  <span className="text-on-surface-variant">STATUS</span>
                  <span className="text-primary font-bold">READY</span>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 pt-0 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-on-surface-variant hover:text-white font-mono text-xs px-4 py-2"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleLaunchProject}
                className="bg-primary text-black font-mono text-xs font-bold px-8 py-3.5 rounded-xl hover:bg-primary-container transition-colors flex items-center gap-2 uppercase tracking-wider glow-cyan"
              >
                <span>Confirm Workforce & Launch</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: LAUNCH / AI PROCESSING */}
        {step === 4 && (
          <div className="bg-surface border border-white/10 w-full max-w-2xl p-8 rounded-xl text-center flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center text-primary glow-cyan">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-extrabold text-white mb-2">
                Deploying Autonomous AI Workforce...
              </h2>
              <p className="font-mono text-xs text-on-surface-variant">
                Mounting workspace workspace for {projectName || 'AI Software Build'}
              </p>
            </div>
            <div className="w-full bg-background border border-white/10 p-4 rounded-xl font-mono text-xs text-primary text-left space-y-1">
              <div>[SYS] Initializing Node 0x9f3A...</div>
              <div>[CEO_AGENT] Synthesizing Product Requirements Document</div>
              <div>[ARCHITECT_AGENT] Drafting system architecture graph</div>
              <div className="animate-pulse">[NET] Mounting IDE workspace node...</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
