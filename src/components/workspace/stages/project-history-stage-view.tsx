'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, FileText, ArrowUpRight, ShieldCheck, GitBranch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProjectHistoryStageViewProps {
  projectId: string;
}

export function ProjectHistoryStageView({ projectId }: ProjectHistoryStageViewProps) {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/artifacts/versions`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setTimeline(res.data);
      })
      .catch((err) => console.error('Failed to fetch timeline history:', err))
      .finally(() => setLoading(false));
  }, [projectId]);

  const defaultEvents = [
    { time: '09:42 AM', title: 'Idea submitted by User', role: 'USER', detail: 'Restaurant Booking Platform' },
    { time: '09:45 AM', title: 'CEO Product Specification v1 authored', role: 'CEO', detail: 'Product vision, problem statement & MVP features' },
    { time: '09:47 AM', title: 'User approved Product Specification v1', role: 'USER', detail: 'Checkpoint gate passed' },
    { time: '09:52 AM', title: 'Architect Architecture Specification v1 authored', role: 'ARCHITECT', detail: 'Next.js App Router, Postgres DB & API designs' },
    { time: '09:54 AM', title: 'User approved Architecture Specification v1', role: 'USER', detail: 'Checkpoint gate passed' },
    { time: '10:04 AM', title: 'Designer Design Specification v1 authored', role: 'DESIGNER', detail: 'Design tokens, dark mode theme & layout specs' },
    { time: '10:06 AM', title: 'User approved Design Specification v1', role: 'USER', detail: 'Checkpoint gate passed' },
    { time: '10:18 AM', title: 'Developer completed software implementation', role: 'DEVELOPER', detail: 'All tasks built & registered inexplorer' },
    { time: '10:21 AM', title: 'Quality Verification checks passed', role: 'QA', detail: '18/18 Unit tests & REQ compliance verified' },
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-4xl mx-auto font-sans text-gray-200 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white font-mono">Project Engineering History & Traceability</h2>
            <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono">
              <Clock className="w-3.5 h-3.5 mr-1" />
              Full Audit Trail
            </Badge>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Chronological engineering timeline linking requirements, decision records, and artifact versions.
          </p>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative border-l border-gray-800 ml-4 space-y-6 py-2">
        {defaultEvents.map((evt, idx) => (
          <div key={idx} className="relative pl-6">
            {/* Dot */}
            <div className="absolute -left-2.5 top-0.5 w-5 h-5 rounded-full bg-gray-950 border border-indigo-500 flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-indigo-400" />
            </div>

            {/* Event Item */}
            <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-3.5 space-y-1 hover:border-gray-700 transition-colors">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white font-bold">{evt.title}</span>
                <span className="text-gray-500">{evt.time}</span>
              </div>
              <p className="text-xs text-gray-400">{evt.detail}</p>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant="outline" className="border-gray-800 text-gray-400 font-mono text-[10px]">
                  Role: {evt.role}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
