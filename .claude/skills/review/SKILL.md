---
name: review
description: Review current changes for code quality, test coverage, and project conventions
allowed-tools: Bash(git *), Read, Grep, Glob
---

# Review Current Changes

Review all uncommitted and staged changes in the working tree.

## Step 1: Gather Changes

1. Get the diff of all staged and unstaged changes:
   ```
   git diff HEAD
   ```
2. List changed files:
   ```
   git diff HEAD --name-only
   ```

If there are no changes, check if there are commits ahead of main:
```
git log main..HEAD --oneline
```
If so, review those commits instead using `git diff main...HEAD`.

## Step 2: Code Quality

For each changed file, check:

### TypeScript
- No `any` types (except where explicitly justified)
- No `console.log` in production code (allowed in workers for operational logging)
- No hardcoded secrets, API keys, or credentials
- No unused imports
- Error handling at system boundaries

### API Routes (`apps/api/src/routes/`)
- Request validation schemas are defined
- Response shapes match `docs/API.md`
- Queries use Kysely (no raw SQL strings)
- snake_case DB columns mapped to camelCase in responses
- Correct HTTP status codes (201 create, 204 delete, etc.)
- Errors follow `{ error: { message, code } }` shape

### Database (`packages/db/`)
- Migrations have both `up` and `down`
- Kysely types in `types.ts` match migration schema
- Indexes on columns used in WHERE/ORDER BY

### Frontend (`apps/dashboard/`)
- Touch targets >= 44px, no hover-only interactions
- API calls use the client module (`src/api/`), not raw fetch
- Relative `/api/*` paths (no hardcoded URLs)
- Types from `@home-dashboard/shared` used consistently

### Workers (`apps/worker-*/`)
- Graceful shutdown handling (SIGTERM/SIGINT)
- External API errors handled (retry or skip, never crash)
- Stale data cleanup on each fetch cycle

### Docker / Infra
- Multi-stage builds; `node:24-slim` base for api/workers (better-sqlite3 prebuild compatibility), `node:24-alpine` for nginx build stage (Node 24 LTS required)
- No unnecessary files in images
- `engines` field in `package.json` must specify `>=24`

## Step 3: Test Coverage

### API Changes
- If files in `apps/api/src/routes/` changed, check for corresponding tests in `apps/api/tests/`
- Tests must cover: success path, validation errors (400), not found (404)
- **Flag missing tests as blocking** for new or modified endpoints

### UI Changes
- If files in `apps/dashboard/src/` changed, check for Playwright tests in `apps/dashboard/e2e/`
- Flag missing E2E tests as a suggestion for substantial changes

## Step 4: Biome

Check formatting and lint:
```
pnpm biome check --changed
```

## Step 5: Architecture Consistency

- Check changes against `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/API.md`
- Flag if docs need updating for new endpoints, tables, or patterns

## Output

### Review Summary

**Assessment:** PASS / NEEDS WORK

#### Blocking Issues
Issues that must be fixed. "None" if clean.

#### Suggestions
Non-blocking improvements.

#### Test Coverage
What's tested, what's missing.

#### Biome
Pass/fail.
