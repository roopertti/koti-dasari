---
name: security-audit
description: Perform a whole-project security audit covering dependencies (without version checks — leave that to existing tooling), container/image hardening, API business logic, input validation, authentication/authorization, secret handling, and frontend/UI risks. Uses the OWASP Top 10 as a baseline plus web-security best practices. Produces a prioritized report (Critical / High / Medium / Low) with a proposed fix per finding, then waits for the user to pick which fixes to apply. Invoke explicitly when the user asks for a security audit, security review of the project, or to check for vulnerabilities. Do NOT auto-trigger; do NOT apply fixes without explicit approval.
allowed-tools: Read, Glob, Grep, Bash
---

# Security Audit

A whole-project security sweep. Different from the built-in `security-review`, which scopes to the current branch's diff — this one looks at the project as it exists today, end to end.

**Invocation**: explicit only (`/security-audit` or "audit this project for security issues"). Optionally take an area argument to scope the audit (`/security-audit api`, `/security-audit ui`, `/security-audit docker`, `/security-audit deps`). With no argument, sweep all areas.

**Output mode**: Report findings, then wait for the user to choose which to fix. Do **not** edit code during the audit phase, even for "obviously safe" fixes. The user has explicitly chosen report-then-ask.

## What is NOT in scope

These are handled by other tooling or other skills — skip them, or just note "tracked by X" and move on:

- **Dependency version vulnerabilities** (CVE lookups, outdated packages). Out of scope — assume `pnpm audit`, Dependabot, or similar handles it. You may still flag *how a dependency is used* if the usage is risky, but don't grade version numbers.
- **PR-scoped diff review** — that's the `security-review` skill.
- **Lint-level code quality** — Biome handles formatting and basic correctness.

## Threat-model context for this project

Before applying generic OWASP advice, ground it in what this project actually is:

- **Personal home kiosk**, not a multi-tenant SaaS. The dashboard runs on a Raspberry Pi behind a home router.
- **No end-user auth** in the dashboard itself — the device is physically trusted.
- **LAN-exposed API** (per recent admin UI work) — anyone on the home WiFi can reach it. That's a wider threat surface than pure-localhost, but narrower than the public internet.
- **No production-grade secrets** beyond the Digitransit API key. Compromise impact is low — quota burn at worst.
- **External egress only** to known APIs (Digitransit, Open-Meteo, porssisahko.net, calendar source).

This context matters because it changes severity ratings. A missing CSRF token on an internal-only POST is Medium-at-most here; SQL injection in the admin UI is still Critical. Calibrate accordingly — don't import severities from a public-SaaS threat model verbatim.

## How to run

### Step 1 — Determine scope

Read the user's invocation:
- No argument → full sweep, all areas below.
- Argument (`api` / `ui` / `docker` / `deps` / `secrets` / `worker`) → only that area.

### Step 2 — Gather context

Read in this order before forming findings:

1. `docs/ARCHITECTURE.md` — overall shape, what's exposed where.
2. `docs/API.md` — endpoint inventory.
3. `compose.yml` / `docker-compose.yml` — service topology, exposed ports, volumes.
4. `infra/nginx/nginx.conf` and `infra/nginx/Dockerfile` — the single entry point.
5. `apps/api/src/**` — Fastify routes, validation, DB access.
6. `apps/dashboard/src/**` — auth assumptions, XSS-prone sinks.
7. `apps/worker-*/src/**` — external API calls, secret usage.
8. `packages/db/migrations/**` — schema (PII? sensitive columns?).
9. `.env`, `.env.example`, root `package.json` — secret inventory and engine pinning.
10. `.gitignore` — confirm secrets aren't trackable.

### Step 3 — Audit by area

Walk each area with the checklist below. Skip lines that don't apply. Don't pad the report with "✓ checked, fine" entries — only output findings that need action.

---

#### A. Dependencies (usage, not versions)

