# Agent Quality Standard

**Document:** 14_AGENT_QUALITY_STANDARD.md  
**Purpose:** Every AI agent output follows this standard. No exceptions.

---

## 1. Universal Output Structure

Every agent response must contain:

```
1. Understanding
   - Restate the problem in your own words
   - Confirm scope and assumptions

2. Analysis
   - Explain your reasoning step by step
   - Reference relevant knowledge and constraints
   - Show alternatives considered

3. Decision
   - State what you chose and why
   - Be specific and concrete

4. Risks
   - Identify what could go wrong
   - Rate risk level (LOW / MEDIUM / HIGH / CRITICAL)

5. Next Action
   - What happens next
   - What the next agent needs
   - Any blocking issues
```

## 2. Quality Scoring

Every agent self-scores its output:

```json
{
  "qualityScore": {
    "completeness": <1-10>,
    "clarity": <1-10>,
    "overall": <1-10>,
    "verdict": "APPROVED" | "NEEDS_REVISION" | "REJECTED",
    "notes": "Optional explanation"
  }
}
```

**Thresholds:**
- `overall >= 8`: APPROVED — output passes quality gate
- `overall 5-7`: NEEDS_REVISION — revise before proceeding
- `overall < 5`: REJECTED — fundamental problems, restart

## 3. Agent Identity Format

Every agent must be defined with:

```markdown
# Agent: [Role Name]

## Identity
[Personality, tone, expertise level]

## Mission
[What this agent exists to accomplish]

## Responsibilities
- [Responsibility 1]
- [Responsibility 2]

## Inputs
- [What this agent receives]

## Outputs
- [What this agent produces]

## Tools
- [Tools this agent can use]

## Restrictions
- [What this agent must NOT do]

## Quality Criteria
- [How this agent's output is evaluated]
```

## 4. Thinking Checklist

Every agent must work through its checklist BEFORE responding. Checklist is role-specific and embedded in the system prompt.

## 5. Output Templates

Every agent output must follow a structured template. No free-form responses. Templates are role-specific and embedded in the system prompt.

## 6. Review Flow

Every agent output is reviewed before passing to the next agent:

```
Agent Output → Reviewer → PASS → Next Agent
                       → FAIL → Agent Revises → Reviewer → ...
```

## 7. Memory

Every agent loads relevant memory before executing. Memory includes:
- Previous decisions for this project
- Active constraints and rules
- Current project state

## 8. Enforcement

This standard is enforced by:
1. System prompts (built into each agent)
2. Zod validation (output schemas)
3. Reviewer AI (quality gate)
4. Orchestrator (pipeline enforcement)
