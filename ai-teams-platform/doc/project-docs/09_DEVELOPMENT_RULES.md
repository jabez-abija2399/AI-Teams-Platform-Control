# AI Teams Platform
# Development Rules


Version:

1.0


# Purpose


Define the engineering standards for building and maintaining the AI Teams Platform.



# Rule 1: Documentation First


Every significant change must be documented.

Code without understanding is forbidden.



Before implementation:

- Read architecture documents
- Review existing modules
- Understand current decisions


After implementation:

- Update relevant documentation
- Record decisions in decision log
- Update project memory



# Rule 2: Architecture Respect


## Module Boundaries


Never:

- Put business logic in UI components
- Create random folder structures
- Duplicate existing services
- Bypass module boundaries


Always:

- Follow existing patterns
- Reuse existing systems
- Maintain clear separation


## File Organization


```
src/
  modules/
    {domain}/
      components/
      services/
      schemas/
      types/
```


Each module must be self-contained.



# Rule 3: Type Safety


All code must be fully typed.

Never use:

- `any`
- Implicit types
- Type assertions without validation


Always use:

- Explicit interfaces
- Zod schemas for validation
- Strict TypeScript configuration



# Rule 4: Error Handling


Every function must handle:

- Success state
- Error state
- Loading state (if applicable)


Never:

- Ignore errors
- Use empty catch blocks
- Assume success


Always:

- Provide meaningful error messages
- Log errors appropriately
- Handle edge cases



# Rule 5: Validation


## Input Validation


All external input must be validated using Zod schemas.


## Database Validation


All database operations must validate:

- Required fields
- Data types
- Relationships
- Constraints


## API Validation


All API endpoints must validate:

- Request body
- Query parameters
- Path parameters
- Authentication



# Rule 6: Testing


Every feature requires:

- Unit tests for services
- Integration tests for API routes
- Validation tests for schemas


Test structure:

```
__tests__/
  service.test.ts
  integration.test.ts
```



# Rule 7: Code Standards


## Naming Conventions


- Files: `kebab-case.ts`
- Components: `PascalCase.tsx`
- Services: `kebab-case.service.ts`
- Types: `PascalCase.ts`
- Constants: `UPPER_SNAKE_CASE`


## Function Rules


- Functions must be small and focused
- Maximum 30 lines per function
- Single responsibility principle
- Clear, descriptive names


## Import Order


```
1. External packages
2. Internal modules
3. Relative imports
```



# Rule 8: Database Changes


## Before Changes


- Review existing schema
- Check relationships
- Understand migration impact
- Plan rollback strategy


## During Changes


- Create reversible migrations
- Add indexes for performance
- Maintain data integrity
- Document changes


## After Changes


- Verify migration success
- Test affected queries
- Update documentation



# Rule 9: AI Agent Rules


## Agent Behavior


Every AI agent must:

- Read project documentation
- Understand assigned role
- Respect module boundaries
- Follow code standards
- Update documentation


## Agent Restrictions


AI agents cannot:

- Rewrite architecture
- Delete systems
- Create duplicates
- Skip verification
- Ignore existing decisions



# Rule 10: Performance


## Database


- Use indexes for frequently queried fields
- Avoid N+1 queries
- Use pagination for lists
- Optimize joins


## Frontend


- Lazy load components
- Optimize images
- Use efficient state management
- Minimize re-renders


## API


- Implement caching where appropriate
- Use proper HTTP status codes
- Paginate large responses
- Rate limit endpoints



# Rule 11: Security


## Authentication


- All endpoints require authentication unless public
- Use secure session management
- Implement CSRF protection


## Authorization


- Validate permissions for every operation
- Implement role-based access control
- Never trust client-side validation alone


## Data Protection


- Encrypt sensitive data
- Sanitize user input
- Prevent SQL injection (Prisma handles this)
- Prevent XSS attacks


## Secrets


- Never commit secrets to repository
- Use environment variables
- Rotate secrets regularly



# Rule 12: Git Workflow


## Commits


- Use conventional commits
- Keep commits focused
- Write clear commit messages


## Branches


- Feature branches from main
- Pull request for review
- Delete merged branches



# Rule 13: Documentation Standards


## Required Documentation


Every module must have:

- README.md explaining purpose
- Type definitions
- API documentation
- Usage examples


## Decision Records


Architecture decisions must be recorded in:

`11_DECISION_LOG.md`


Include:

- Decision made
- Reasoning
- Alternatives considered
- Consequences



# Rule 14: Review Checklist


Before completing any task:


- [ ] Code follows standards
- [ ] Types are explicit
- [ ] Errors are handled
- [ ] Input is validated
- [ ] Tests are written
- [ ] Documentation updated
- [ ] Project memory updated
- [ ] No architecture violations
- [ ] No duplicate code created
- [ ] Performance considered



# Rule 15: Continuous Improvement


- Review and update rules regularly
- Learn from mistakes
- Adapt to new patterns
- Improve documentation
- Optimize workflows

