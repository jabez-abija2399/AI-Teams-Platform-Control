import type { AgentRole } from '@/packages/agents/core/agent.types';
import { Rocket, Layers, Code2, ShieldCheck, Palette, Server, FileText, Shield, Activity, ClipboardList, SearchCheck } from 'lucide-react';

type AgentPersonality = { icon: typeof Rocket; color: string; bg: string; tagline: string };

export const AGENT_PERSONALITY: Record<AgentRole, AgentPersonality> = {
  CEO:              { icon: Rocket,       color: '#f59e0b', bg: '#fef3c7', tagline: 'Turns your idea into a plan' },
  ARCHITECT:        { icon: Layers,       color: '#6366f1', bg: '#e0e7ff', tagline: 'Designs how it all fits together' },
  DEVELOPER:        { icon: Code2,        color: '#10b981', bg: '#d1fae5', tagline: 'Writes the actual code' },
  FRONTEND:         { icon: Palette,      color: '#3b82f6', bg: '#eff6ff', tagline: 'Crafts the frontend UI and UX' },
  BACKEND:          { icon: Server,       color: '#059669', bg: '#ecfdf5', tagline: 'Builds secure APIs and services' },
  DATABASE:         { icon: Layers,       color: '#7c3aed', bg: '#f5f3ff', tagline: 'Architects schemas and queries' },
  QA:               { icon: ShieldCheck,  color: '#ec4899', bg: '#fce7f3', tagline: 'Tests everything before you see it' },
  PRODUCT_MANAGER:  { icon: ClipboardList, color: '#14b8a6', bg: '#ccfbf1', tagline: 'Refines requirements into specs' },
  REVIEWER:         { icon: SearchCheck,  color: '#f97316', bg: '#fff7ed', tagline: 'Reviews every output for quality' },
  ARCHITECTURE_REVIEWER: { icon: SearchCheck, color: '#4f46e5', bg: '#eef2ff', tagline: 'Reviews architecture & scalability' },
  CODE_REVIEWER:    { icon: SearchCheck,  color: '#d97706', bg: '#fef3c7', tagline: 'Reviews code quality & strict typing' },
  QUALITY_REVIEWER: { icon: SearchCheck,  color: '#be185d', bg: '#fdf2f8', tagline: 'Reviews UX & requirement completeness' },
  UI_UX:            { icon: Palette,      color: '#8b5cf6', bg: '#ede9fe', tagline: 'Makes it look and feel right' },
  DEVOPS:           { icon: Server,       color: '#0ea5e9', bg: '#e0f2fe', tagline: 'Gets it live' },
  DOCUMENTATION:    { icon: FileText,     color: '#64748b', bg: '#f1f5f9', tagline: 'Keeps the docs current' },
  SECURITY:         { icon: Shield,       color: '#dc2626', bg: '#fee2e2', tagline: 'Catches problems before they ship' },
  PRODUCT_DISCOVERY:{ icon: SearchCheck,  color: '#8b5cf6', bg: '#f3e8ff', tagline: 'Discovers product specifications from raw ideas' },
  OPERATIONS:       { icon: Activity,     color: '#0891b2', bg: '#cffafe', tagline: 'Keeps things running' },
  BUSINESS_ANALYST: { icon: ClipboardList, color: '#0284c7', bg: '#e0f2fe', tagline: 'Transforms PRD into formal SRS and Gherkin rules' },
  UX_RESEARCHER:    { icon: SearchCheck,  color: '#9333ea', bg: '#f3e8ff', tagline: 'Designs user journeys and accessible navigation' },
  UI_DESIGNER:      { icon: Palette,      color: '#e11d48', bg: '#ffe4e6', tagline: 'Creates modern design systems and tokens' },
};
