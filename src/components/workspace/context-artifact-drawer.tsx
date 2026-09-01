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
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#131313] border-l border-[#3c4949] shadow-2xl flex flex-col font-sans text-[#e2e2e2] animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[#3c4949] flex items-center justify-between bg-[#1b1b1b]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#56d9d9]" />
          <h2 className="font-bold text-sm text-[#e2e2e2] font-sans">Project Context & Artifacts</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-[#bbc9c8] hover:text-[#56d9d9] h-7 w-7 rounded-sm">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#3c4949] bg-[#131313] text-xs font-mono">
        <button
          onClick={() => setActiveTab('context')}
          className={`flex-1 py-2.5 px-3 text-center transition-colors border-b-2 text-[11px] ${
            activeTab === 'context'
              ? 'border-[#56d9d9] text-[#56d9d9] font-bold bg-[#56d9d9]/5'
              : 'border-transparent text-[#bbc9c8] hover:text-[#e2e2e2]'
          }`}
        >
          Decisions
        </button>
        <button
          onClick={() => setActiveTab('artifacts')}
          className={`flex-1 py-2.5 px-3 text-center transition-colors border-b-2 text-[11px] ${
            activeTab === 'artifacts'
              ? 'border-[#56d9d9] text-[#56d9d9] font-bold bg-[#56d9d9]/5'
              : 'border-transparent text-[#bbc9c8] hover:text-[#e2e2e2]'
          }`}
        >
          Artifacts
        </button>
        <button
          onClick={() => setActiveTab('traceability')}
          className={`flex-1 py-2.5 px-3 text-center transition-colors border-b-2 text-[11px] ${
            activeTab === 'traceability'
              ? 'border-[#56d9d9] text-[#56d9d9] font-bold bg-[#56d9d9]/5'
              : 'border-transparent text-[#bbc9c8] hover:text-[#e2e2e2]'
          }`}
        >
          Traceability
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-[#869393] text-xs font-mono">
            Loading context drawer...
          </div>
        ) : activeTab === 'context' ? (
          <div className="space-y-5">
            {/* Architecture Decisions (ADRs) */}
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#56d9d9] mb-2.5 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5" />
                Architecture Decision Records (ADRs)
              </h3>
              {matrixData?.adrs?.length > 0 ? (
                <div className="space-y-2">
                  {matrixData.adrs.map((adr: any) => (
                    <div key={adr.id} className="bg-[#1b1b1b] border border-[#3c4949] rounded-sm p-3 space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#56d9d9] font-bold">{adr.adrNumber}</span>
                        <span className="border border-[#56d9d9]/30 text-[#56d9d9] bg-[#56d9d9]/10 text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase">
                          {adr.status}
                        </span>
                      </div>
                      <p className="font-bold text-[#e2e2e2] text-xs font-sans">{adr.title}</p>
                      <p className="text-[#bbc9c8] text-xs font-mono">{adr.decision}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#869393] italic font-mono">No ADRs recorded yet.</p>
              )}
            </div>

            {/* Design Decisions (DESs) */}
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#56d9d9] mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Design Decision Records (DESs)
              </h3>
              {matrixData?.dess?.length > 0 ? (
                <div className="space-y-2">
                  {matrixData.dess.map((des: any) => (
                    <div key={des.id} className="bg-[#1b1b1b] border border-[#3c4949] rounded-sm p-3 space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#56d9d9] font-bold">{des.desNumber}</span>
                        <span className="border border-[#56d9d9]/30 text-[#56d9d9] bg-[#56d9d9]/10 text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase">
                          {des.status}
                        </span>
                      </div>
                      <p className="font-bold text-[#e2e2e2] text-xs font-sans">{des.title}</p>
                      <p className="text-[#bbc9c8] text-xs font-mono">{des.decision}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#869393] italic font-mono">No DESs recorded yet.</p>
              )}
            </div>
          </div>
        ) : activeTab === 'artifacts' ? (
          <div className="space-y-2.5">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#869393] mb-2">
              Domain Artifact Lineage
            </h3>
            {artifacts.length > 0 ? (
              artifacts.map((art) => (
                <div key={art.id} className="bg-[#1b1b1b] border border-[#3c4949] rounded-sm p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#56d9d9]">{art.artifactType}</span>
                    <span className="border border-[#3c4949] text-[#bbc9c8] font-mono text-[9px] px-1.5 py-0.5 rounded-sm">
                      v{art.version}
                    </span>
                  </div>
                  <p className="text-xs text-[#e2e2e2] font-mono">{art.contentSummary}</p>
                  <div className="flex items-center justify-between text-[10px] text-[#869393] font-mono pt-1 border-t border-[#3c4949]">
                    <span>Owner: {art.producerRole}</span>
                    <span>{new Date(art.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#869393] italic font-mono">No artifact versions saved yet.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-[#1b1b1b] border border-[#3c4949] rounded-sm p-3 flex items-center justify-between text-xs font-mono">
              <span className="text-[#bbc9c8]">Requirements Coverage</span>
              <span className="text-[#56d9d9] font-bold text-sm">{matrixData?.coveragePercentage ?? 0}%</span>
            </div>

            <div className="space-y-2">
              {matrixData?.requirements?.length > 0 ? (
                matrixData.requirements.map((req: any) => (
                  <div key={req.id} className="bg-[#1b1b1b] border border-[#3c4949] rounded-sm p-3 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[#56d9d9] font-bold">{req.requirementId}</span>
                      {req.verificationStatus === 'VERIFIED' ? (
                        <span className="flex items-center gap-1 text-[#56d9d9] font-mono text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#56d9d9]" /> Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[#e1824e] font-mono text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5 text-[#e1824e]" /> Unverified
                        </span>
                      )}
                    </div>
                    <p className="text-[#e2e2e2] font-medium font-sans">{req.title}</p>
                    <div className="text-[10px] text-[#869393] font-mono space-y-0.5 pt-1">
                      <div>CEO Spec: v{req.ceoSpecVersion}</div>
                      {req.architectAdrId && <div>ADR: {req.architectAdrId}</div>}
                      {req.designerDesId && <div>DES: {req.designerDesId}</div>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#869393] italic font-mono">No requirement traceability items found.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
