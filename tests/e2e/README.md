# E2E Tests

Playwright tests against a locally-running Next.js app + local Supabase instance.

## Prerequisites

- Local Supabase running (`supabase start`)
- Next.js dev server running **or** let `pnpm test:e2e` start it automatically
- Playwright browsers installed (one-time, see below)

## One-time setup

```bash
pnpm test:e2e:install   # installs Chromium + system deps
```

## Environment variables

The test runner needs two env vars. Export them in your shell before running any `test:e2e` command:

```bash
export NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
export SUPABASE_SERVICE_ROLE_KEY="<secret key from supabase status>"
```

Get the service role key from `supabase status` output (the "Secret" key).  
Both values are also in `.env.local` for reference.

## Running the tests

| Command | What it does |
|---------|--------------|
| `pnpm test:e2e` | Headless run, all specs |
| `pnpm test:e2e:headed` | Same but opens a visible browser |
| `pnpm test:e2e:ui` | Playwright UI mode — step through tests, time-travel debug |
| `pnpm exec playwright test tests/e2e/training-sync.spec.ts` | Run a single spec file |
| `pnpm exec playwright test --grep "offline"` | Run tests matching a name pattern |

The dev server (`pnpm dev:e2e`) is started automatically by `playwright.config.ts` if nothing is already listening on port 3030. It is reused if it's already up.

## Test structure

```
tests/e2e/
├── global-setup.ts               # seeds e2e test user + profile on first run
├── fixtures/
│   └── auth.ts                   # authenticatedPage fixture (loads saved session)
├── pages/
│   └── training-page.ts          # page-object helpers & selectRadixOption()
├── auth.spec.ts                  # unauthenticated flows (login form, redirects)
├── training.spec.ts              # lifecycle: list → create session → detail (serial)
├── training-form-validation.spec.ts  # step-1 guards, distance=0, back-button state
├── training-idempotency.spec.ts  # double-click guard, round conflict race condition
├── training-sync.spec.ts         # local-first: optimistic add, offline→online, cancel-pending
└── training-round-score.spec.ts  # manual arrow entry → save → sync clears → DB + UI show 54 pts
```

## What the suites cover

**`training.spec.ts`** — the golden path: navigate the training list, create a full session through the two-step form, verify the session detail page loads.

**`training-form-validation.spec.ts`** — form edge cases on the new-session form:
- empty distance or missing type blocks advancing to step 2
- distance `0` passes step 1 (valid string length) but is rejected at submit
- the Back button preserves react-hook-form state so Siguiente re-validates without re-filling

**`training-idempotency.spec.ts`** — server-side safety:
- submit button switches to "Creando sesión…" and disables during the in-flight transition, preventing double submission (verified by slowing the request with `page.route`)
- `createRound` returns a specific conflict message when `(session, round_number)` already exists in the DB (race condition seeded via admin API)

**`training-round-score.spec.ts`** — manual score entry and sync:
- entering "9" six times fills all arrow slots; the score summary shows 54 pts immediately
- saving the round navigates back to the session detail and the `SyncStatusIndicator` clears (not stuck) — validates the `enqueue() → drainQueue()` fix
- DB row has `total_score = 54`; a fresh page load shows "54 pts" in the round card

**`training-sync.spec.ts`** — local-first sync queue (IndexedDB → Supabase):
- improvement areas appear in the UI **before** the sync engine drains (optimistic update)
- an area added while offline queues locally; the `SyncStatusIndicator` shows "Sincronizando"; going back online drains the queue and the indicator clears (DB row confirmed)
- deleting a pending area removes the queue entry without a server call (DB stays empty)

## How authentication works

`global-setup.ts` runs once before all tests:
1. Creates `e2e-test@odiseo-archery.test` via Supabase Admin API (idempotent)
2. Manually inserts a `profiles` row (the `handle_new_user` trigger does not fire for admin-created users)
3. Logs in via a headless browser and saves the session to `tests/e2e/.auth/user.json`

Each test that needs an authenticated page uses the `authenticatedPage` fixture, which creates a new browser context from the saved session — no login overhead per test.

The `.auth/` directory is gitignored.

## Debugging a failure

```bash
# Re-run only the failed test, with a visible browser
pnpm exec playwright test --last-failed --headed

# Open the HTML report from the last run
pnpm exec playwright show-report
```

Playwright saves a screenshot, video, and `error-context.md` (page snapshot + source) for every failed test under `test-results/`.
