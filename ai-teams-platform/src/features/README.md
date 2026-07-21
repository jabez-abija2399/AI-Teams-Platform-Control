# Feature Module Pattern

Every business feature lives under `src/features/<feature-name>/` and follows this exact shape:

```
features/<feature-name>/
  components/   → UI specific to this feature only
  hooks/        → React hooks specific to this feature
  services/     → Server-side business logic + Prisma access (never called from client components directly)
  schemas/      → Zod schemas + inferred types for inputs
  types/        → Feature-specific TypeScript types (re-exports Prisma types where useful)
  utils/        → Pure helper functions specific to this feature
```

## Rules

1. A feature's `services/` is the ONLY place that calls `prisma`. Components and API routes call services, never Prisma directly.
2. A feature must not import from another feature's internals. If two features need to share something, promote it to `src/lib`, `src/types`, or `src/utils` (global).
3. `schemas/` is the single source of truth for a shape — the Zod schema, its inferred TS type via `z.infer`, and validation all live together. Don't redefine the same shape elsewhere.
4. Every mutation-capable service function returns `ApiResult<T>` (see `src/types/common.types.ts`) — never throws for expected failure cases (validation, not-found, conflict). Reserve thrown exceptions for genuinely unexpected errors.
5. API routes (`src/app/api/**`) are thin: auth check → call service → map `ApiResult` to HTTP response via `toResponse()`. No business logic in route files.

## Reference implementation

`src/features/projects/` is the canonical example — copy its shape when starting a new feature.
