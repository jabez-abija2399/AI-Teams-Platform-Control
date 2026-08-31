'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Terminal, RotateCcw } from 'lucide-react';

interface WorkspaceErrorViewProps {
  errorMessage?: string;
  fileName?: string;
  onRetry?: () => void;
}

export function WorkspaceErrorView({
  errorMessage = 'BUILD FAILED: The current implementation needs attention.',
  fileName = 'components/StudyGroup.tsx',
  onRetry,
}: WorkspaceErrorViewProps) {
  return (
    <div className="w-full h-full bg-background text-on-background flex flex-col p-6 font-mono text-xs">
      {/* Error Header Banner */}
      <div className="bg-danger/10 border-l-4 border-danger border border-danger/30 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5 text-danger font-bold">
          <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
          <span>{errorMessage}</span>
        </div>
        <div className="flex items-center gap-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="bg-danger text-white font-bold px-4 py-2 rounded-lg hover:bg-danger/80 transition-colors uppercase tracking-wider flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Execution</span>
            </button>
          )}
        </div>
      </div>

      {/* Code Diagnostic Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Code Inspector */}
        <div className="lg:col-span-2 bg-surface border border-white/10 rounded-xl overflow-hidden flex flex-col">
          <div className="bg-background px-4 py-2.5 border-b border-white/10 flex justify-between items-center text-on-surface-variant">
            <span className="text-white font-bold">{fileName}</span>
            <span className="text-danger font-bold uppercase text-[10px]">DIAGNOSTIC ERROR</span>
          </div>
          <div className="p-4 bg-background flex-1 text-on-surface-variant space-y-1 font-mono text-xs overflow-auto">
            <div>40 | const renderParticipants = () =&gt; &#123;</div>
            <div>41 | return (</div>
            <div className="bg-danger/20 text-danger px-2 py-1 border-l-2 border-danger font-bold">
              42 | &lt;div className="flex gap-2"&gt;
            </div>
            <div className="bg-danger/20 text-danger px-2 py-1 border-l-2 border-danger font-bold">
              43 | &#123;participants.map(p =&gt; &lt;Avatar key=&#123;p.id&#125; user=&#123;p&#125; /&gt;)&#125;
            </div>
            <div className="text-danger text-[10px] pl-6 italic">Expected closing tag '&lt;/div&gt;'</div>
            <div>44 | &lt;/div&gt;</div>
            <div>45 | )</div>
          </div>
        </div>

        {/* Agent Telemetry Sidebar */}
        <div className="bg-surface border border-white/10 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="border-b border-white/10 pb-3 mb-4 flex justify-between items-center">
              <span className="text-white font-bold">AGENT TELEMETRY</span>
              <span className="text-danger bg-danger/10 border border-danger/30 px-2 py-0.5 rounded text-[10px] font-bold">
                ERROR
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                  ACTIVE ROLE
                </span>
                <p className="text-white font-bold">Developer Agent</p>
              </div>
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                  CURRENT TASK
                </span>
                <p className="text-on-surface-variant text-xs">
                  Refactoring JSX layout structure and updating component dependencies.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onRetry}
            className="w-full bg-surface border border-white/10 text-white hover:border-primary hover:text-primary py-2.5 rounded-lg transition-colors font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 mt-6"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reboot Developer Agent</span>
          </button>
        </div>
      </div>
    </div>
  );
}
