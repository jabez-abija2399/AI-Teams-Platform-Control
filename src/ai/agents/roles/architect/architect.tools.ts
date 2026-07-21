import type { ITool, ToolResult } from '@/ai/agents/tools/tool.interface';
import { generate } from '@/ai/services/ai.service';
import { architectConfig } from './architect.config';
import { ARCHITECT_SYSTEM_PROMPT } from './architect.prompt';
import {
  technicalArchitectureSchema,
  databaseDesignSchema,
  apiSpecificationSchema,
  type TechnicalArchitecture,
  type DatabaseDesign,
  type APISpecification,
} from './architect.types';
import type { ProductRequirement } from '@/ai/agents/roles/ceo/ceo.types';

function extractJson(text: string): unknown {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch?.[1]) return JSON.parse(jsonMatch[1]);
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return JSON.parse(text.slice(firstBrace, lastBrace + 1));
  }
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    try { return JSON.parse(text.slice(firstBracket, lastBracket + 1)); } catch { /* continue */ }
  }
  return JSON.parse(text);
}

async function aiCall<T>(prompt: string, projectId?: string, agentId?: string): Promise<T> {
  const result = await generate(
    {
      model: architectConfig.preferredModel,
      systemPrompt: ARCHITECT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
      temperature: architectConfig.temperature,
      maxTokens: architectConfig.maxTokens,
      provider: architectConfig.preferredProvider,
    },
    { projectId, agentId },
  );
  if (!result.success) throw new Error(result.error.message);
  return extractJson(result.data.content) as T;
}

export const architectureDesignerTool: ITool<
  { requirements: ProductRequirement; projectId?: string; agentId?: string },
  TechnicalArchitecture
> = {
  name: 'architecture_designer',
  description:
    'Produces a system architecture (frontend, backend, database, infra, security) from product requirements.',
  async execute({ requirements, projectId, agentId }): Promise<ToolResult<TechnicalArchitecture>> {
    try {
      const raw = await aiCall<unknown>(
        `Product requirements: ${JSON.stringify(requirements)}\n\nProduce a system architecture as JSON with keys: frontend, backend, database, infrastructure, security. Respond ONLY with valid JSON.`,
        projectId,
        agentId,
      );
      const data = technicalArchitectureSchema.parse(raw);
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Architecture designer failed',
      };
    }
  },
};

export const databaseDesignerTool: ITool<{ requirements: ProductRequirement; projectId?: string; agentId?: string }, DatabaseDesign> = {
  name: 'database_designer',
  description:
    'Produces a database schema (entities, relationships, indexes, constraints) from features.',
  async execute({ requirements, projectId, agentId }): Promise<ToolResult<DatabaseDesign>> {
    try {
      const raw = await aiCall<unknown>(
        `Features: ${JSON.stringify(requirements.features)}\n\nProduce a database design as JSON with keys: entities (array of {name, fields: [{name, type}]}), relationships (array of strings), indexes (array of strings), constraints (array of strings). Respond ONLY with valid JSON.`,
        projectId,
        agentId,
      );
      const data = databaseDesignSchema.parse(raw);
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Database designer failed',
      };
    }
  },
};

export const apiDesignerTool: ITool<
  { requirements: ProductRequirement; database: DatabaseDesign; projectId?: string; agentId?: string },
  APISpecification
> = {
  name: 'api_designer',
  description: 'Produces REST API endpoints from requirements and database design.',
  async execute({ requirements, database, projectId, agentId }): Promise<ToolResult<APISpecification>> {
    try {
      const raw = await aiCall<unknown>(
        `Requirements: ${JSON.stringify(requirements)}\nDatabase: ${JSON.stringify(database)}\n\nProduce an API specification as JSON with keys: endpoints (array of {path, method, request (optional), response}). Method must be GET, POST, PUT, PATCH, or DELETE. Respond ONLY with valid JSON.`,
        projectId,
        agentId,
      );
      const data = apiSpecificationSchema.parse(raw);
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'API designer failed',
      };
    }
  },
};
