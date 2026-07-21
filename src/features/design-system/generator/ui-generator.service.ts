import { prisma } from '@/lib/prisma';
import { generate } from '@/ai/services/ai.service';
import type { ApiResult } from '@/types/common.types';

interface GeneratedComponent {
  id: string;
  name: string;
  category: string;
  code: string;
  documentation: string | null;
  createdAt: Date;
}

const SYSTEM_PROMPT = `You are an expert React + Tailwind CSS component developer.
Generate production-ready, accessible React components using Tailwind CSS utility classes.
Follow these rules:
- Export a single default component.
- Use TypeScript with proper prop types.
- Use only Tailwind CSS classes (no inline styles).
- Include proper aria labels and accessibility attributes where appropriate.
- Do not import external libraries unless absolutely necessary.
- Return ONLY the code, no explanation.`;

export async function generateComponent(
  projectId: string,
  agentId: string,
  description: string,
  category: string,
): Promise<ApiResult<GeneratedComponent>> {
  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) {
    return { success: false, error: { message: 'Project not found', code: 'NOT_FOUND' } };
  }

  if (!description || description.trim().length === 0) {
    return { success: false, error: { message: 'Component description is required', code: 'VALIDATION_ERROR' } };
  }

  let designSystem = await prisma.designSystemConfig.findFirst({ where: { projectId } });
  if (!designSystem) {
    designSystem = await prisma.designSystemConfig.create({
      data: { projectId, name: 'Default' },
    });
  }

  const tokens = await prisma.designToken.findMany({
    where: { designSystemId: designSystem.id },
  });

  const tokenContext = tokens.length > 0
    ? `\n\nAvailable design tokens:\n${tokens.map((t) => `${t.category}/${t.name}: ${t.value}`).join('\n')}`
    : '';

  const result = await generate(
    {
      messages: [
        {
          role: 'user',
          content: `Generate a React + Tailwind CSS component based on this description:\n\n${description}\n\nCategory: ${category}${tokenContext}`,
        },
      ],
      systemPrompt: SYSTEM_PROMPT,
    },
    { agentId, projectId },
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const code = result.data.content;
  const componentName = extractComponentName(code) || description.split(' ')[0] || 'GeneratedComponent';

  const component = await prisma.designComponent.create({
    data: {
      designSystemId: designSystem.id,
      name: componentName,
      category,
      code,
      documentation: `Generated component: ${description}`,
    },
  });

  return { success: true, data: component };
}

function extractComponentName(code: string): string | null {
  const exportDefault = code.match(/export\s+default\s+(?:function|class)\s+(\w+)/);
  if (exportDefault?.[1]) return exportDefault[1];

  const constExport = code.match(/export\s+(?:const|let|var)\s+(\w+)/);
  if (constExport?.[1]) return constExport[1];

  const functionDecl = code.match(/function\s+(\w+)/);
  if (functionDecl?.[1]) return functionDecl[1];

  return null;
}
