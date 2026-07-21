import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';

interface DesignTokenData {
  id: string;
  category: string;
  name: string;
  value: string;
}

interface DesignSystemData {
  id: string;
  projectId: string;
  name: string;
  configuration: unknown;
  tokens: DesignTokenData[];
}

export const DEFAULT_TOKENS: DesignTokenData[] = [
  // Colors — primary
  { id: '', category: 'color', name: 'primary', value: '#6366f1' },
  { id: '', category: 'color', name: 'primary-foreground', value: '#ffffff' },
  { id: '', category: 'color', name: 'secondary', value: '#f4f4f5' },
  { id: '', category: 'color', name: 'secondary-foreground', value: '#18181b' },
  { id: '', category: 'color', name: 'accent', value: '#8b5cf6' },
  { id: '', category: 'color', name: 'accent-foreground', value: '#ffffff' },
  // Colors — neutral
  { id: '', category: 'color', name: 'background', value: '#ffffff' },
  { id: '', category: 'color', name: 'foreground', value: '#09090b' },
  { id: '', category: 'color', name: 'muted', value: '#f4f4f5' },
  { id: '', category: 'color', name: 'muted-foreground', value: '#71717a' },
  { id: '', category: 'color', name: 'border', value: '#e4e4e7' },
  { id: '', category: 'color', name: 'ring', value: '#6366f1' },
  // Colors — feedback
  { id: '', category: 'color', name: 'destructive', value: '#ef4444' },
  { id: '', category: 'color', name: 'destructive-foreground', value: '#ffffff' },
  { id: '', category: 'color', name: 'success', value: '#22c55e' },
  { id: '', category: 'color', name: 'warning', value: '#f59e0b' },
  // Colors — status
  { id: '', category: 'color', name: 'info', value: '#3b82f6' },
  { id: '', category: 'color', name: 'card', value: '#ffffff' },
  { id: '', category: 'color', name: 'card-foreground', value: '#09090b' },
  // Typography
  { id: '', category: 'typography', name: 'font-sans', value: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { id: '', category: 'typography', name: 'font-mono', value: 'JetBrains Mono, ui-monospace, monospace' },
  { id: '', category: 'typography', name: 'text-xs', value: '0.75rem' },
  { id: '', category: 'typography', name: 'text-sm', value: '0.875rem' },
  { id: '', category: 'typography', name: 'text-base', value: '1rem' },
  { id: '', category: 'typography', name: 'text-lg', value: '1.125rem' },
  { id: '', category: 'typography', name: 'text-xl', value: '1.25rem' },
  { id: '', category: 'typography', name: 'text-2xl', value: '1.5rem' },
  { id: '', category: 'typography', name: 'text-3xl', value: '1.875rem' },
  { id: '', category: 'typography', name: 'font-normal', value: '400' },
  { id: '', category: 'typography', name: 'font-medium', value: '500' },
  { id: '', category: 'typography', name: 'font-semibold', value: '600' },
  { id: '', category: 'typography', name: 'font-bold', value: '700' },
  { id: '', category: 'typography', name: 'leading-tight', value: '1.25' },
  { id: '', category: 'typography', name: 'leading-normal', value: '1.5' },
  { id: '', category: 'typography', name: 'tracking-tight', value: '-0.025em' },
  // Spacing
  { id: '', category: 'spacing', name: 'space-1', value: '0.25rem' },
  { id: '', category: 'spacing', name: 'space-2', value: '0.5rem' },
  { id: '', category: 'spacing', name: 'space-3', value: '0.75rem' },
  { id: '', category: 'spacing', name: 'space-4', value: '1rem' },
  { id: '', category: 'spacing', name: 'space-5', value: '1.25rem' },
  { id: '', category: 'spacing', name: 'space-6', value: '1.5rem' },
  { id: '', category: 'spacing', name: 'space-8', value: '2rem' },
  { id: '', category: 'spacing', name: 'space-10', value: '2.5rem' },
  { id: '', category: 'spacing', name: 'space-12', value: '3rem' },
  // Border radius
  { id: '', category: 'radius', name: 'radius-sm', value: '0.25rem' },
  { id: '', category: 'radius', name: 'radius-md', value: '0.375rem' },
  { id: '', category: 'radius', name: 'radius-lg', value: '0.5rem' },
  { id: '', category: 'radius', name: 'radius-xl', value: '0.75rem' },
  { id: '', category: 'radius', name: 'radius-2xl', value: '1rem' },
  { id: '', category: 'radius', name: 'radius-full', value: '9999px' },
  // Shadows
  { id: '', category: 'shadow', name: 'shadow-sm', value: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
  { id: '', category: 'shadow', name: 'shadow-md', value: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
  { id: '', category: 'shadow', name: 'shadow-lg', value: '0 10px 15px -3px rgb(0 0 0 / 0.1)' },
];

export async function initializeDesignSystem(
  projectId: string,
): Promise<ApiResult<DesignSystemData>> {
  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) {
    return { success: false, error: { message: 'Project not found', code: 'NOT_FOUND' } };
  }

  const existing = await prisma.designSystemConfig.findFirst({ where: { projectId } });
  if (existing) {
    const tokens = await prisma.designToken.findMany({
      where: { designSystemId: existing.id },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    return {
      success: true,
      data: { ...existing, tokens: tokens.map((t) => ({ ...t, id: t.id })) },
    };
  }

  const config = await prisma.designSystemConfig.create({
    data: {
      projectId,
      name: 'Default',
      configuration: {
        theme: 'light',
        breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
      },
    },
  });

  await prisma.$transaction(
    DEFAULT_TOKENS.map((token) =>
      prisma.designToken.create({
        data: {
          designSystemId: config.id,
          category: token.category,
          name: token.name,
          value: token.value,
        },
      }),
    ),
  );

  const tokens = await prisma.designToken.findMany({
    where: { designSystemId: config.id },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

  return {
    success: true,
    data: { ...config, tokens: tokens.map((t) => ({ ...t, id: t.id })) },
  };
}

export async function getTokens(
  projectId: string,
): Promise<ApiResult<DesignSystemData | null>> {
  const config = await prisma.designSystemConfig.findFirst({ where: { projectId } });
  if (!config) {
    return { success: true, data: null };
  }

  const tokens = await prisma.designToken.findMany({
    where: { designSystemId: config.id },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

  return {
    success: true,
    data: { ...config, tokens: tokens.map((t) => ({ ...t, id: t.id })) },
  };
}
