# Agent Guide: AI Teams Platform

## Quick Navigation

```
                      ┌─────────────────────────┐
                      │  master-orchestrator.ts   │  ← Top-level coordinator
                      │  (runFullCompanyWorkflow) │
                      └────────┬────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
    ┌──────────┐       ┌─────────────┐       ┌──────────────┐
    │  CEO AI  │ ──→   │ Architect AI│ ──→   │ Developer AI │
    │ceo.service│      │architect.svc│       │developer.svc │
    └──────────┘       └─────────────┘       └──────┬───────┘
                                                    │
                                             ┌──────┴──────┐
                                             │    QA AI    │
                                             │ qa.service  │
                                             └─────────────┘
```

## Key Files by Role

### Developer AI (the slow one)
| File | Purpose |
|------|---------|
| `src/ai/agents/roles/developer/developer.service.ts` | Main orchestrator: plan → generate → save |
| `src/ai/agents/roles/developer/developer.tools.ts` | AI tool calls (planner + code generator) |
| `src/ai/agents/roles/developer/developer.prompt.ts` | System prompt for Developer AI |
| `src/ai/agents/roles/developer/developer.types.ts` | Zod schemas for plan, changes, output |
| `src/ai/agents/roles/developer/developer.config.ts` | Model/provider config |
| `src/app/api/ai/developer/route.ts` | POST endpoint that triggers implementation |
| `src/app/api/projects/[id]/developer-status/route.ts` | GET polling endpoint for progress |
| `src/features/developer-ai/components/developer-chat.tsx` | Frontend tab UI |

### AI Infrastructure (shared)
| File | Purpose |
|------|---------|
| `src/ai/services/ai.service.ts` | `generate()`, `stream()`, `generateStructured()` |
| `src/ai/gateway/ai.gateway.ts` | Multi-provider fallback chain + retry |
| `src/ai/gateway/ai.constants.ts` | MAX_RETRIES=3, PROVIDER_TIMEOUT_MS=30000 |
| `src/ai/config/ai.config.ts` | Provider selection from env vars |

### Workflow (spans all agents)
| File | Purpose |
|------|---------|
| `src/core/master-orchestrator/master-orchestrator.ts` | Full build pipeline (CEO→Architect→Dev→QA→Security→Deploy) |
| `src/ai/workflows/core/workflow.engine.ts` | In-memory workflow engine |
| `src/ai/workflows/execution/workflow.executor.ts` | Step-to-agent mapping |
| `src/ai/workflows/execution/task.engine.ts` | Task-level execution |
| `src/app/dashboard/projects/[id]/project-tabs-client.tsx` | Tab UI with build progress |

## Data Flow: Developer Tab (After Fix)

```
1. User clicks "Run Developer AI"
2. POST /api/ai/developer { projectId, architecture } → returns 202 immediately
3. implementArchitecture() runs in background:
   a. Emits progress events via EventEmitter (SSE stream)
   b. developmentPlannerTool.execute() → AI call → DeveloperPlan
      - Progressive: "Analyzing..." → "Identifying tasks..." → "Ordering..."
   c. DAG executor builds dependency layers from plan
   d. For each layer: Promise.all(codeGeneratorTool.execute(...))
      - Independent tasks run in parallel
      - Per-task retry: 3 attempts with exponential backoff
      - Failed tasks are recorded but don't kill the build
   e. Save DevelopmentTask + DEVELOPMENT_SUMMARY to DB (milestones only)
   f. Progress stored in-memory Map (DB reads fallback for completed builds)
4. Frontend receives real-time events via EventSource (SSE)
   - Sub-100ms updates instead of 3s polling
   - Falls back to polling with backoff if SSE fails
5. User can cancel via "Cancel" button → DELETE /api/ai/developer/cancel
```

## New API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/developer` | POST | Start build (fire-and-forget, returns 202) |
| `/api/ai/developer/stream/[projectId]` | GET | SSE stream of BuildEvent progress |
| `/api/ai/developer/cancel/[projectId]` | POST | Cancel active build via AbortController |
| `/api/projects/[id]/developer-status` | GET | Polling fallback / completed status |

## Key Improvements (All Implemented ✅)

| Issue | Before | After |
|-------|--------|-------|
| Artificial delays | 1500ms between every task | 0ms — removed entirely |
| Task execution | Sequential loop | DAG-based parallel batches |
| Progress updates | Polling every 3s (DB writes!) | Real-time SSE (<100ms) |
| DB writes | N+2 per build | 3 (milestones only) |
| Caching | None | LRU cache with 5min TTL |
| Cancellation | Fire-and-forget | AbortController + API endpoint |
| Per-task retry | Single failure kills all | 3 attempts with exp backoff |
| Partial completion | Fatal failure | Continues, reports failed tasks |
| Planning UX | "Planning..." (10-20s silence) | Progressive: analyze→identify→order |

## Fastest Path to Fix

### If you have 5 minutes:
1. `developer.service.ts:10` -- Delete `TOOL_DELAY_MS` and all `delay()` calls
2. `developer.service.ts:68-74` -- Show plan immediately after planning, before generating

### If you have 30 minutes:
1. Add SSE endpoint at `app/api/ai/developer/stream/[projectId]/route.ts`
2. Replace `setInterval` polling in `developer-chat.tsx` with `EventSource`
3. Add `AbortController` support for cancellation

### If you have 2+ hours:
1. Implement DAG-based parallel task execution
2. Add LRU cache layer
3. Add per-task retry with exponential backoff
4. Move progress tracking to in-memory Map (DB only at milestones)

## Key Env Vars

```
DEVELOPER_AI_PROVIDER=groq|deepseek|gemini|openrouter|openai|anthropic|ollama|together|huggingface
DEVELOPER_AI_MODEL=llama-3.3-70b-versatile (default)
```

## Testing

- Developer output: `src/ai/agents/roles/developer/__tests__/` (if exists)
- E2E: Run a project through the full build flow in dashboard UI
- Performance: Check `AIUsageLog` table for generation times

## Common Debugging

- "Developer AI is planning..." hangs → Check if AI provider key is valid (check env)
- Plan generates but no code → Check `codeGeneratorTool` in `developer.tools.ts:63-85`
- Build shows "running" forever → Check `developer-status/route.ts` logic
- Workspace files not appearing → Check `syncFilesToWorkspace()` in `developer.service.ts:138`
