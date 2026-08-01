"use client";

import { cn } from "@/lib/utils";

export function QualityScore({
  score,
  label,
  details,
}: {
  score: number;
  label?: string;
  details?: { label: string; passed: boolean }[];
}) {
  const color =
    score >= 90 ? "text-emerald-400" : score >= 70 ? "text-amber-400" : "text-rose-400";
  const bgColor =
    score >= 90 ? "bg-emerald-500" : score >= 70 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div
      className={cn(
        "rounded-xl border p-5",
        "bg-gradient-to-b from-white/[0.02] to-transparent border-white/[0.06]"
      )}
    >
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label || "Quality Score"}</p>
        <p className={cn("mt-2 text-4xl font-bold", color)}>{score}</p>
        <p className="text-[10px] text-zinc-600">/100</p>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn("h-full rounded-full transition-all duration-700", bgColor)}
          style={{ width: `${score}%` }}
        />
      </div>

      {details && details.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {details.map((detail) => (
            <div key={detail.label} className="flex items-center gap-2">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  detail.passed ? "bg-emerald-400" : "bg-amber-400"
                )}
              />
              <span className="text-[10px] text-zinc-400">{detail.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
