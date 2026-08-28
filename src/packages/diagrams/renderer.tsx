'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Loader2, AlertCircle } from 'lucide-react';

interface MermaidDiagramRendererProps {
  chart: string;
  className?: string;
}

/**
 * High-Performance Client-Side Mermaid SVG Renderer.
 * Applies the Cyber Void dark theme with electric indigo lines and cyan node borders.
 */
export function MermaidDiagramRenderer({ chart, className = '' }: MermaidDiagramRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Mermaid with Cyber Void theme configurations
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        darkMode: true,
        background: '#05050A',
        primaryColor: '#1e1b4b', // Deep Indigo
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#6366f1', // Electric Indigo
        lineColor: '#06b6d4', // Cyber Cyan
        secondaryColor: '#0f172a',
        tertiaryColor: '#09090b',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: '13px',
      },
      securityLevel: 'loose',
    });

    let isMounted = true;
    const renderId = `mermaid-svg-${Math.random().toString(36).substring(2, 9)}`;

    const renderChart = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { svg } = await mermaid.render(renderId, chart);
        if (isMounted) {
          setSvgContent(svg);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to parse Mermaid diagram');
          setIsLoading(false);
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-white/30 gap-2 font-mono text-xs">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span>Compiling Architecture Graph…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-danger gap-2 font-mono text-xs p-6 text-center">
        <AlertCircle className="w-6 h-6 text-danger" />
        <p className="font-bold">Diagram Render Error</p>
        <p className="text-[11px] text-white/50">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full flex items-center justify-center overflow-x-auto p-4 [&_svg]:max-w-full [&_svg]:h-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
