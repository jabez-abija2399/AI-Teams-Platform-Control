'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Tablet, Smartphone, RefreshCw, Loader2, ExternalLink, AlertCircle, Play } from 'lucide-react';
import { clsx } from 'clsx';
import { BuildStatus } from '@/hooks/use-ai-build-stream';
import { useWebContainerPreview, type WCStatus } from '@/hooks/use-webcontainer-preview';
import { ExecutionProgressMapper } from '@/features/creator-experience/services/execution-progress.mapper';

interface PreviewIframeProps {
  previewUrl: string | null;
  status: BuildStatus;
  progress: number;
  currentStep: string;
  projectId?: string;
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile';
type PreviewSource = 'none' | 'fetching' | 'inline' | 'webcontainer' | 'e2b-tunnel' | 'build-stream';

const WC_LABELS: Record<WCStatus, string> = {
  IDLE: 'Idle',
  BOOTING: 'Booting WebContainer...',
  MOUNTING: 'Mounting files...',
  INSTALLING: 'npm install...',
  STARTING: 'Starting dev server...',
  READY: 'Ready',
  ERROR: 'Error',
};

export function PreviewIframe({ previewUrl, status, progress, currentStep, projectId }: PreviewIframeProps) {
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [key, setKey] = useState(0);
  const [inlineHtml, setInlineHtml] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const wc = useWebContainerPreview();
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => { 
      mountedRef.current = false; 
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchPreview = async () => {
    if (!projectId) return;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setApiStatus('loading');
    setApiError(null);
    try {
      const res = await fetch(`/api/preview/${projectId}`, { signal: controller.signal });
      if (!mountedRef.current) return;
      if (!res.ok) throw new Error('Bad response');
      const result = await res.json();
      if (!mountedRef.current) return;
      if (result.data?.html) setInlineHtml(result.data.html);
      if (result.data?.files) {
        wc.start(result.data.files).catch(() => {});
      }
      setApiStatus('loaded');
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      if (!mountedRef.current) return;
      setApiStatus('error');
      setApiError('Failed to fetch preview. The preview server may be unavailable.');
    }
  };

  useEffect(() => {
    if (!projectId) return;
    fetchPreview();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
    if (!inlineHtml && !wc.previewUrl && !previewUrl) {
      fetchPreview();
    }
  };

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile':
        return 'w-[375px]';
      case 'tablet':
        return 'w-[768px]';
      default:
        return 'w-full';
    }
  };

  const isBuilding = status !== 'INITIALIZING' && (status === 'ARCHITECT_PLANNING' || status === 'GENERATING_CODE' || status === 'QA_VERIFYING') && progress > 0;
  const effectiveUrl = wc.previewUrl || previewUrl;

  const previewSource: PreviewSource =
    isBuilding ? 'build-stream' :
    effectiveUrl && wc.status === 'READY' ? 'webcontainer' :
    effectiveUrl ? 'e2b-tunnel' :
    inlineHtml ? 'inline' :
    apiStatus === 'loading' ? 'fetching' :
    'none';

  return (
    <div className="h-full w-full flex flex-col bg-slate-950 border-l border-slate-800/80">
      {/* Header Bar */}
      <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">Live Preview</span>

          {/* Build stream progress */}
          {isBuilding && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-sky-950/60 border border-sky-800 text-sky-400 text-[10px] rounded-full">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{currentStep} ({progress}%)</span>
            </div>
          )}

          {/* WebContainer ready */}
          {wc.status === 'READY' && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-[10px] rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Server</span>
            </div>
          )}

