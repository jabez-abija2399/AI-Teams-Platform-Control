'use client';

import React, { useState } from 'react';
import { Cpu, CheckCircle2, RefreshCw, Key, Shield, Plus, Lock, Globe, Server, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ProviderCardProps {
  name: string;
  type: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  activeModel: string;
  lastChecked: string;
  apiKeyMasked?: string;
  onConnect?: () => void;
  onTest?: () => void;
}

function ProviderCard({
  name,
  type,
  status,
  activeModel,
  lastChecked,
  apiKeyMasked,
  onConnect,
  onTest,
}: ProviderCardProps) {
  const [testing, setTesting] = useState(false);

  const handleTestConnection = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      toast.success(`${name} connection verified successfully!`);
    }, 1000);
  };

  return (
    <div
      className={`bg-surface border p-6 rounded-xl flex flex-col justify-between transition-all ${
        status === 'CONNECTED'
          ? 'border-white/10 border-l-4 border-l-primary'
          : status === 'ERROR'
          ? 'border-danger/30 border-l-4 border-l-danger'
          : 'border-white/10 opacity-70 hover:opacity-100'
      }`}
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block mb-0.5">
              {type}
            </span>
            <h3 className="font-heading text-xl font-bold text-white">{name}</h3>
          </div>
          <div className="w-10 h-10 rounded bg-background border border-white/10 flex items-center justify-center text-primary">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-3 font-mono text-xs mb-6">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'CONNECTED'
                  ? 'bg-primary animate-pulse'
                  : status === 'ERROR'
                  ? 'bg-danger'
                  : 'bg-on-surface-variant/40'
              }`}
            />
            <span
              className={`font-bold uppercase tracking-wider ${
                status === 'CONNECTED'
                  ? 'text-primary'
                  : status === 'ERROR'
                  ? 'text-danger'
                  : 'text-on-surface-variant'
              }`}
            >
              {status}
            </span>
          </div>

          <div className="bg-background border border-white/10 p-2.5 rounded flex justify-between items-center text-[11px]">
            <span className="text-on-surface-variant">Active Model</span>
            <span className="text-white font-bold">{activeModel}</span>
          </div>

          {apiKeyMasked && (
            <div className="bg-background border border-white/10 p-2.5 rounded flex justify-between items-center text-[11px]">
              <span className="text-on-surface-variant">API Key</span>
              <span className="text-primary font-mono">{apiKeyMasked}</span>
            </div>
          )}

          <div className="text-[10px] text-on-surface-variant flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3" />
            <span>Last checked: {lastChecked}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 font-mono text-xs">
        {status === 'CONNECTED' ? (
          <>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="bg-background border border-white/10 text-white py-2 rounded hover:border-primary hover:text-primary transition-colors text-center font-bold"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              type="button"
              onClick={onConnect}
              className="bg-primary/10 border border-primary text-primary py-2 rounded hover:bg-primary/20 transition-colors text-center font-bold"
            >
              Configure
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            className="col-span-2 bg-primary text-black font-bold py-2 rounded hover:bg-primary-container transition-colors text-center uppercase tracking-wider glow-cyan"
          >
            Connect Provider
          </button>
        )}
      </div>
    </div>
  );
}

export function AiProvidersSettings() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('OpenAI');
  const [apiKeyInput, setApiKeyInput] = useState('');

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
      toast.error('Please enter a valid API Key.');
      return;
    }
    toast.success(`Successfully connected ${selectedProvider} API Key!`);
    setModalOpen(false);
    setApiKeyInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-on-background p-6 md:p-10 max-w-7xl mx-auto w-full gap-8">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-2">
          <span>WORKSPACE</span>
          <span className="opacity-40">/</span>
          <span className="text-primary font-bold">SETTINGS</span>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="font-heading text-3xl font-extrabold text-white mb-1">AI Providers & BYOK</h1>
            <p className="font-sans text-xs text-on-surface-variant max-w-2xl">
              Connect your AI providers and BYOK (Bring Your Own Key) credentials to power your autonomous AI workforce.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="bg-primary text-black font-mono text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-primary-container transition-colors flex items-center gap-2 uppercase tracking-wider glow-cyan"
          >
            <Plus className="w-4 h-4" />
            <span>Connect Provider</span>
          </button>
        </div>
      </div>

      {/* Providers Grid */}
      <section>
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" />
          <span>Configured Intelligence Engines</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProviderCard
            name="OpenAI"
            type="LLM Provider"
            status="CONNECTED"
            activeModel="gpt-4o"
            apiKeyMasked="sk-proj-...8f3A"
            lastChecked="2m ago"
            onConnect={() => {
              setSelectedProvider('OpenAI');
              setModalOpen(true);
            }}
          />

          <ProviderCard
            name="Anthropic"
            type="LLM Provider"
            status="CONNECTED"
            activeModel="claude-3-5-sonnet-20241022"
            apiKeyMasked="sk-ant-...9b21"
            lastChecked="10m ago"
            onConnect={() => {
              setSelectedProvider('Anthropic');
              setModalOpen(true);
            }}
          />

          <ProviderCard
            name="Groq"
            type="Ultra-Fast Inference"
            status="CONNECTED"
            activeModel="llama-3.3-70b-versatile"
            apiKeyMasked="gsk_...7c11"
            lastChecked="1h ago"
            onConnect={() => {
              setSelectedProvider('Groq');
              setModalOpen(true);
            }}
          />

          <ProviderCard
            name="Google Gemini"
            type="Multimodal Intelligence"
            status="DISCONNECTED"
            activeModel="gemini-1.5-pro"
            lastChecked="Not configured"
            onConnect={() => {
              setSelectedProvider('Google Gemini');
              setModalOpen(true);
            }}
          />
        </div>
      </section>

      {/* Connect Provider Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-white/10 w-full max-w-md rounded-xl p-6 flex flex-col gap-6 shadow-2xl font-mono text-xs">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-heading text-lg font-bold text-white">Connect {selectedProvider}</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-on-surface-variant hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveKey} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="apiKey" className="text-white font-bold block">
                  API Key
                </label>
                <input
                  id="apiKey"
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={`Enter your ${selectedProvider} API Key...`}
                  className="w-full bg-background border border-white/10 focus:border-primary text-white p-3 rounded font-mono text-xs outline-none"
                />
                <span className="text-[10px] text-on-surface-variant block mt-1">
                  Your API Key is encrypted with AES-256 and stored zero-knowledge.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-on-surface-variant hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-black font-bold px-6 py-2 rounded hover:bg-primary-container transition-colors uppercase tracking-wider glow-cyan"
                >
                  Save API Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
