import type { AgentRole } from '@/ai/agents/core/agent.types';
import { Rocket, Layers, Code2, ShieldCheck, Palette, Server, FileText, Shield, Activity } from 'lucide-react';

type AgentPersonality = { icon: typeof Rocket; color: string; bg: string; tagline: string };

export const AGENT_PERSONALITY: Record<AgentRole, AgentPersonality> = {
  CEO:           { icon: Rocket,      color: '#f59e0b', bg: '#fef3c7', tagline: 'Turns your idea into a plan' },
  ARCHITECT:     { icon: Layers,      color: '#6366f1', bg: '#e0e7ff', tagline: 'Designs how it all fits together' },
  DEVELOPER:     { icon: Code2,       color: '#10b981', bg: '#d1fae5', tagline: 'Writes the actual code' },
  QA:            { icon: ShieldCheck, color: '#ec4899', bg: '#fce7f3', tagline: 'Tests everything before you see it' },
  UI_UX:         { icon: Palette,     color: '#8b5cf6', bg: '#ede9fe', tagline: 'Makes it look and feel right' },
  DEVOPS:        { icon: Server,      color: '#0ea5e9', bg: '#e0f2fe', tagline: 'Gets it live' },
  DOCUMENTATION: { icon: FileText,    color: '#64748b', bg: '#f1f5f9', tagline: 'Keeps the docs current' },
  SECURITY:      { icon: Shield,      color: '#dc2626', bg: '#fee2e2', tagline: 'Catches problems before they ship' },
  OPERATIONS:    { icon: Activity,    color: '#0891b2', bg: '#cffafe', tagline: 'Keeps things running' },
};