          {/* Inline preview active */}
          {previewSource === 'inline' && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-sky-950/60 border border-sky-800 text-sky-400 text-[10px] rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>Inline Preview</span>
            </div>
          )}

          {/* WC booting in background (subtle) */}
          {wc.status !== 'IDLE' && wc.status !== 'READY' && wc.status !== 'ERROR' && previewSource !== 'none' && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-950/60 border border-amber-800 text-amber-400 text-[10px] rounded-full">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{WC_LABELS[wc.status]}</span>
            </div>
          )}

          {/* WC status when nothing else is showing */}
          {wc.status !== 'IDLE' && wc.status !== 'READY' && previewSource === 'none' && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-950/60 border border-amber-800 text-amber-400 text-[10px] rounded-full">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{WC_LABELS[wc.status]}</span>
            </div>
          )}

          {/* API fetching indicator */}
          {apiStatus === 'loading' && previewSource === 'fetching' && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded-full">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Loading...</span>
            </div>
          )}
        </div>

        {/* Viewport & Controls */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800">
          <button
            onClick={() => setShowLogs((prev) => !prev)}
            className={clsx(
              'p-1.5 rounded transition-colors text-xs flex items-center gap-1',
              showLogs ? 'bg-slate-800 text-sky-400' : 'text-slate-500 hover:text-slate-300'
            )}
            title="Toggle Server Logs"
          >
            <AlertCircle className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('desktop')}
            className={clsx(
              'p-1.5 rounded transition-colors text-xs',
              viewport === 'desktop' ? 'bg-slate-800 text-sky-400' : 'text-slate-500 hover:text-slate-300'
            )}
            title="Desktop View"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={clsx(
              'p-1.5 rounded transition-colors text-xs',
              viewport === 'tablet' ? 'bg-slate-800 text-sky-400' : 'text-slate-500 hover:text-slate-300'
            )}
            title="Tablet View"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={clsx(
              'p-1.5 rounded transition-colors text-xs',
              viewport === 'mobile' ? 'bg-slate-800 text-sky-400' : 'text-slate-500 hover:text-slate-300'
            )}
            title="Mobile View"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-4 bg-slate-800 mx-1" />
          <button
            onClick={handleRefresh}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded transition-colors"
            title="Refresh Preview"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', apiStatus === 'loading' && 'animate-spin')} />
          </button>
          <a
            href={effectiveUrl || (projectId ? `/preview/${projectId}` : '#')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2 py-1 text-slate-300 hover:text-white rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/90 transition-colors text-xs font-semibold shadow-xs"
            title="Open preview in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden sm:inline">New Tab</span>
          </a>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 bg-slate-900/50 p-4 flex items-center justify-center overflow-auto relative">
        {/* Build stream overlay */}
        {isBuilding && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
            <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400 mb-4 animate-bounce">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
            <h4 className="text-base font-bold text-slate-100 mb-1">
              {ExecutionProgressMapper.mapToFriendlyTitle(currentStep || status)}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              AI Team is coordinating software creation
            </p>
            <div className="w-56 h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 font-mono mt-2">{Math.round(progress)}%</span>
          </div>
        )}

        {/* WC loading overlay always shows while booting to cover potentially broken inline HTML */}
        {wc.status !== 'IDLE' && wc.status !== 'READY' && wc.status !== 'ERROR' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-10 flex flex-col items-center justify-center p-6 text-center">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-4" />
            <h4 className="text-sm font-semibold text-slate-200 mb-1">{WC_LABELS[wc.status]}</h4>
            <p className="text-xs text-slate-400">Preparing live server environment...</p>
            <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden mt-4 mb-4">
              <div className="h-full bg-amber-500 animate-pulse transition-all duration-300" style={{ width: '60%' }} />
            </div>
            <button onClick={() => setShowLogs(true)} className="text-[10px] text-amber-500 hover:text-amber-400 underline font-mono bg-amber-500/10 px-3 py-1.5 rounded-full transition-colors">
              View Boot Logs
            </button>
          </div>
        )}

        {/* Server Logs Overlay */}
        {showLogs && (
          <div className="absolute inset-0 bg-slate-950/95 z-20 flex flex-col font-mono text-[11px] border border-slate-800">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900">
              <span className="text-slate-300 font-semibold flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" />
                Live Server Logs
              </span>
              <div className="flex gap-2">
                <button onClick={() => wc.clearLogs()} className="text-slate-500 hover:text-slate-300">Clear</button>
                <button onClick={() => setShowLogs(false)} className="text-slate-500 hover:text-slate-300">Close</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-3 space-y-1 select-text">
              {wc.terminalLogs.length === 0 ? (
                <div className="text-slate-600 italic">No server logs...</div>
              ) : (
                wc.terminalLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-600 select-none text-[10px] pt-0.5 whitespace-nowrap">{log.timestamp}</span>
                    <span className={clsx(
                      'flex-1 whitespace-pre-wrap break-all',
                      log.source === 'stderr' ? 'text-red-400' : log.source === 'system' ? 'text-sky-400 font-semibold' : 'text-slate-300'
                    )}>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Preview iframe */}
        <div className={clsx('h-full transition-all duration-300 shadow-2xl rounded-lg overflow-hidden border border-slate-800', effectiveUrl || inlineHtml ? 'bg-white' : 'bg-slate-950', getViewportWidth())}>
          {apiStatus === 'loading' ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
              <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-4" />
              <p className="text-sm text-slate-300 font-medium">Loading preview...</p>
              <p className="text-xs text-slate-600 mt-1">Fetching project files and building preview.</p>
            </div>
          ) : apiStatus === 'error' ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
              <p className="text-sm text-slate-300 font-medium">Preview unavailable</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">{apiError || 'Could not load preview data.'}</p>
              <button
                onClick={fetchPreview}
                className="mt-4 flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-md transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : wc.status === 'ERROR' ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center bg-slate-950">
              <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
              <p className="text-sm text-slate-300 font-medium">WebContainer Error</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">{wc.error || 'The live dev server crashed.'}</p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => wc.retry()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-md transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Retry Step</span>
                </button>
                <button
                  onClick={() => setShowLogs(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-md transition-colors"
                >
                  <span>Logs</span>
                </button>
              </div>
            </div>
          ) : effectiveUrl || inlineHtml ? (
            <iframe
              key={key}
              src={effectiveUrl || undefined}
              srcDoc={(!effectiveUrl && inlineHtml) ? inlineHtml : undefined}
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-presentation"
              className="w-full h-full border-none"
              title="Preview"
            />
          ) : apiStatus === 'loaded' ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
              <Monitor className="w-12 h-12 mb-3 text-slate-700" />
              <p className="text-sm text-slate-300 font-medium">No preview content</p>
              <p className="text-xs text-slate-600 mt-1 max-w-xs">The preview API returned no content. Trigger a build to generate files.</p>
              <button
                onClick={fetchPreview}
                className="mt-4 flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-md transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
              <Monitor className="w-12 h-12 mb-3 text-slate-700" />
              <p className="text-sm text-slate-300 font-medium">No preview available</p>
              <p className="text-xs text-slate-600 mt-1 max-w-xs">
                {projectId
                  ? 'No project files found. Use the build prompt to generate code.'
                  : 'Open a project to see its live preview here.'}
              </p>
              {projectId && (
                <button
                  onClick={fetchPreview}
                  className="mt-4 flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-md transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Load Preview</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status bar footer */}
      <div className="h-6 px-3 bg-slate-900 border-t border-slate-800 flex items-center gap-3 text-[10px] text-slate-500 font-mono shrink-0">
        {previewSource === 'webcontainer' && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-emerald-400 font-medium">WebContainer</span>
          </span>
        )}
        {previewSource === 'e2b-tunnel' && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-emerald-400 font-medium">E2B Tunnel</span>
          </span>
        )}
        {previewSource === 'inline' && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span className="text-sky-400 font-medium">Inline Preview</span>
          </span>
        )}
        {previewSource === 'build-stream' && (
          <span className="flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin text-sky-400" />
            <span className="text-sky-400 font-medium">Building...</span>
          </span>
        )}
        {previewSource === 'fetching' && (
          <span className="flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
            <span className="text-amber-400 font-medium">Fetching project data...</span>
          </span>
        )}
        {previewSource === 'none' && !apiStatus && (
          <span className="text-slate-600">Waiting for project...</span>
        )}
        {wc.status !== 'IDLE' && wc.status !== 'READY' && wc.status !== 'ERROR' && previewSource !== 'none' && (
          <span className="text-amber-400/70">{WC_LABELS[wc.status]}</span>
        )}
        {apiStatus === 'error' && (
          <span className="text-red-400">API error — click Retry</span>
        )}
        {wc.status === 'ERROR' && (
          <span className="text-red-400">WebContainer error</span>
        )}
        {viewport !== 'desktop' && (
          <span className="text-slate-600">{viewport} view</span>
        )}
      </div>
    </div>
  );
}