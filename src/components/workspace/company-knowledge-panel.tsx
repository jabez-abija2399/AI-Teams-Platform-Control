'use client';

import { useState, useEffect, useCallback } from 'react';
import { Brain, CheckCircle2, Shield, Search, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CompanyDecision, CompanyMemoryData } from '@/core/memory/types';

interface CompanyKnowledgePanelProps {
  projectId: string;
  mode: 'creator' | 'developer';
}

export function CompanyKnowledgePanel({ projectId, mode }: CompanyKnowledgePanelProps) {
  const [memory, setMemory] = useState<CompanyMemoryData | null>(null);
  const [decisions, setDecisions] = useState<CompanyDecision[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchAnswer, setSearchAnswer] = useState<string | null>(null);

  const fetchKnowledge = useCallback(async () => {
    try {
      const [memRes, decRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/memory`),
        fetch(`/api/projects/${projectId}/memory/decisions`),
      ]);

      const memJson = await memRes.json();
      const decJson = await decRes.json();

      if (memJson.success) setMemory(memJson.memory);
      if (decJson.success) setDecisions(decJson.decisions);
    } catch {}
  }, [projectId]);

  useEffect(() => {
    fetchKnowledge();
  }, [fetchKnowledge]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/memory/search?q=${encodeURIComponent(searchQuery)}`);
      const json = await res.json();
      if (json.success && json.result) {
        setSearchAnswer(json.result.answer);
      }
    } catch {}
  };

  return (
    <div className="p-6 space-y-6 bg-gray-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-400">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Shared Company Memory</h2>
            <p className="text-xs text-gray-400">Single source of truth for architectural decisions & project knowledge</p>
          </div>
        </div>
        <Badge variant="outline" className="border-indigo-500/40 text-indigo-400 text-xs">
          {mode.toUpperCase()} MODE
        </Badge>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Ask company memory (e.g., 'Why was Next.js selected?')..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <Button size="sm" onClick={handleSearch} className="bg-indigo-600 hover:bg-indigo-500 text-xs">
          Query Memory
        </Button>
      </div>

      {/* Search Answer Box */}
      {searchAnswer && (
        <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-white mb-1">Company Memory Answer:</div>
            <p className="leading-relaxed">{searchAnswer}</p>
          </div>
        </div>
      )}

      {/* Decisions Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Recorded Company Decisions</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {decisions.map((dec) => (
            <div
              key={dec.id}
              className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-4 space-y-2.5 hover:border-gray-700/80 transition-all"
            >
              <div className="flex items-center justify-between">
                <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-xs">
                  {dec.category}
                </Badge>
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {Math.round(dec.confidenceScore * 100)}% Confidence
                </span>
              </div>

              <h4 className="text-sm font-semibold text-white">{dec.title}</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                <span className="text-gray-500">Selected Option:</span> {dec.selectedOption}
              </p>
              <p className="text-xs text-gray-400 italic">"{dec.rationale}"</p>

              {mode === 'developer' && (
                <div className="pt-2 border-t border-gray-800 text-[10px] font-mono text-gray-500 flex items-center justify-between">
                  <span>Agent: {dec.createdByAgent}</span>
                  <span>ID: {dec.id}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Vision & Constraints Cards */}
      {memory && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              Company Constraints
            </h4>
            <ul className="text-xs text-gray-400 space-y-1 pl-4 list-disc">
              {memory.constraints.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-indigo-400" />
              Active Milestones
            </h4>
            <ul className="text-xs text-gray-400 space-y-1 pl-4 list-disc">
              {memory.milestones.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
