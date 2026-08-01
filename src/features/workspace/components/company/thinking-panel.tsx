"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ThinkingStep {
  label: string;
  content: string;
  status: "active" | "completed" | "pending";
}

interface ThinkingPanelProps {
  steps: ThinkingStep[];
  isActive: boolean;
}

function TypewriterText({ text, speed = 20 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && <span className="inline-block w-1.5 h-3.5 bg-sky-400/70 animate-pulse ml-0.5 align-middle" />}
    </span>
  );
}

export function ThinkingPanel({ steps, isActive }: ThinkingPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  return (
    <div
      ref={scrollRef}
      className="rounded-xl border border-white/[0.06] bg-[#0a0a0c] p-4 font-mono text-xs max-h-[400px] overflow-y-auto"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
          {isActive ? "AI Thinking Process" : "Thinking Complete"}
        </span>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="group">
            <div className="flex items-center gap-2 mb-1">
              {step.status === "completed" && (
                <span className="text-emerald-400 text-[10px]">✓</span>
              )}
              {step.status === "active" && (
                <span className="text-sky-400 text-[10px] animate-pulse">▸</span>
              )}
              {step.status === "pending" && (
                <span className="text-zinc-600 text-[10px]">○</span>
              )}
              <span
                className={cn(
                  "text-[10px] font-medium",
                  step.status === "completed" && "text-zinc-400",
                  step.status === "active" && "text-sky-400",
                  step.status === "pending" && "text-zinc-600"
                )}
              >
                {step.label}
              </span>
            </div>
            {step.status === "completed" && (
              <p className="pl-4 text-zinc-500 leading-relaxed">{step.content}</p>
            )}
            {step.status === "active" && (
              <div className="pl-4 text-zinc-300 leading-relaxed">
                <TypewriterText text={step.content} speed={15} />
              </div>
            )}
          </div>
        ))}
      </div>

      {isActive && (
        <div className="mt-3 flex items-center gap-2 text-zinc-600">
          <div className="h-1 w-1 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-[10px]">Processing...</span>
        </div>
      )}
    </div>
  );
}
