# AI Teams Platform — Implementation Plan

## Executive Summary

The AI Teams Platform already has a strong foundation: AI pipeline (CEO → Architect → Developer → QA → Deploy), VS Code-like workspace, 33 feature modules, 9 AI agents, and a full Prisma schema with 100+ models. This plan identifies the **highest-impact features** to make this the **best, most user-friendly, most attractive** AI software development platform that can handle any task.

The features are organized into 4 tiers based on impact and feasibility.

---

## TIER 1 — Must Have (Makes the product usable and impressive)

### Feature 1: AI Code Assistant Panel (ChatGPT for Code)

**Why:** The biggest gap is that code editing has no AI assistance. Users should be able to ask questions about their code, get explanations, generate code, and fix bugs — all inside the editor.

**What to build:**
- `src/features/code-assistant/` — New feature module
- A chat panel in the workspace (replaces or augments the AI Team panel)
- Context-aware: automatically sends the currently open file + cursor position to AI
- Capabilities:
  - "Explain this code" — highlights a selection, AI explains it
  - "Fix this bug" — paste error, AI suggests fix and applies it
  - "Generate code" — describe what you want, AI writes it
  - "Refactor this" — select code, AI rewrites it cleaner
  - "Write tests" — select function, AI generates unit tests
  - "Convert to [language]" — translate code between languages
- Uses the existing AI gateway (`ai.gateway.ts`) with `groq` + `llama-3.3-70b-versatile`
- UI: floating chat panel that appears when user presses Ctrl+L (like VS Code Copilot Chat)
- Shows diff preview before applying changes

**Files to create:**
```
src/features/code-assistant/
  components/
    assistant-chat.tsx          — Main chat UI
    code-action-menu.tsx        — Right-click context menu actions
    diff-preview.tsx            — Shows before/after diff
    suggestion-card.tsx         — Code suggestion display
  services/
    assistant.service.ts        — AI prompt construction + execution
    context-builder.service.ts  — Builds file context for AI
  hooks/
    use-assistant.ts            — React Query hook for chat
  types/
    index.ts
  schemas/
    assistant.schema.ts
```

**Files to modify:**
- `src/features/workspace/components/layouts/ai-panel.tsx` — Add "Code Assistant" tab
- `src/features/editor/components/editor-container.tsx` — Add right-click menu
- `src/features/workspace/components/workspace-shell.tsx` — Add Ctrl+L shortcut

---

### Feature 2: Live Preview with Hot Reload

**Why:** Currently the preview is static. Users should see their app running in real-time as the AI generates code. This is the "wow factor" moment.

**What to build:**
- Upgrade `src/features/workspace/preview/live-preview-static.tsx` → `live-preview.tsx`
- Real iframe-based preview that loads the actual running app
- Auto-refresh when files change (WebSocket or polling)
- Responsive viewport switcher (desktop/tablet/mobile)
- Console output panel below the preview
- Error overlay showing runtime errors

**Files to create:**
```
src/features/workspace/preview/
  live-preview.tsx              — iframe-based live preview
  preview-toolbar.tsx           — viewport switcher, refresh, open in new tab
  preview-console.tsx           — captured console output
  preview-error-overlay.tsx     — runtime error display
```

**Files to modify:**
- `src/features/workspace/components/layouts/ai-panel.tsx` — Replace static with live preview
- `src/features/workspace/components/layouts/editor-area.tsx` — Add preview tab

---

### Feature 3: Real GitHub/GitLab Integration

**Why:** Users need to push their AI-generated code to real repositories. Without this, the platform is a sandbox, not a real tool.

**What to build:**
- `src/features/git-integration/` — New feature module
- OAuth flow for GitHub/GitLab authentication
- Create repository from the workspace
- Push/pull/commit operations
- Branch management
- Pull request creation
- Auto-commit after each AI agent completes