- **Lockfile present and committed?** (`pnpm-lock.yaml`) Without it, builds aren't reproducible — supply chain risk.
- **`engines` pinned?** Node version drift can change crypto/TLS behavior.
- **Postinstall / lifecycle scripts** in dependencies — flag any unusual ones (rare to catch without dedicated tooling, but note if you happen to see `preinstall` shenanigans in workspace packages).
- **Dynamic `require()` / `import()`** with user-controlled strings — code-injection vector.
- **`child_process.exec` / `spawn` with interpolated input** — command injection.
- **`eval`, `new Function`, `vm.runIn*`** anywhere in the codebase — flag every instance.

#### B. Container / image hardening

- **Base image**: are app images on `node:24-slim` per CLAUDE.md, and NGINX on alpine? Anything pinned to `:latest`?
- **Image runs as root?** Look for `USER` directives. App containers should drop to a non-root user.
- **Secrets baked into image layers?** Grep build steps for `ENV` with values that look like keys, or `COPY .env` in any Dockerfile.
- **Exposed ports**: does `compose.yml` publish anything beyond what NGINX needs? Internal services (api, workers, sqlite) should not be reachable from the host network unless intentional.
- **Volume mounts**: are any host paths mounted writeable into containers without need? Read-only where possible.
- **`tmpfs` / `read_only: true`** — nice-to-have for hardening, but flag only if it's a low-effort win.
- **Healthchecks** — missing healthchecks aren't a security issue per se but flag if a service can be silently failing.
- **`--privileged`, `cap_add`, `pid: host`, `network: host`** in compose — flag every occurrence.
- **NGINX config**: server tokens off? Security headers present (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, a reasonable `Content-Security-Policy`)? Body size limits set? Rate limiting on API proxy paths?

#### C. API / business logic (Fastify)

- **Input validation**: every route should validate body, params, and query via Fastify schema (JSON Schema or Zod). Flag routes without a schema, especially mutating ones.
- **SQL injection**: with Kysely you're mostly safe by construction, but flag any `sql<...>` raw template or string concatenation in queries.
- **Mass assignment**: routes that accept an object and pass it through to an insert/update without explicit field allowlisting.
- **Authorization gaps**: now that the API is LAN-exposed, consider which routes mutate state. Any reason an arbitrary LAN device shouldn't hit them? At minimum, document the assumption. If there's an admin/management subset, is it differentiated?
- **CORS**: is `@fastify/cors` configured? With what origin policy? `origin: true` reflects any origin — bad if combined with credentials.
- **Rate limiting**: any throttling on expensive endpoints (external API proxies, anything that hits a worker queue)?
- **Error handling**: are stack traces or internal error messages returned to the client in production? Fastify defaults are usually fine but verify.
- **Logging**: are request bodies / headers / secrets being logged? Look for `request.log.info(request.body)`-style patterns.
- **SSRF**: any endpoint that takes a URL from the client and fetches it server-side? Workers fetching *fixed* URLs are fine; user-controlled URLs are SSRF.
- **Path traversal**: any route reading/writing a file path constructed from user input?
- **Open redirects**: any `reply.redirect()` with a URL from the request?
- **Cookies / sessions**: if any exist, `HttpOnly`, `Secure`, `SameSite`?

#### D. Frontend / UI (React 19)

- **`dangerouslySetInnerHTML`** — flag every occurrence; verify the input is trusted.
- **`href={userControlledString}`** without scheme allowlisting — `javascript:` URI risk.
- **`window.open(userControlledUrl)`** without `noopener,noreferrer`.
- **Storing secrets in `localStorage` / `sessionStorage`** — anything that smells like a token in browser storage.
- **Exposed env vars**: Vite exposes anything prefixed `VITE_`. Confirm no `VITE_*_SECRET` or `VITE_*_KEY` is set or read.
- **Third-party scripts** loaded from CDNs without SRI hashes (uncommon here, but check `index.html`).
- **CSP compatibility**: if the frontend relies on inline styles/scripts that would break a strict CSP, note it (so a future CSP rollout is cheap).
- **Admin UI specifically**: now that there's an admin UI on the LAN, what does it expose? Any destructive action behind just a button (no confirm)? Any operation it can perform that a guest on the WiFi shouldn't be able to trigger?

#### E. Secrets & configuration

