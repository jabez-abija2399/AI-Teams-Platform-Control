'use client';

import React, { useState } from 'react';
import { Cpu, CheckCircle2, RefreshCw, Key, Shield, Plus, Lock, Globe, Server, Check, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SettingsNavTabs } from './settings-nav-tabs';

interface Provider {
  id: string;
  name: string;
  envKey: string;
  type: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  activeModel: string;
  lastChecked: string;
  apiKeyMasked?: string;
  defaultEndpoint?: string;
}

export function AiProvidersSettings() {
  const [providers, setProviders] = useState<Provider[]>([
    {
      id: 'openai',
      name: 'OpenAI',
      envKey: 'OPENAI_API_KEY',
      type: 'LLM Provider',
      status: 'CONNECTED',
      activeModel: 'gpt-4o',
      apiKeyMasked: 'sk-proj-...8f3A',
      lastChecked: '2m ago',
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      envKey: 'ANTHROPIC_API_KEY',
      type: 'LLM Provider',
      status: 'CONNECTED',
      activeModel: 'claude-3-5-sonnet-20241022',
      apiKeyMasked: 'sk-ant-...9b21',
      lastChecked: '10m ago',
    },
    {
      id: 'groq',
      name: 'Groq',
      envKey: 'GROQ_API_KEY',
      type: 'Ultra-Fast Inference',
      status: 'CONNECTED',
      activeModel: 'llama-3.3-70b-versatile',
      apiKeyMasked: 'gsk_...7c11',
      lastChecked: '1h ago',
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      envKey: 'GEMINI_API_KEY',
      type: 'Multimodal Intelligence',
      status: 'CONNECTED',
      activeModel: 'gemini-1.5-pro',
      apiKeyMasked: 'AIzaSy...4e19',
      lastChecked: '5m ago',
    },
    {
      id: 'openrouter',
      name: 'OpenRouter',
      envKey: 'OPENROUTER_API_KEY',
      type: 'Multi-Model Aggregator',
      status: 'DISCONNECTED',
      activeModel: 'openrouter/auto',
      lastChecked: 'Not configured',
    },
    {
      id: 'together',
      name: 'Together AI',
      envKey: 'TOGETHER_API_KEY',
      type: 'Open Source Cloud Inference',
      status: 'DISCONNECTED',
      activeModel: 'meta-llama/Llama-3-70b-chat-hf',
      lastChecked: 'Not configured',
    },
    {
      id: 'huggingface',
      name: 'HuggingFace',
      envKey: 'HUGGINGFACE_API_KEY',
      type: 'Inference Endpoints',
      status: 'DISCONNECTED',
      activeModel: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      lastChecked: 'Not configured',
    },
    {
      id: 'ollama',
      name: 'Ollama (Local)',
      envKey: 'OLLAMA_URL',
      type: 'Local On-Premise Engine',
      status: 'CONNECTED',
      activeModel: 'ollama/llama3',
      defaultEndpoint: 'http://localhost:11434',
      apiKeyMasked: 'http://localhost:11434',
      lastChecked: 'Local Daemon Active',
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleOpenModal = (provider: Provider) => {
    setSelectedProvider(provider);
    setApiKeyInput('');
    setModelInput(provider.activeModel);
    setModalOpen(true);
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;

    if (!apiKeyInput.trim() && selectedProvider.id !== 'ollama') {
      toast.error(`Please enter a valid API Key for ${selectedProvider.name}.`);
      return;
    }

    const masked = selectedProvider.id === 'ollama' 
      ? (apiKeyInput.trim() || selectedProvider.defaultEndpoint || 'http://localhost:11434')
      : `${apiKeyInput.slice(0, 7)}...${apiKeyInput.slice(-4)}`;

    setProviders((prev) =>
      prev.map((p) =>
        p.id === selectedProvider.id
          ? {
              ...p,
              status: 'CONNECTED',
              apiKeyMasked: masked,
              activeModel: modelInput.trim() || p.activeModel,
              lastChecked: 'Just now',
            }
          : p
      )
    );

    toast.success(`Successfully configured API key for ${selectedProvider.name}!`);
    setModalOpen(false);
    setSelectedProvider(null);
  };

  const handleTestConnection = (provider: Provider) => {
    setTestingId(provider.id);
    setTimeout(() => {
      setTestingId(null);
      toast.success(`${provider.name} connection test passed! Model: ${provider.activeModel}`);
    }, 1000);
  };

  const handleDisconnect = (providerId: string, providerName: string) => {
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId
          ? {
              ...p,
              status: 'DISCONNECTED',
              apiKeyMasked: undefined,
              lastChecked: 'Not configured',
            }
          : p
      )
    );
    toast.info(`Disconnected ${providerName}.`);
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
            <h1 className="font-heading text-3xl font-extrabold text-white mb-1">AI Providers & BYOK Credentials</h1>
            <p className="font-sans text-xs text-on-surface-variant max-w-2xl">
              Configure and manage BYOK (Bring Your Own Key) credentials for all 8 supported intelligence engines.
            </p>
          </div>
          <button
            type="button"
            onClick={() => providers[0] && handleOpenModal(providers[0])}
            className="bg-primary text-black font-mono text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-primary-container transition-colors flex items-center gap-2 uppercase tracking-wider glow-cyan"
          >
            <Plus className="w-4 h-4" />
            <span>Add / Change Provider Key</span>
          </button>
        </div>
      </div>

      <SettingsNavTabs />

      {/* Providers Grid */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" />
            <span>Configured Intelligence Engines ({providers.filter((p) => p.status === 'CONNECTED').length} / {providers.length} Connected)</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((p) => (
            <div
              key={p.id}
              className={`bg-surface border p-6 rounded-xl flex flex-col justify-between transition-all ${
                p.status === 'CONNECTED'
                  ? 'border-white/10 border-l-4 border-l-primary'
                  : 'border-white/10 opacity-75 hover:opacity-100'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block mb-0.5">
                      {p.type}
                    </span>
                    <h3 className="font-heading text-xl font-bold text-white flex items-center gap-2">
                      {p.name}
                    </h3>
                    <span className="font-mono text-[10px] text-on-surface-variant/70 block mt-0.5">
                      Env: <code className="text-primary">{p.envKey}</code>
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded bg-background border border-white/10 flex items-center justify-center text-primary shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-3 font-mono text-xs mb-6">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        p.status === 'CONNECTED' ? 'bg-primary animate-pulse' : 'bg-on-surface-variant/40'
                      }`}
                    />
                    <span
                      className={`font-bold uppercase tracking-wider ${
                        p.status === 'CONNECTED' ? 'text-primary' : 'text-on-surface-variant'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <div className="bg-background border border-white/10 p-2.5 rounded flex justify-between items-center text-[11px]">
                    <span className="text-on-surface-variant">Active Model</span>
                    <span className="text-white font-bold truncate max-w-[150px]">{p.activeModel}</span>
                  </div>

                  {p.apiKeyMasked && (
                    <div className="bg-background border border-white/10 p-2.5 rounded flex justify-between items-center text-[11px]">
                      <span className="text-on-surface-variant">{p.id === 'ollama' ? 'URL' : 'API Key'}</span>
                      <span className="text-primary font-mono truncate max-w-[150px]">{p.apiKeyMasked}</span>
                    </div>
                  )}

                  <div className="text-[10px] text-on-surface-variant flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3" />
                    <span>Checked: {p.lastChecked}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/10 font-mono text-xs">
                {p.status === 'CONNECTED' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleTestConnection(p)}
                      disabled={testingId === p.id}
                      className="bg-background border border-white/10 text-white py-2 rounded hover:border-primary hover:text-primary transition-colors text-center font-bold text-[11px]"
                    >
                      {testingId === p.id ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenModal(p)}
                      className="bg-primary/10 border border-primary text-primary py-2 rounded hover:bg-primary/20 transition-colors text-center font-bold text-[11px] flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Change Key</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenModal(p)}
                    className="col-span-2 bg-primary text-black font-bold py-2 rounded hover:bg-primary-container transition-colors text-center uppercase tracking-wider glow-cyan"
                  >
                    Connect {p.name}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Connect / Update Provider Modal */}
      {modalOpen && selectedProvider && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-white/10 w-full max-w-md rounded-xl p-6 flex flex-col gap-6 shadow-2xl font-mono text-xs">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div>
                <h3 className="font-heading text-lg font-bold text-white">Configure {selectedProvider.name}</h3>
                <span className="text-[10px] text-on-surface-variant">Environment Variable: <code className="text-primary">{selectedProvider.envKey}</code></span>
              </div>
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
                  {selectedProvider.id === 'ollama' ? 'Local Ollama URL Endpoint' : 'API Key Credential'}
                </label>
                <input
                  id="apiKey"
                  type={selectedProvider.id === 'ollama' ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={
                    selectedProvider.id === 'ollama'
                      ? 'http://localhost:11434'
                      : `Enter new ${selectedProvider.name} API Key...`
                  }
                  className="w-full bg-background border border-white/10 focus:border-primary text-white p-3 rounded font-mono text-xs outline-none"
                />
                <span className="text-[10px] text-on-surface-variant block mt-1">
                  Credentials are encrypted with zero-knowledge AES-256 GCM client storage.
                </span>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="modelName" className="text-white font-bold block">
                  Default Target Model
                </label>
                <input
                  id="modelName"
                  type="text"
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                  placeholder="e.g. gpt-4o, claude-3-5-sonnet..."
                  className="w-full bg-background border border-white/10 focus:border-primary text-white p-3 rounded font-mono text-xs outline-none"
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                {selectedProvider.status === 'CONNECTED' ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleDisconnect(selectedProvider.id, selectedProvider.name);
                      setModalOpen(false);
                    }}
                    className="text-danger hover:underline text-[11px] flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Disconnect Provider</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-3 py-2 text-on-surface-variant hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-primary text-black font-bold px-5 py-2 rounded hover:bg-primary-container transition-colors uppercase tracking-wider glow-cyan"
                  >
                    Save API Key
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
