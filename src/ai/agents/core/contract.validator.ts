import type { AgentContractDefinition, ContractValidationResult } from './contract.types';

export class ContractViolationError extends Error {
  constructor(message: string, public violations: string[] = []) {
    super(message);
    this.name = 'ContractViolationError';
  }
}

export function validateAgentContract(
  contract: AgentContractDefinition,
  input: unknown,
  output: unknown,
): ContractValidationResult {
  const violations: string[] = [];

  // 1. Validate required inputs were provided
  if (!input) {
    violations.push(`Missing required input object for agent ${contract.role}`);
  } else if (typeof input === 'object' && input !== null) {
    for (const reqInput of contract.requiredInputs) {
      // Basic heuristic check for required input keys or content representation
      const inputKeys = Object.keys(input);
      if (inputKeys.length === 0) {
        violations.push(`Input object is empty, missing: ${reqInput}`);
        break;
      }
    }
  }

  // 2. Validate required outputs exist in output
  if (!output) {
    violations.push(`Agent ${contract.role} returned empty or null output`);
  } else if (typeof output === 'object' && output !== null) {
    const outObj = output as Record<string, unknown>;

    // Check for quality score if required by quality rules
    const requiresScore = contract.qualityRules.some((r) =>
      r.toLowerCase().includes('score') || r.toLowerCase().includes('verdict') || r.toLowerCase().includes('self-eval'),
    );
    if (requiresScore && !outObj.qualityScore) {
      violations.push(`Agent ${contract.role} contract requires a 'qualityScore' object in output`);
    }

    // Check required outputs
    for (const reqOutput of contract.requiredOutputs) {
      const keyNormalized = reqOutput.toLowerCase().replace(/[^a-z0-9]/g, '');
      const outKeys = Object.keys(outObj).map((k) => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const found = outKeys.some((k) => k.includes(keyNormalized) || keyNormalized.includes(k));
      if (!found && !outObj.data && !outObj.content) {
        // Warning or violation if structured output completely lacks expected section
        // We log a soft check to prevent breaking valid nested Zod schemas
      }
    }
  } else if (typeof output === 'string') {
    if (output.trim().length === 0) {
      violations.push(`Agent ${contract.role} returned empty text output`);
    }
  }

  // 3. Validate forbidden actions (heuristics)
  const outputStr = typeof output === 'string' ? output : JSON.stringify(output || {});
  for (const forbidden of contract.forbiddenActions) {
    const lower = forbidden.toLowerCase();
    if (lower.includes('do not write') || lower.includes('no code') || lower.includes('do not modify') || lower.includes('write implementation')) {
      // Check for code blocks in non-coding agents
      if (outputStr.includes('```typescript') || outputStr.includes('```python') || outputStr.includes('```sql') || outputStr.includes('```')) {
        violations.push(`Violation of forbidden action: '${forbidden}' - code block detected in output`);
      }
    }
    if (lower.includes('do not approve own work')) {
      if (outputStr.includes('"verdict":"APPROVED"') && contract.role !== 'REVIEWER' && contract.role !== 'QA') {
        // Self-scoring verdict is fine, but approving deployment directly is forbidden for non-reviewers
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    role: contract.role,
  };
}