**Files to create:**
```
src/features/git-integration/
  components/
    repo-connect-dialog.tsx     — Connect GitHub/GitLab account
    repo-create-dialog.tsx      — Create new repo
    push-pull-buttons.tsx       — Push/Pull UI
    pr-create-dialog.tsx        — Create pull request
  services/
    github.service.ts           — GitHub API integration
    gitlab.service.ts           — GitLab API integration
  hooks/
    use-git-repo.ts
  types/
    index.ts
```

**API routes to create:**
```
src/app/api/git/connect/route.ts        — OAuth callback
src/app/api/git/repo/route.ts           — Create repo
src/app/api/git/push/route.ts           — Push code
src/app/api/git/pull/route.ts           — Pull code
src/app/api/git/branches/route.ts       — List/create branches
src/app/api/git/pr/route.ts             — Create PR
```

**Prisma additions:**
```prisma
model GitIntegration {
  id            String   @id @default(cuid())
  userId        String
  provider      String   // "github" | "gitlab"
  accessToken   String
  refreshToken  String?
  expiresAt     DateTime?
  user          User     @relation(fields: [userId], references: [id])
  createdAt     DateTime @default(now())
}
```

---

### Feature 4: One-Click Deploy to Vercel/Netlify

**Why:** Current deployment is simulated. Users should deploy to real hosting with one click.

**What to build:**
- Real Vercel deployment API integration
- Real Netlify deployment API integration
- One-click deploy button on the Deploy tab
- Auto-deploy after successful build
- Deployment status polling with live logs
- Custom domain configuration

**Files to create:**
```
src/features/deployment/providers/
  vercel.provider.ts            — Vercel API integration
  netlify.provider.ts           — Netlify API integration
  provider-factory.ts           — Select provider by name
```

**Files to modify:**
- `src/features/deployment/services/deployment.service.ts` — Use real providers
- `src/features/deployment/components/deploy-dialog.tsx` — Add "One-Click Deploy" button

---

### Feature 5: Smart Notifications & Toast System

**Why:** Users miss important events. Every completed step, deployment, error, and suggestion should be visible immediately.

**What to build:**
- Toast notification system (bottom-right popups)
- In-app notification center (already exists, but needs connecting)
- Email notifications for long-running tasks
- Browser push notifications

**Files to create:**
```
src/components/ui/toast.tsx               — Toast component
src/components/ui/toast-provider.tsx       — Toast context provider
src/features/notifications/
  components/
    notification-center.tsx               — Dropdown notification panel
    notification-item.tsx                 — Individual notification
  services/
    notification-realtime.service.ts      — WebSocket-based realtime
  hooks/
    use-notifications.ts
```

---

## TIER 2 — Should Have (Makes the product stand out)

### Feature 6: AI Agent Marketplace

**Why:** The marketplace module exists but is mostly placeholder. Filling it makes the platform a platform, not just a tool.

**What to build:**
- Browse, search, and install community AI agents
- Publish custom agents
- Agent ratings and reviews
- Agent configuration UI
- Pre-built agent packs (e.g., "Full-Stack Pack", "Data Science Pack", "Mobile Pack")

**Files to create/modify:**
```
src/features/marketplace/
  components/
    marketplace-browse.tsx     — Browse agents, tools, templates
    marketplace-card.tsx       — Individual marketplace item card
    marketplace-detail.tsx     — Item detail page
    marketplace-search.tsx     — Search + filter
    review-list.tsx            — User reviews
    install-button.tsx         — Install/update/uninstall
  services/
    marketplace-api.service.ts — API client for marketplace
    review.service.ts          — Review CRUD
  hooks/
    use-marketplace.ts
```

**API routes to create:**
```
src/app/api/marketplace/items/route.ts        — List/search items
src/app/api/marketplace/items/[id]/route.ts   — Item detail
src/app/api/marketplace/items/[id]/install/route.ts — Install
src/app/api/marketplace/items/[id]/reviews/route.ts — Reviews
src/app/api/marketplace/publish/route.ts      — Publish item
```

---

### Feature 7: Natural Language Database Queries

**Why:** Users should be able to ask "show me all users who signed up last week" and get results — no SQL required.

