'use client';

import { useState, useMemo } from 'react';
import {
  Zap,
  Play,
  Pause,
  AlertTriangle,
  Bot,
  Globe,
  Settings,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { WorkflowNode, WorkflowEdge, NodeType } from '../types';

interface WorkflowCanvasProps {
  projectId: string;
}

const NODE_TEMPLATES: Array<{ type: NodeType; label: string; icon: typeof Zap; color: string }> = [
  { type: 'trigger', label: 'Trigger', icon: Zap, color: 'bg-emerald-100 border-emerald-300 text-emerald-700' },
  { type: 'ai_agent', label: 'AI Agent', icon: Bot, color: 'bg-violet-100 border-violet-300 text-violet-700' },
  { type: 'action', label: 'Action', icon: Play, color: 'bg-blue-100 border-blue-300 text-blue-700' },
  { type: 'condition', label: 'Condition', icon: AlertTriangle, color: 'bg-amber-100 border-amber-300 text-amber-700' },
  { type: 'deploy', label: 'Deploy', icon: Globe, color: 'bg-rose-100 border-rose-300 text-rose-700' },
  { type: 'webhook', label: 'Webhook', icon: Settings, color: 'bg-cyan-100 border-cyan-300 text-cyan-700' },
  { type: 'output', label: 'Output', icon: Play, color: 'bg-slate-100 border-slate-300 text-slate-700' },
];

export function WorkflowCanvas({ projectId }: WorkflowCanvasProps) {
  const [pipelineName, setPipelineName] = useState('New Pipeline');
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectSource, setConnectSource] = useState<string | null>(null);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  function addNode(type: NodeType) {
    const id = `node_${Date.now()}`;
    const template = NODE_TEMPLATES.find((t) => t.type === type);
    setNodes((prev) => [
      ...prev,
      {
        id,
        type,
        label: template?.label || type,
        x: 100 + prev.length * 160,
        y: 100 + Math.random() * 100,
        config: {},
      },
    ]);
  }

  function deleteNode(id: string) {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  }

  function handleNodeClick(id: string) {
    if (connectSource) {
      if (connectSource !== id) {
        const edgeId = `edge_${Date.now()}`;
        setEdges((prev) => [
          ...prev,
          { id: edgeId, source: connectSource, target: id },
        ]);
      }
      setConnectSource(null);
    } else {
      setSelectedNodeId(id === selectedNodeId ? null : id);
    }
  }

  function startConnect() {
    if (selectedNodeId) {
      setConnectSource(selectedNodeId);
    }
  }

  function getTemplate(type: NodeType) {
    return NODE_TEMPLATES.find((t) => t.type === type) || NODE_TEMPLATES[0];
  }

  function renderEdges() {
    return edges.map((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (!sourceNode || !targetNode) return null;

      const sx = sourceNode.x + 80;
      const sy = sourceNode.y + 25;
      const tx = targetNode.x + 80;
      const ty = targetNode.y + 25;

      const mx = (sx + tx) / 2;
      const my = (sy + ty) / 2;

      return (
        <g key={edge.id}>
          <path
            d={`M ${sx} ${sy} Q ${mx} ${sy} ${tx} ${ty}`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            markerEnd="url(#arrow)"
          />
          <circle
            cx={tx}
            cy={ty}
            r="4"
            fill="#94a3b8"
          />
        </g>
      );
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Input
          value={pipelineName}
          onChange={(e) => setPipelineName(e.target.value)}
          className="h-7 text-sm font-medium border-none shadow-none focus-visible:ring-0 max-w-[200px]"
        />
        <div className="flex-1" />
        {connectSource && (
          <span className="text-xs text-muted-foreground animate-pulse">
            Click a target node to connect...
          </span>
        )}
        <Button size="sm" variant="outline" disabled>
          <Play className="h-3.5 w-3.5 mr-1" />
          Run
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-48 border-r p-2 flex flex-col gap-1.5 overflow-y-auto">
          <p className="text-xs font-medium text-muted-foreground mb-1">Nodes</p>
          {NODE_TEMPLATES.map((t) => (
            <button
              key={t.type}
              onClick={() => addNode(t.type)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium border hover:opacity-80 transition-opacity ${t.color}`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 relative overflow-auto bg-slate-50 dark:bg-slate-900">
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: 1200, minHeight: 600 }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
              </marker>
            </defs>
            {renderEdges()}
          </svg>

          {nodes.map((node) => {
            const tmpl = getTemplate(node.type);
            return (
              <div
                key={node.id}
                className={`absolute cursor-pointer rounded-lg border-2 shadow-sm px-3 py-2 text-xs font-medium select-none transition-all ${
                  tmpl?.color || 'bg-slate-100 border-slate-300 text-slate-700'
                } ${selectedNodeId === node.id ? 'ring-2 ring-blue-400 ring-offset-1' : ''} ${
                  connectSource && connectSource !== node.id ? 'ring-2 ring-green-400 ring-offset-1 cursor-crosshair' : ''
                }`}
                style={{ left: node.x, top: node.y, minWidth: 120 }}
                onClick={() => handleNodeClick(node.id)}
              >
                <div className="flex items-center gap-1.5">
                  {tmpl && <tmpl.icon className="h-3.5 w-3.5" />}
                  <span>{node.label}</span>
                </div>
              </div>
            );
          })}

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              Add nodes from the sidebar to build your workflow
            </div>
          )}
        </div>

        {selectedNode && (
          <div className="w-56 border-l p-3 flex flex-col gap-3">
            <p className="text-xs font-medium">Properties</p>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground">Label</label>
              <Input
                value={selectedNode.label}
                onChange={(e) =>
                  setNodes((prev) =>
                    prev.map((n) =>
                      n.id === selectedNode.id ? { ...n, label: e.target.value } : n,
                    ),
                  )
                }
                className="h-7 text-xs"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={startConnect}>
                <ChevronRight className="h-3.5 w-3.5 mr-1" />
                Connect
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteNode(selectedNode.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
