"use client";

import { cn } from "@/lib/utils";

export interface ActivityItem {
  id: string;
  agentName: string;
  agentAvatar: string;
  action: string;
  detail?: string;
  timestamp: Date | string;
  type: "created" | "reviewed" | "fixed" | "deployed" | "approved" | "started" | "completed";
}

const typeConfig: Record<ActivityItem["type"], { color: string; icon: string }> = {
  created: { color: "text-sky-400", icon: "+" },
  reviewed: { color: "text-amber-400", icon: "eye" },
  fixed: { color: "text-emerald-400", icon: "check" },
  deployed: { color: "text-purple-400", icon: "rocket" },
  approved: { color: "text-emerald-400", icon: "thumbs-up" },
  started: { color: "text-sky-400", icon: "play" },
  completed: { color: "text-emerald-400", icon: "check-circle" },
};

function formatTime(date: Date | string): string {
  if (typeof date === "string") {
    // Already formatted like "10:30:45 AM" — return as-is
    if (/^\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM)?$/i.test(date)) return date;
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return date;
    date = parsed;
  }
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export function ActivityFeedItem({ item }: { item: ActivityItem }) {
  const config = typeConfig[item.type];

  return (
    <div className="group flex items-start gap-3 py-2.5">
      <div className="relative flex-shrink-0 pt-0.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.05] text-sm">
          {item.agentAvatar}
        </div>
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-[#09090b]",
            item.type === "created" && "bg-sky-500",
            item.type === "reviewed" && "bg-amber-500",
            item.type === "fixed" && "bg-emerald-500",
            item.type === "deployed" && "bg-purple-500",
            item.type === "approved" && "bg-emerald-500",
            item.type === "started" && "bg-sky-500",
            item.type === "completed" && "bg-emerald-500"
          )}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white">{item.agentName}</span>
          <span className="text-[10px] text-zinc-600">{formatTime(item.timestamp)}</span>
        </div>
        <p className="mt-0.5 text-xs text-zinc-400">{item.action}</p>
        {item.detail && (
          <p className="mt-0.5 text-[10px] text-zinc-600 truncate">{item.detail}</p>
        )}
      </div>

      <span className={cn("flex-shrink-0 text-[10px]", config.color)}>
        {config.icon}
      </span>
    </div>
  );
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center">
        <p className="text-xs text-zinc-600">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0 divide-y divide-white/[0.04]">
      {items.map((item) => (
        <ActivityFeedItem key={item.id} item={item} />
      ))}
    </div>
  );
}
