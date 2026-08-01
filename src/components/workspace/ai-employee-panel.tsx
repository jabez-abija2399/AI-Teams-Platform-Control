'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Bot, CheckCircle2, Clock, Loader2, UserCheck, Sparkles, Cpu, Zap, ShieldCheck } from 'lucide-react';
import type { AIEmployee } from '@/core/workspace/types';

interface AIEmployeePanelProps {
  employees: AIEmployee[];
  mode: 'creator' | 'developer';
}

export function AIEmployeePanel({ employees, mode }: AIEmployeePanelProps) {
  const getStatusBadge = (status: AIEmployee['status']) => {
    switch (status) {
      case 'Working':
      case 'Thinking':
        return (
          <Badge className="bg-indigo-500/15 text-indigo-300 dark:text-indigo-400 border border-indigo-500/40 px-2 py-0.5 text-[11px] font-medium flex items-center gap-1.5 shadow-sm shadow-indigo-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
            {status}
          </Badge>
        );
      case 'Completed':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-300 dark:text-emerald-400 border border-emerald-500/40 px-2 py-0.5 text-[11px] font-medium flex items-center gap-1.5 shadow-sm shadow-emerald-500/10">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Done
          </Badge>
        );
      case 'Waiting User':
        return (
          <Badge className="bg-amber-500/15 text-amber-300 dark:text-amber-400 border border-amber-500/40 px-2 py-0.5 text-[11px] font-medium flex items-center gap-1.5 shadow-sm shadow-amber-500/10">
            <UserCheck className="w-3 h-3 text-amber-400 animate-pulse" />
            Needs Review
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-800/40 text-gray-400 border-gray-700/60 px-2 py-0.5 text-[11px] font-medium flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-gray-500" />
            Standby
          </Badge>
        );
    }
  };

  const activeCount = employees.filter((e) => e.status === 'Working' || e.status === 'Thinking').length;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-950/90 via-slate-950/80 to-gray-950/90 backdrop-blur-2xl border-l border-white/10 dark:border-gray-800/80 p-6 space-y-5 text-white">
      {/* Premium Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 shadow-md">
            <Bot className="w-4 h-4 text-indigo-400" />
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
              </span>
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              AI Workforce Fleet
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h2>
            <p className="text-[11px] text-gray-400 font-medium">Autonomous Specialist Agents</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/5 border border-white/10 text-gray-300">
            <Zap className="w-3 h-3 text-amber-400 mr-1" />
            {activeCount} Active
          </span>
        </div>
      </div>

      {/* Specialist Cards List */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
        {employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-gray-800 rounded-xl bg-gray-900/20">
            <Bot className="w-8 h-8 text-gray-600 mb-2" />
            <p className="text-xs text-gray-400 font-medium">No AI employees currently active</p>
            <p className="text-[11px] text-gray-600 mt-0.5">Start a task to dispatch autonomous specialists</p>
          </div>
        ) : (
          employees.map((emp) => {
            const isWorking = emp.status === 'Working' || emp.status === 'Thinking';
            return (
              <div
                key={emp.id}
                className={`group relative rounded-xl p-4 transition-all duration-300 border ${
                  isWorking
                    ? 'bg-gradient-to-br from-indigo-950/40 via-gray-900/80 to-purple-950/20 border-indigo-500/40 shadow-lg shadow-indigo-500/5 hover:border-indigo-400/60 hover:-translate-y-0.5'
                    : 'bg-gray-900/50 hover:bg-gray-900/80 border-white/5 hover:border-white/15'
                }`}
              >
                {/* Glow bar for working agents */}
                {isWorking && (
                  <div className="absolute top-0 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent rounded-full animate-pulse" />
                )}

                {/* Card Header: Avatar & Status */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`relative w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-md transition-transform group-hover:scale-105 ${
                        isWorking
                          ? 'bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/50 ring-2 ring-indigo-500/20'
                          : 'bg-gray-800/80 border border-gray-700/80'
                      }`}
                    >
                      {emp.avatar}
                      {isWorking && (
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-gray-950 animate-pulse" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white group-hover:text-indigo-200 transition-colors flex items-center gap-1.5">
                        {emp.name}
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400/80" />
                      </h3>
                      <p className="text-[11px] text-gray-400 font-medium">{emp.role}</p>
                    </div>
                  </div>
                  {getStatusBadge(emp.status)}
                </div>

                {/* Current Task Description */}
                <div className="bg-black/30 rounded-lg p-2.5 border border-white/5 mb-3">
                  <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                    <span className="text-indigo-400 font-semibold mr-1.5">Task:</span>
                    {emp.currentTask || 'Waiting for next instruction...'}
                  </p>
                </div>

                {/* Progress Animation */}
                {isWorking && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400 font-medium flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-indigo-400 animate-spin" />
                        Execution Velocity
                      </span>
                      <span className="text-indigo-300 font-bold font-mono">{emp.progress}%</span>
                    </div>
                    <div className="relative w-full bg-gray-800/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out shadow-sm"
                        style={{ width: `${emp.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Developer Telemetry Bar */}
                {mode === 'developer' && (
                  <div className="mt-3 pt-2.5 border-t border-white/5 font-mono text-[10px] text-gray-400 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Health: <span className="text-emerald-300 font-semibold">{emp.health || '100%'}</span>
                      </span>
                    </div>
                    <span className="text-gray-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                      ID: {emp.role.toLowerCase()}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Fleet Telemetry Footer */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400 bg-black/20 p-2.5 rounded-lg border border-white/5">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Neural Link: <strong className="text-gray-200">Optimal</strong>
        </span>
        <span className="font-mono text-indigo-300">32.4k tok/sec</span>
      </div>
    </div>
  );
}
