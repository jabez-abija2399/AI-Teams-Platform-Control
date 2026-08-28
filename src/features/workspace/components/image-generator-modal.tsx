'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  Sparkles,
  Image as ImageIcon,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Download,
  X,
  Layers,
  Wand2,
} from 'lucide-react';
import { GlassCard, NeonButton } from '@/packages/ui';
import {
  FreeImageGenerator,
  type ImageStylePreset,
  type ImageAspectRatio,
  type GeneratedImageResult,
  STOCK_CATEGORIES,
} from '@/packages/assets';

interface ImageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
}

const STYLE_OPTIONS: { id: ImageStylePreset; label: string }[] = [
  { id: 'cyberpunk', label: 'Cyberpunk Glow' },
  { id: 'photorealistic', label: 'Photorealistic' },
  { id: 'minimal-3d', label: 'Minimal 3D Art' },
  { id: 'vector-illustration', label: 'Vector Art' },
  { id: 'dark-ui', label: 'Dark UI Asset' },
];

const RATIO_OPTIONS: ImageAspectRatio[] = ['16:9', '4:3', '1:1', '9:16'];

export function ImageGeneratorModal({
  isOpen,
  onClose,
  projectName = 'My AI Project',
}: ImageGeneratorModalProps) {
  const [prompt, setPrompt] = useState(`Hero header image for ${projectName} modern SaaS application`);
  const [style, setStyle] = useState<ImageStylePreset>('cyberpunk');
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>('16:9');
  const [imageResult, setImageResult] = useState<GeneratedImageResult | null>(() =>
    FreeImageGenerator.generateImage({
      prompt: `Hero header image for ${projectName} modern SaaS application`,
      style: 'cyberpunk',
      aspectRatio: '16:9',
    }),
  );
  const [copiedType, setCopiedType] = useState<'markdown' | 'html' | 'url' | null>(null);

  if (!isOpen) return null;

  const handleGenerate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    const result = FreeImageGenerator.generateImage({
      prompt: prompt.trim(),
      style,
      aspectRatio,
      seed: Math.floor(Math.random() * 1000000),
    });
    setImageResult(result);
    toast.success('AI Image Generated', {
      description: 'Free high-res asset generated via Pollinations AI.',
    });
  };

  const copyToClipboard = (text: string, type: 'markdown' | 'html' | 'url') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    toast.success('Copied to Clipboard', {
      description: `${type.toUpperCase()} snippet ready to paste into code.`,
    });
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-3xl animate-fade-up">
        <GlassCard className="p-8 border-primary/30 bg-[#070710]/95 shadow-[0_0_60px_rgba(99,102,241,0.25)] relative overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-hide">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-md">
              <Wand2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Free AI Image & Asset Studio
                </h2>
                <span className="rounded-full bg-success/20 text-success border border-success/30 px-2 py-0.5 text-[9px] font-mono font-bold uppercase">
                  100% Free / No Key Required
                </span>
              </div>
              <p className="text-xs text-white/50">
                Generate instant high-resolution imagery and inject assets directly into your website.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Generation Controls */}
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Prompt Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-white/70">
                  Image Prompt & Subject
                </label>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you need for your website..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 backdrop-blur-md"
                />
              </div>

              {/* Style Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-white/70">
                  Art Style Preset
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setStyle(opt.id)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all text-left ${
                        style === opt.id
                          ? 'border-primary/80 bg-primary/20 text-white ring-1 ring-primary/60'
                          : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio Options */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-white/70">
                  Aspect Ratio
                </label>
                <div className="flex gap-2">
                  {RATIO_OPTIONS.map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                        aspectRatio === ratio
                          ? 'border-primary/80 bg-primary/20 text-white'
                          : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Trigger */}
              <NeonButton
                type="submit"
                variant="primary"
                className="w-full h-11 text-xs font-bold shadow-xl flex items-center justify-center gap-2 mt-2"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                <span>Generate Free AI Image</span>
              </NeonButton>
            </form>

            {/* Right Column: Live Image Preview & Snippet Exporters */}
            <div className="space-y-4 flex flex-col justify-between">
              {imageResult && (
                <>
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-2xl group min-h-[220px] flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageResult.url}
                      alt={imageResult.altText}
                      className="w-full h-auto object-cover max-h-[260px]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a
                        href={imageResult.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors"
                        title="Open Full Resolution"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Snippet Action Buttons */}
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <p className="text-[11px] font-mono text-white/50 uppercase tracking-wider">
                      Copy Snippet into Project:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(imageResult.markdownSnippet, 'markdown')}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono font-bold text-white transition-all"
                      >
                        {copiedType === 'markdown' ? (
                          <Check className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-primary" />
                        )}
                        <span>Markdown</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(imageResult.htmlSnippet, 'html')}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono font-bold text-white transition-all"
                      >
                        {copiedType === 'html' ? (
                          <Check className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-secondary" />
                        )}
                        <span>HTML &lt;img&gt;</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
