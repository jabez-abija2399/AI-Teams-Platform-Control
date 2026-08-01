'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, Loader2, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { MissionTimelineItem } from '@/core/workspace/types';

interface MissionTimelineProps {
  timeline: MissionTimelineItem[];
  mode: 'creator' | 'developer';
}

export function MissionTimeline({ timeline, mode }: MissionTimelineProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    step_vision: true,
    step_product_proposal: true,
    step_arch_proposal: true,
    step_database: true,
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusIcon = (status: MissionTimelineItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />;
      case 'waiting':
        return <Clock className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-700 shrink-0" />;
    }
  };

  const getStatusBadge = (status: MissionTimelineItem['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-xs animate-pulse">Working</Badge>;
      case 'waiting':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">Action Required</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-xs">Blocked</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-500 border-gray-800 text-xs">Queued</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Mission Timeline</h2>
          <p className="text-xs text-gray-400 mt-0.5">Autonomous company milestones and execution history</p>
        </div>
        <span className="text-xs text-gray-500">
          {timeline.filter((t) => t.status === 'completed').length} / {timeline.length} Milestones Complete
        </span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-800">
        {timeline.map((item) => {
          const isExpanded = !!expandedIds[item.id];
          return (
            <div key={item.id} className="relative group">
              {/* Timeline Dot Icon */}
              <div className="absolute -left-6 top-3 -translate-x-1/2 bg-gray-950 p-0.5 rounded-full z-10">
                {getStatusIcon(item.status)}
              </div>

              {/* Card Container */}
              <div className="bg-gray-900/60 border border-gray-800/80 hover:border-gray-700/80 rounded-xl p-4 transition-all">
                <div
                  className="flex items-start justify-between gap-4 cursor-pointer select-none"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        {item.title}
                      </h3>
                      {getStatusBadge(item.status)}
                      {item.duration && (
                        <span className="text-xs text-gray-500 font-mono">({item.duration})</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{item.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center -space-x-1.5">
                      {item.assignedAgents.map((agent, i) => (
                        <span
                          key={i}
                          className="w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-[10px] font-bold text-indigo-400"
                          title={`Assigned: ${agent}`}
                        >
                          {agent[0]}
                        </span>
                      ))}
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Collapsible History & Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-800/60 space-y-2 text-xs">
                    {mode === 'developer' && (
                      <div className="p-2 rounded bg-black/40 border border-gray-800 font-mono text-[11px] text-emerald-400 space-y-1">
                        <div>Step ID: {item.id}</div>
                        <div>Dependencies: {item.dependencies.join(', ') || 'None'}</div>
                        <div>Assigned Agents: {item.assignedAgents.join(', ')}</div>
                      </div>
                    )}

                    {item.history.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-gray-500 font-medium">Activity Log:</span>
                        <ul className="space-y-1 pl-2 border-l border-gray-800 text-gray-300">
                          {item.history.map((log, idx) => (
                            <li key={idx} className="flex items-center gap-1.5 text-gray-400">
                              <span className="w-1 h-1 rounded-full bg-indigo-500" />
                              {log}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