- **`.env` not in git** — verify via `git ls-files | grep -E '(^|/)\.env$'`. Should return nothing.
- **`.env.example` present and harmless** — sanity check no real keys leaked there.
- **Secrets passed via compose `environment:` block** vs. `env_file:` — both fine, but flag any hardcoded values that look real.
- **Secret scope**: does each worker only get the secrets it needs? (Worker-weather doesn't need the Digitransit key, etc.)
- **Backup destination**: if the nightly backup cron from `infra/setup-pi.sh` writes the SQLite DB somewhere, where? Off-device? Encrypted? If it contains calendar/todo data, that's PII (mild).

#### F. Workers / external APIs

- **TLS verification disabled?** Grep for `rejectUnauthorized: false`, `NODE_TLS_REJECT_UNAUTHORIZED`.
- **Retry/backoff** on external calls — not strictly security but DoS-resistance.
- **Timeout** on `fetch` calls — without one, a slow API can pin the worker indefinitely.
- **External response validation**: are responses from Digitransit/Open-Meteo/porssisahko validated before being inserted into the DB? Defensive — protects against an upstream change writing garbage to your schema.

#### G. Database (SQLite + Kysely)

- **WAL files** — confirm `*.db-wal`/`*.db-shm` aren't being committed.
- **Migrations idempotent and reversible?** Not strictly security, but a botched migration is a data-integrity event.
- **PII storage**: calendar events and todos are personal data. They're on a single-user device, so this is mostly a "be aware" note, not a critical finding — unless the DB file is shipped off-device unencrypted.

---

### Step 4 — Produce the report

Format:

```
## Security audit — <date>

Scope: <area or "full project">

### Critical
<none / 1+ findings>

### High
…

### Medium
…

### Low
…

### Out of scope / handled elsewhere
- Dependency version CVEs: tracked by pnpm audit / Dependabot
```

Each finding entry:

```
**<short title>** — `<file:line>` (or area, if cross-cutting)

What: <one sentence describing the issue>
Risk: <one sentence: what an attacker / failure mode could do, calibrated to this project's threat model>
Fix: <concrete proposed change — file paths, snippet, or steps. Not applied yet.>
```

Be specific. "Add input validation" is not a fix; "Add a JSON Schema body for `POST /api/todos` requiring `title: string (1..200)` and rejecting unknown fields" is a fix.

### Step 5 — Severity calibration

Use these rough anchors so the report isn't inflated:

- **Critical** — Remote code execution, unauthenticated DB write/delete from LAN, leaked secret in git history, command injection.
- **High** — Unauthenticated state mutation from LAN that an unaware roommate/guest could trigger; SSRF; path traversal; persistent XSS in admin UI; container running as root with host mounts.
- **Medium** — Missing security headers; permissive CORS; missing rate limit on expensive endpoint; lack of input validation that *could* feed a future bug.
- **Low** — Hardening nice-to-haves: read-only filesystem, dropped capabilities, SRI hashes, healthchecks. Defense in depth, not exploitable today.

A single-user LAN kiosk does not have "Critical: missing CSRF". Don't import enterprise severities verbatim.

### Step 6 — Wait for the user

After the report, end with:

> "Tell me which findings to fix and I'll apply them. Reply with the titles, severities (e.g. 'all High and above'), or 'all'."

Do **not** start fixing during the audit phase. Only after the user picks.

When fixing:
- Apply changes one finding at a time, smallest-blast-radius first.
- Re-run `pnpm lint` and `pnpm test` (if relevant) after each fix.
- For changes affecting runtime behavior (NGINX config, container user, CORS), call out that the user should verify in the running stack — type-checking and tests prove correctness, not runtime behavior.

## Anti-patterns to avoid

- **Padding the report** with "✓ verified, no issue" entries. Findings only.
- **Generic OWASP advice with no file:line anchor.** Every finding ties to a concrete location or "absence at <expected location>".
- **Importing public-SaaS severities** to a personal LAN kiosk. Recalibrate.
- **Auto-fixing during audit.** User has chosen report-then-ask. Honor it.
- **Repeating dependency CVE scanning.** That's tracked elsewhere — note it in "out of scope" and move on.
- **Speculative findings** ("if you ever add user auth, you'd need…"). Audit what is, not what might be. Future-state notes can go in a separate "Future considerations" section, capped at 3 bullets.
