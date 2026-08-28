/**
 * @file architect.tools.ts
 * @package @ai-teams/agents/roles/architect
 * @description Architecture, database, and API design tools for the System Architect Agent.
 */

import type { ITool, ToolResult } from '@/packages/agents/tools/tool.interface';
import { aiCall } from '@/packages/agents/core/ai-call';
import { ARCHITECT_SYSTEM_PROMPT } from './architect.prompt';
import {
  technicalArchitectureSchema,
  databaseDesignSchema,
  apiSpecificationSchema,
  type TechnicalArchitecture,
  type DatabaseDesign,
  type APISpecification,
} from './architect.types';
import type { ProductRequirement } from '../ceo/ceo.types';

import { architectConfig } from '@/packages/agents/roles/architect/architect.config';

export const architectureDesignerTool: ITool<{
  requirements: ProductRequirement;
  projectId?: string;
  agentId?: string;
}, TechnicalArchitecture> = {
  name: 'architecture_designer',
  description: 'Selects the technology stack and high-level architectural patterns based on product requirements.',
  async execute({ requirements, projectId, agentId }): Promise<ToolResult<TechnicalArchitecture>> {
    try {
      const raw = await aiCall<unknown>(
        `Product Requirements:\n${JSON.stringify(requirements, null, 2)}\n\nDesign the technical architecture. Produce JSON with keys: frontend, backend, database, infrastructure, security (all strings describing the choices and rationale). Respond ONLY with valid JSON.`,
        ARCHITECT_SYSTEM_PROMPT,
        'ARCHITECT',
        architectConfig,
        projectId,
        agentId,
      );
      const data = technicalArchitectureSchema.parse(raw);
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Architecture design tool failed',
      };
    }
  },
};

export const databaseDesignerTool: ITool<{
  requirements: ProductRequirement;
  projectId?: string;
  agentId?: string;
}, DatabaseDesign> = {
  name: 'database_designer',
  description: 'Designs data models, entity relationships, indexes, and constraints.',
  async execute({ requirements, projectId, agentId }): Promise<ToolResult<DatabaseDesign>> {
    try {
      const raw = await aiCall<unknown>(
        `Product Requirements:\n${JSON.stringify(requirements, null, 2)}\n\nDesign the database schema. Produce JSON with keys: entities (array of {name, fields: [{name, type}]}), relationships (array of strings, e.g. "User 1-N Post"), indexes (array of strings), constraints (array of strings). Respond ONLY with valid JSON.`,
        ARCHITECT_SYSTEM_PROMPT,
        'ARCHITECT',
        architectConfig,
        projectId,
        agentId,
      );
      const data = databaseDesignSchema.parse(raw);
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Database design tool failed',
      };
    }
  },
};

export const apiDesignerTool: ITool<{
  requirements: ProductRequirement;
  database: DatabaseDesign;
  projectId?: string;
  agentId?: string;
}, APISpecification> = {
  name: 'api_designer',
  description: 'Designs RESTful API endpoints, request/response formats, and authentication requirements.',
  async execute({ requirements, database, projectId, agentId }): Promise<ToolResult<APISpecification>> {
    try {
      const raw = await aiCall<unknown>(
        `Requirements:\n${JSON.stringify(requirements, null, 2)}\n\nDatabase Entities:\n${JSON.stringify(database.entities, null, 2)}\n\nDesign the API specification. Produce JSON with key: endpoints (array of {path, method: "GET"|"POST"|"PUT"|"DELETE"|"PATCH", request (optional string/schema), response (string description of response)}). Respond ONLY with valid JSON.`,
        ARCHITECT_SYSTEM_PROMPT,
        'ARCHITECT',
        architectConfig,
        projectId,
        agentId,
      );
      const data = apiSpecificationSchema.parse(raw);
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'API design tool failed',
      };
    }
  },
};

export class ArchitectTools {
  public static async evaluateStack(projectType: string): Promise<string[]> {
    return [
      'Next.js 16 (App Router, Turbopack)',
      'TypeScript 5.x with strict mode',
      'Tailwind CSS for responsive styling',
      'Prisma ORM with PostgreSQL',
    ];
  }
}
