/**
 * @file agent-contract.interface.ts
 * @package @ai-teams/agents/contracts
 * @description Standard agent contract interface enforcing deterministic deliverables,
 * tool permissions, and communication boundaries.
 */

import { z } from 'zod';

export interface AgentContract {
  role: string;
  department: string;
  description: string;
  allowedTools: string[];
  requiredInputKeys: string[];
  deliverableType: string;
  schema: z.ZodType<unknown>;
  qualityThresholdPercent: number;
}