**What to build:**
- Natural language → SQL translator
- Visual query builder
- Database schema viewer (already partially exists)
- Query results table with export
- Auto-generate Prisma queries from natural language

**Files to create:**
```
src/features/database-assistant/
  components/
    nl-query-input.tsx         — Natural language input
    query-results-table.tsx    — Results display
    schema-visualizer.tsx      — Visual ER diagram
    query-history.tsx          — Previous queries
  services/
    nl-to-sql.service.ts       — Natural language → SQL
    query-executor.service.ts  — Execute + format results
  hooks/
    use-database-query.ts
```

---

### Feature 8: Visual Workflow Builder

**Why:** Instead of just the CEO → Architect → Developer → QA pipeline, users should be able to create custom workflows visually.

**What to build:**
- Drag-and-drop workflow editor
- Custom agent pipelines
- Conditional branching (if QA score > 80, deploy; else, re-develop)
- Scheduled workflows (run nightly security scan)
- Workflow templates

**Files to create:**
```
src/features/workflow-builder/
  components/
    workflow-canvas.tsx        — Drag-and-drop canvas
    workflow-node.tsx          — Individual node (agent, condition, action)
    workflow-edge.tsx          — Connection between nodes
    workflow-toolbar.tsx       — Add nodes, save, run
    workflow-sidebar.tsx       — Node palette
  services/
    workflow-engine.service.ts — Execute custom workflows
    workflow-template.service.ts — Template CRUD
  hooks/
    use-workflow-builder.ts
  stores/
    workflow-builder.store.ts  — Canvas state (nodes, edges)
```

---

### Feature 9: AI-Powered Code Review

**Why:** Before deploying, users should get an automated code review — like a senior developer reviewing PRs.

**What to build:**
- Review all changed files after a build
- Comment on specific lines
- Suggest improvements
- Security review integration
- Performance review
- Accessibility review

**Files to create:**
```
src/features/code-review/
  components/
    review-panel.tsx           — Review results panel
    review-comment.tsx         — Individual review comment
    review-summary.tsx         — Overall score + summary
    review-file-diff.tsx       — Diff with inline comments
  services/
    code-review.service.ts     — AI code review orchestration
    review-comment.service.ts  — Comment CRUD
  hooks/
    use-code-review.ts
```

---

### Feature 10: Performance Profiler & Insights

**Why:** Users need to know if their AI-generated code is fast, not just if it works.

**What to build:**
- Simulated performance profiling
- Bundle size analysis
- Lighthouse-style scoring
- Performance recommendations from AI
- Before/after comparison

**Files to create:**
```
src/features/performance/
  components/
    profiler-panel.tsx         — Performance results
    bundle-analyzer.tsx        — Bundle size breakdown
    performance-score.tsx      — Score display
    recommendation-list.tsx    — AI recommendations
  services/
    profiler.service.ts        — Run profiling
    bundle-analyzer.service.ts — Analyze bundle
  hooks/
    use-profiler.ts
```

---

## TIER 3 — Nice to Have (Makes the product exceptional)

### Feature 11: Real-Time Collaboration

**Why:** Multiple team members should work on the same project simultaneously — like Google Docs for code.

