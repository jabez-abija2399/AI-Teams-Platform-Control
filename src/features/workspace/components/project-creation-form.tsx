"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TeamAssemblyAnimation } from "@/features/workspace/components/company/team-assembly-animation";

interface ProjectFormData {
  name: string;
  description: string;
  businessGoal: string;
  targetUsers: string;
  technologyPreference: string;
}

export function ProjectCreationForm() {
  const router = useRouter();
  const [phase, setPhase] = useState<"form" | "creating" | "ready">("form");
  const [form, setForm] = useState<ProjectFormData>({
    name: "",
    description: "",
    businessGoal: "",
    targetUsers: "",
    technologyPreference: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.businessGoal || !form.targetUsers) return;

    setPhase("creating");

    try {
      // Create project
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name }),
      });

      if (!res.ok) throw new Error("Failed to create project");
      const result = await res.json();
      const projectId = result.data?.id ?? result.id;

      if (!projectId) throw new Error("No project ID returned");

      // Start lifecycle (wait for it)
      const lifecycleRes = await fetch(`/api/projects/${projectId}/lifecycle/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIdea: `${form.description}\n\nBusiness Goal: ${form.businessGoal}\nTarget Users: ${form.targetUsers}\nTechnology: ${form.technologyPreference || "Any"}`,
        }),
      });

      if (!lifecycleRes.ok) {
        const err = await lifecycleRes.json().catch(() => ({}));
        console.error("Lifecycle start failed:", err);
        throw new Error("Failed to start AI pipeline");
      }

      // Show team assembly
      setPhase("ready");
      setTimeout(() => {
        router.push(`/dashboard/projects/${projectId}/workspace`);
      }, 2000);
    } catch (error) {
      console.error("Failed to create project:", error);
      setPhase("form");
    }
  };

  if (phase === "creating" || phase === "ready") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <TeamAssemblyAnimation phase={phase === "creating" ? "creating" : "ready"} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-3xl mb-4">
            🏢
          </div>
          <h1 className="text-2xl font-bold text-white">Start Your AI Company</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Describe your idea and our AI team will build it for you
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Hotel Booking Website"
              className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-zinc-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe what you want to build..."
              rows={3}
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Business Goal <span className="text-rose-400">*</span>
            </label>
            <Input
              value={form.businessGoal}
              onChange={(e) => setForm({ ...form, businessGoal: e.target.value })}
              placeholder="e.g., Generate revenue through bookings"
              className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-zinc-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Target Users <span className="text-rose-400">*</span>
            </label>
            <Input
              value={form.targetUsers}
              onChange={(e) => setForm({ ...form, targetUsers: e.target.value })}
              placeholder="e.g., Travelers looking for accommodations"
              className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-zinc-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Technology Preference <span className="text-zinc-600">(optional)</span>
            </label>
            <Input
              value={form.technologyPreference}
              onChange={(e) => setForm({ ...form, technologyPreference: e.target.value })}
              placeholder="e.g., Next.js, React, Node.js"
              className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-zinc-600"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold py-6 text-sm"
          >
            START YOUR AI COMPANY
          </Button>
        </form>

        <p className="mt-4 text-center text-[10px] text-zinc-600">
          11 AI employees will be assembled to build your product
        </p>
      </div>
    </div>
  );
}
