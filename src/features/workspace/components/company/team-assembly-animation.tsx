"use client";

import { cn } from "@/lib/utils";

export function TeamAssemblyAnimation({ phase }: { phase: "creating" | "ready" }) {
  const employees = [
    { name: "CEO", avatar: "👔", delay: 0 },
    { name: "Product Manager", avatar: "📋", delay: 100 },
    { name: "Business Analyst", avatar: "📊", delay: 200 },
    { name: "UI/UX Designer", avatar: "🎨", delay: 300 },
    { name: "Software Architect", avatar: "🏗️", delay: 400 },
    { name: "Database Engineer", avatar: "🗄️", delay: 500 },
    { name: "Backend Engineer", avatar: "⚙️", delay: 600 },
    { name: "Frontend Engineer", avatar: "💻", delay: 700 },
    { name: "QA Engineer", avatar: "🧪", delay: 800 },
    { name: "Security Engineer", avatar: "🔒", delay: 900 },
    { name: "DevOps Engineer", avatar: "🚀", delay: 1000 },
  ];

  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <div className="relative">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-3xl">
          🏢
        </div>
        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      <div className="text-center">
        <h3 className="text-lg font-semibold text-white">
          {phase === "creating" ? "Assembling Your AI Team..." : "Your Team is Ready"}
        </h3>
        <p className="mt-1 text-sm text-zinc-400">
          {phase === "creating"
            ? "Hiring world-class AI engineers"
            : "11 AI employees ready to build your product"}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
        {employees.map((emp, index) => (
          <div
            key={emp.name}
            className={cn(
              "flex flex-col items-center gap-1.5 transition-all duration-300",
              phase === "creating" ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
            )}
            style={{ transitionDelay: `${emp.delay}ms` }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] text-xl border border-white/[0.06]">
              {emp.avatar}
            </div>
            <span className="text-[10px] text-zinc-500">{emp.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
