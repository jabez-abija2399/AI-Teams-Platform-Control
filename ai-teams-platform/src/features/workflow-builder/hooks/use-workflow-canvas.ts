'use client';

import { useCallback, useRef, useState } from 'react';
import type { WorkflowNode, WorkflowEdge, NodeType } from '../types';

let nodeIdCounter = 0;
function nextNodeId() {
  return `node_${Date.now()}_${nodeIdCounter++}`;
}

export function useWorkflowCanvas(initialNodes: WorkflowNode[] = [], initialEdges: WorkflowEdge[] = []) {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [edges, setEdges] = useState<WorkflowEdge[]>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const addNode = useCallback((type: NodeType, x: number, y: number) => {
    const id = nextNodeId();
    const labelMap: Record<NodeType, string> = {
      trigger: 'New Trigger',
      action: 'New Action',
      condition: 'Condition',
      ai_agent: 'AI Agent',
      deploy: 'Deploy',
      webhook: 'Webhook',
      output: 'Output',
    };
    setNodes((prev) => [
      ...prev,
      { id, type, label: labelMap[type], x, y, config: {} },
    ]);
    return id;
  }, []);

  const updateNode = useCallback((id: string, updates: Partial<WorkflowNode>) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  }, []);

  const deleteNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  }, [selectedNodeId]);

  const addEdge = useCallback((source: string, target: string, label?: string) => {
    const id = `edge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setEdges((prev) => {
      if (prev.some((e) => e.source === source && e.target === target)) return prev;
      return [...prev, { id, source, target, label }];
    });
  }, []);

  const deleteEdge = useCallback((id: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const startDrag = useCallback((nodeId: string) => setDraggingNodeId(nodeId), []);
  const stopDrag = useCallback(() => setDraggingNodeId(null), []);

  const moveNode = useCallback(
    (nodeId: string, dx: number, dy: number) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId ? { ...n, x: n.x + dx, y: n.y + dy } : n,
        ),
      );
    },
    [],
  );

  return {
    nodes,
    edges,
    selectedNodeId,
    draggingNodeId,
    canvasRef,
    setSelectedNodeId,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    deleteEdge,
    startDrag,
    stopDrag,
    moveNode,
  };
}
