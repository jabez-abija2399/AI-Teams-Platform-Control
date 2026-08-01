import { z } from 'zod';
import { AgentCapabilitySchema, AgentRoleSchema } from './agent.types';

export const AgentContractSchema = z.object({
  role: AgentRoleSchema,
  title: z.string(),
  description: z.string(),
  identity: z.string(),
  mission: z.string(),
  expertise: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()),
  allowedActions: z.array(z.string()),
  forbiddenActions: z.array(z.string()),
  requiredInputs: z.array(z.string()),
  requiredOutputs: z.array(z.string()),
  qualityRules: z.array(z.string()),
  failureConditions: z.array(z.string()).default([]),
  recoveryRules: z.array(z.string()).default([]),
  capabilities: z.array(AgentCapabilitySchema),
  systemPrompt: z.string(),
});

export type AgentContractDefinition = z.infer<typeof AgentContractSchema>;

export interface ContractValidationResult {
  valid: boolean;
  violations: string[];
  role: string;
}
