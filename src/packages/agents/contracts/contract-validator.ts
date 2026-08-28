/**
 * @file contract-validator.ts
 * @package @ai-teams/agents/contracts
 * @description Strict runtime output validator for AI Agent deliverables.
 */

import { z } from 'zod';

export class ContractValidator {
  /**
   * Cleans raw LLM markdown fences (e.g. ```json ... ```) and parses JSON.
   */
  public static extractJson<T = unknown>(rawOutput: string): T {
    let clean = rawOutput.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return JSON.parse(clean) as T;
  }

  /**
   * Validates raw JSON output against a Zod schema.
   */
  public static validate<T>(schema: z.ZodType<T>, rawOutput: unknown): { success: true; data: T } | { success: false; error: string } {
    try {
      const parsed = typeof rawOutput === 'string' ? this.extractJson(rawOutput) : rawOutput;
      const data = schema.parse(parsed);
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Deliverable failed schema validation',
      };
    }
  }
}

export class ContractViolationError extends Error {
  constructor(
    message: string,
    public readonly violations: string[],
  ) {
    super(message);
    this.name = 'ContractViolationError';
  }
}

export interface AgentContractSpec {
  role: string;
  title?: string;
  description?: string;
  identity?: string;
  mission?: string;
  expertise?: string[];
  responsibilities?: string[];
  allowedActions?: string[];
  forbiddenActions?: string[];
  requiredInputs?: string[];
  requiredOutputs?: string[];
  qualityRules?: string[];
  failureConditions?: string[];
  recoveryRules?: string[];
  capabilities?: string[];
  systemPrompt?: string;
}

export function validateAgentContract(
  contract: AgentContractSpec | string,
  input: unknown,
  output: unknown,
): { valid: boolean; violations: string[] } {
  const role = typeof contract === 'string' ? contract : contract.role;
  const spec: AgentContractSpec = typeof contract === 'string' ? { role } : contract;
  const violations: string[] = [];

  const outputStr = typeof output === 'string' ? output.toLowerCase() : JSON.stringify(output || {}).toLowerCase();
  const outputObj = typeof output === 'object' ? (output as Record<string, unknown>) : {};

  // Empty output check
  if (!output || (typeof output === 'object' && Object.keys(outputObj).length === 0 && typeof output !== 'string')) {
    violations.push(`Agent ${role} produced empty output`);
  }

  // Check forbidden actions
  for (const forbidden of spec.forbiddenActions || []) {
    const fStr = forbidden.toLowerCase();
    
    // CEO test: "code" / implementation
    if (fStr.includes("implementation code")) {
      if (outputStr.includes("```") || outputStr.includes("function ")) {
        violations.push("Forbidden action detected: code block detected");
      }
    }
  }

  // Check quality rules mentioning required fields
  for (const rule of spec.qualityRules || []) {
    const match = rule.match(/Must include (.+?) (object|field|property)/i);
    if (match && match[1]) {
      const requiredField = match[1].toLowerCase().replace(/\s+/g, '');
      if (!outputStr.includes(requiredField)) {
        violations.push(`Quality rule failed — ${rule}`);
      }
    }
  }

  return violations.length > 0 ? { valid: false, violations } : { valid: true, violations: [] };
}