**What to build:**
- WebSocket-based real-time sync
- Cursor presence (see other users' cursors)
- Collaborative editing
- Live chat alongside code
- User avatars in the workspace

**Tech:** Use `yjs` CRDT library + WebSocket server

---

### Feature 12: AI Voice Assistant

**Why:** Users should be able to talk to their AI team hands-free.

**What to build:**
- Web Speech API integration
- Voice commands: "Create a new component", "Run the tests", "Deploy to production"
- Text-to-speech for AI responses
- Wake word detection

---

### Feature 13: Mobile App Companion

**Why:** Users should monitor builds, approve deployments, and chat with AI from their phone.

**What to build:**
- React Native mobile app
- Push notifications for build status
- Quick actions (approve deploy, re-run build)
- AI chat on mobile
- Dashboard view

---

### Feature 14: AI Training & Fine-Tuning

**Why:** The AI learning module exists. Connecting it to actual model fine-tuning would be revolutionary.

**What to build:**
- Collect successful code patterns from the platform
- Fine-tune small models on user's codebase style
- Create custom model profiles per project
- A/B test different AI models for different tasks

---

### Feature 15: Cost Dashboard & Optimization

**Why:** AI API costs can spiral. Users need visibility and control.

**What to build:**
- Real-time cost tracking per project
- Cost projections
- Budget alerts
- Model cost comparison (which model gives best quality per dollar)
- Auto-downgrade to cheaper models when budget hit
- Usage reports with export

---

### Feature 16: Plugin SDK & Extensions API

**Why:** The plugin system exists but has no SDK. A real SDK makes this a platform others build on.

**What to build:**
- Plugin SDK with TypeScript types
- Plugin scaffolding CLI (`npx create-ai-team-plugin`)
- Plugin development server with hot reload
- Plugin publishing pipeline
- Plugin documentation generator

---

## TIER 4 — Future Vision (Differentiation)

### Feature 17: AI Agent Communication
- Agents chat with each other autonomously
- CEO tells Architect what the product needs
- Architect tells Developer what to build
- Developer tells QA what to test
- Users can watch the conversation in real-time

### Feature 18: Multi-Language Code Generation
- Generate code in Python, Go, Rust, Java, Swift, Kotlin
- Auto-detect best language for the task
- Cross-language translation

### Feature 19: Infrastructure as Code
- Auto-generate Dockerfile, docker-compose.yml
- Terraform/CloudFormation generation
- Kubernetes manifest generation
- CI/CD pipeline generation (GitHub Actions, GitLab CI)

### Feature 20: AI-Powered Documentation Site
- Auto-generate a full documentation website
- Interactive API docs (Swagger/OpenAPI)
- Live code examples
- Auto-update docs when code changes

---

## Implementation Priority Matrix

| # | Feature | Impact | Effort | Priority | Phase |
|---|---------|--------|--------|----------|-------|
| 1 | AI Code Assistant Panel | ★★★★★ | Medium | P0 | Tier 1 |
| 2 | Live Preview with Hot Reload | ★★★★★ | Medium | P0 | Tier 1 |
| 3 | Real GitHub/GitLab Integration | ★★★★★ | High | P0 | Tier 1 |
| 4 | One-Click Deploy (Vercel/Netlify) | ★★★★☆ | Medium | P0 | Tier 1 |
| 5 | Smart Notifications & Toast | ★★★★☆ | Low | P0 | Tier 1 |
| 6 | AI Agent Marketplace | ★★★★☆ | High | P1 | Tier 2 |
| 7 | Natural Language DB Queries | ★★★★☆ | Medium | P1 | Tier 2 |
| 8 | Visual Workflow Builder | ★★★★☆ | High | P1 | Tier 2 |
| 9 | AI-Powered Code Review | ★★★★☆ | Medium | P1 | Tier 2 |
| 10 | Performance Profiler | ★★★☆☆ | Medium | P1 | Tier 2 |
| 11 | Real-Time Collaboration | ★★★★★ | Very High | P2 | Tier 3 |
| 12 | AI Voice Assistant | ★★★☆☆ | Medium | P2 | Tier 3 |
| 13 | Mobile App Companion | ★★★★☆ | Very High | P2 | Tier 3 |
| 14 | AI Training & Fine-Tuning | ★★★★☆ | Very High | P2 | Tier 3 |
| 15 | Cost Dashboard | ★★★☆☆ | Medium | P2 | Tier 3 |
| 16 | Plugin SDK | ★★★★☆ | High | P2 | Tier 3 |
| 17 | Agent Communication | ★★★★☆ | High | P3 | Tier 4 |
| 18 | Multi-Language Generation | ★★★☆☆ | High | P3 | Tier 4 |
| 19 | Infrastructure as Code | ★★★★☆ | Medium | P3 | Tier 4 |
| 20 | AI Documentation Site | ★★★☆☆ | Medium | P3 | Tier 4 |

---

## Recommended Implementation Order

### Phase 1: "Make It Work" (Weeks 1-2)
1. **Feature 1: AI Code Assistant** — This is the #1 missing feature. Users edit code with no AI help.
2. **Feature 5: Toast Notifications** — Quick win. Users need immediate feedback.
3. **Feature 2: Live Preview** — Replace the static preview with a real one.

### Phase 2: "Make It Real" (Weeks 3-4)
4. **Feature 3: GitHub Integration** — Connect to real repos.
5. **Feature 4: Real Deploy** — Vercel/Netlify one-click.
6. **Feature 9: AI Code Review** — Auto-review before deploy.

### Phase 3: "Make It a Platform" (Weeks 5-6)
7. **Feature 6: Marketplace** — Fill in the placeholder marketplace.
8. **Feature 7: NL Database Queries** — Make databases accessible.
9. **Feature 10: Performance Profiler** — Show code quality beyond "it works".

### Phase 4: "Make It Exceptional" (Weeks 7-8)
10. **Feature 8: Visual Workflow Builder** — Custom pipelines.
11. **Feature 15: Cost Dashboard** — AI cost control.
12. **Feature 16: Plugin SDK** — Let others extend.

---

## Technical Architecture Notes

### AI Code Assistant — Prompt Engineering Strategy

```
System: You are an expert code assistant. You help users write, understand, 
and improve code. Always return valid code. When suggesting changes, return 
a unified diff format. Be concise and direct.

Context:
- Current file: {fileName}
- Language: {language}
- File content:
{fileContent}

- Selected text (if any):
{selectedText}

User request: {userMessage}
```

### Live Preview — Architecture

```
┌─────────────────────────────────┐
│  Workspace Shell                │
│  ┌───────────┬────────────────┐ │
│  │ Editor    │ Live Preview   │ │
│  │ (Monaco)  │ (iframe)       │ │
│  │           │                │ │
│  └───────────┴────────────────┘ │
│  ┌─────────────────────────────┐ │
│  │ Console / Terminal          │ │
│  └─────────────────────────────┘ │
└─────────────────────────────────┘

Preview Server: Next.js dev server on port 3000
Preview URL: http://localhost:3000/{projectSlug}
Auto-refresh: File watcher → WebSocket → iframe refresh
```

### GitHub Integration — OAuth Flow

```
User clicks "Connect GitHub"
  → Redirect to github.com/login/oauth/authorize?client_id=...
  → GitHub redirects back to /api/git/callback?code=...
  → Exchange code for access token
  → Store in GitIntegration table
  → User can now push/pull/create repos
```

---

## OpenCode Agent Instructions

This file should be read by an OpenCode agent to implement the features described above. The agent should:

1. Read this entire document first
2. Read ALL existing source files referenced in the codebase inventory
3. Follow the existing patterns (feature module structure, ApiResult type, service layer isolation)
4. Implement one feature at a time, starting with Tier 1
5. Run `npx tsc --noEmit` after each feature to verify no type errors
6. Run `npx next build` after each phase to verify build compiles
7. Never break existing functionality
8. Always add proper TypeScript types
9. Use the existing AI gateway for all AI features
10. Use the existing Prisma schema — add new models only when necessary

### Key Files to Reference

| File | Purpose |
|------|---------|
| `src/ai/gateway/ai.gateway.ts` | AI provider gateway — use this for all AI calls |
| `src/features/deployment/services/deployment.service.ts` | Service pattern example |
| `src/app/api/projects/[id]/route.ts` | API route pattern example |
| `src/types/common.types.ts` | ApiResult type definition |
| `src/lib/api-response.ts` | toResponse helper |
| `src/lib/auth.ts` | Auth configuration |
| `src/lib/prisma.ts` | Prisma client |
| `prisma/schema.prisma` | Full database schema |
| `src/features/workspace/components/workspace-shell.tsx` | Workspace layout |
| `src/features/editor/components/editor-container.tsx` | Editor component |
