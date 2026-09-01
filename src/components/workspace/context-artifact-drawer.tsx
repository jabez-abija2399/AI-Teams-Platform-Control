'use client';

import React, { useState, useEffect } from 'react';
import { X, Layers, FileText, CheckCircle2, AlertCircle, Bookmark, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ContextArtifactDrawerProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ContextArtifactDrawer({ projectId, isOpen, onClose }: ContextArtifactDrawerProps) {
  const [activeTab, setActiveTab] = useState<'context' | 'artifacts' | 'traceability'>('context');
  const [matrixData, setMatrixData] = useState<any>(null);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      setLoading(true);
      Promise.all([
        fetch(`/api/projects/${projectId}/traceability`).then((r) => r.json()),
        fetch(`/api/projects/${projectId}/artifacts/versions`).then((r) => r.json()),
      ])
        .then(([traceRes, artRes]) => {
          if (traceRes.success) setMatrixData(traceRes.data);
          if (artRes.success) setArtifacts(artRes.data);
        })
        .catch((err) => console.error('Failed to load drawer context:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-gray-950 border-l border-gray-800 shadow-2xl flex flex-col font-sans text-gray-200 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/60">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h2 className="font-bold text-base text-white">Project Context & Artifacts</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 bg-gray-900/30 text-xs font-mono">
        <button
          onClick={() => setActiveTab('context')}
          className={`flex-1 py-3 px-4 text-center transition-colors border-b-2 ${
            activeTab === 'context'
              ? 'border-indigo-500 text-indigo-400 font-bold bg-indigo-500/5'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Context & Decisions
        </button>
        <button
          onClick={() => setActiveTab('artifacts')}
          className={`flex-1 py-3 px-4 text-center transition-colors border-b-2 ${
            activeTab === 'artifacts'
              ? 'border-indigo-500 text-indigo-400 font-bold bg-indigo-500/5'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Artifact Versions
        </button>
        <button
          onClick={() => setActiveTab('traceability')}
          className={`flex-1 py-3 px-4 text-center transition-colors border-b-2 ${
            activeTab === 'traceability'
              ? 'border-indigo-500 text-indigo-400 font-bold bg-indigo-500/5'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Traceability Matrix
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500 text-xs font-mono">
            Loading context drawer...
          </div>
        ) : activeTab === 'context' ? (
          <div className="space-y-6">
            {/* Architecture Decisions (ADRs) */}
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5" />
                Architecture Decision Records (ADRs)
              </h3>
              {matrixData?.adrs?.length > 0 ? (
                <div className="space-y-2">
                  {matrixData.adrs.map((adr: any) => (
                    <div key={adr.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-indigo-300 font-bold">{adr.adrNumber}</span>
                        <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 text-[10px]">
                          {adr.status}
                        </Badge>
                      </div>
                      <p className="font-medium text-white text-xs">{adr.title}</p>
                      <p className="text-gray-400 text-xs">{adr.decision}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">No ADRs recorded yet.</p>
              )}
            </div>

            {/* Design Decisions (DESs) */}
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-purple-400 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Design Decision Records (DESs)
              </h3>
              {matrixData?.dess?.length > 0 ? (
                <div className="space-y-2">
                  {matrixData.dess.map((des: any) => (
                    <div key={des.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-purple-300 font-bold">{des.desNumber}</span>
                        <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-[10px]">
                          {des.status}
                        </Badge>
                      </div>
                      <p className="font-medium text-white text-xs">{des.title}</p>
                      <p className="text-gray-400 text-xs">{des.decision}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">No DESs recorded yet.</p>
              )}
            </div>
          </div>
        ) : activeTab === 'artifacts' ? (
          <div className="space-y-3">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Domain Artifact Lineage
            </h3>
            {artifacts.length > 0 ? (
              artifacts.map((art) => (
                <div key={art.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-400">{art.artifactType}</span>
                    <Badge variant="outline" className="border-gray-700 text-gray-300 font-mono text-[10px]">
                      v{art.version}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-300">{art.contentSummary}</p>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono pt-1 border-t border-gray-800/60">
                    <span>Owner: {art.producerRole}</span>
                    <span>{new Date(art.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 italic">No artifact versions saved yet.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-lg p-3.5 flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">Requirements Verification Coverage</span>
              <span className="text-indigo-400 font-bold text-sm">{matrixData?.coveragePercentage ?? 0}%</span>
            </div>

            <div className="space-y-2">
              {matrixData?.requirements?.length > 0 ? (
                matrixData.requirements.map((req: any) => (
                  <div key={req.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-indigo-300 font-bold">{req.requirementId}</span>
                      {req.verificationStatus === 'VERIFIED' ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-400 font-mono text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5" /> Unverified
                        </span>
                      )}
                    </div>
                    <p className="text-gray-200 font-medium">{req.title}</p>
                    <div className="text-[11px] text-gray-400 font-mono space-y-0.5 pt-1">
                      <div>CEO Spec: v{req.ceoSpecVersion}</div>
                      {req.architectAdrId && <div>ADR: {req.architectAdrId}</div>}
                      {req.designerDesId && <div>DES: {req.designerDesId}</div>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic">No requirement traceability items found.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
