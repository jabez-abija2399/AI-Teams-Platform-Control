'use client';

import { Activity, CheckCircle2, MessageSquare, Sparkles } from 'lucide-react';
import type { ActivityFeedItem } from '@/core/workspace/types';

interface ActivityFeedPanelProps {
  activities: ActivityFeedItem[];
  mode: 'creator' | 'developer';
}

export function ActivityFeedPanel({ activities, mode }: ActivityFeedPanelProps) {
  const getCategoryIcon = (category: ActivityFeedItem['category']) => {
    switch (category) {
      case 'milestone':
        return <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'approval':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'decision':
        return <Activity className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-gray-400 shrink-0" />;
    }
  };

  return (
    <div className="border-t border-gray-800 bg-gray-950/90 p-4 space-y-3 max-h-60 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Company Activity Feed</h3>
        </div>
        <span className="text-[11px] text-gray-500">
          {mode === 'creator' ? 'Humanized Updates' : 'System Event Stream'}
        </span>
      </div>

      <div className="space-y-2">
        {activities.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-3 text-xs bg-gray-900/40 border border-gray-800/60 rounded-lg px-3 py-2 transition-colors hover:bg-gray-900/80"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {getCategoryIcon(item.category)}
              <span className="font-semibold text-indigo-300 shrink-0">{item.agentName}:</span>
              <p className="text-gray-300 truncate">{item.message}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0 text-gray-500 text-[11px]">
              {mode === 'developer' && item.details && (
                <span className="font-mono text-[10px] text-emerald-400">
                  [{JSON.stringify(item.details)}]
                </span>
              )}
              <span className="font-mono">{item.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
