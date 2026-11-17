# CLAUDE.md

Guidance for working in this repo. Keep it accurate: if you change a convention here, update this file.

## What this is

EvolvePOS BackOffice (Colombia): a React SPA with two audiences behind one login page:

- **Platform** (`/platform/*`): PlatformAdmin / PlatformSubAdmin / PlatformSupervisor manage tenants, platform users, SMTP, AI settings, logs and audit.
- **Business** (`/business/*`): BusinessAdmin runs a tenant: orders (kanban), delivery, items catalog, inventory, people, reports, AI chat, settings.

Backend is a separate .NET REST API (`VITE_API_URL`). Swagger/API notes: `API_REFERENCE.md` (may be stale) and `docs/`.

## Stack

React 19, Vite 8, TypeScript 6, Tailwind 4, shadcn/Radix UI, TanStack Query 5, zustand 5 (persisted), react-router 7, react-hook-form + zod 4, i18next, axios, recharts, `@hello-pangea/dnd` (kanban). Package manager: **bun** (`bun.lock`). Do not use or commit `package-lock.json`.

## Commands

```bash
bun install --frozen-lockfile
bun run dev            # vite dev server (port 5173; falls back to the next free port)
bun run check          # format:check + typecheck + lint + test (what CI runs)
bun run typecheck      # tsc -b
bun run lint           # eslint .
bun run format         # prettier --write "**/*.{ts,tsx}"
bun run test           # vitest run (happy-dom); excludes tests/** (Playwright)
bunx vitest run path/to/file.test.ts   # single test file
bun run build          # tsc -b && vite build
```

Husky pre-commit only runs lint-staged (prettier). Lint and typecheck are **not** enforced locally, so run `bun run check` before pushing. CI (`.github/workflows/ci.yml`) runs on push/PR to `main`.

Baseline on `main` @ `be5e7e7`: format OK, typecheck OK, lint 0 errors / 1 warning, 135 tests passing.

## Running and logging in locally

`.env` needs `VITE_API_URL` (see `.env-example`; `src/config/env.ts` also reads `VITE_API_BASE_URL` and silently falls back to `http://localhost:5000`, so check which API you are hitting). The login form (`src/features/auth/components/login-form.tsx`) ships with prefilled default credentials for both tabs (business tenant and platform), so in dev you only click the submit button. Do not copy those values into docs, tests or commits.

`.claude/launch.json` defines a `backoffice-dev` server for the Claude desktop preview.

## Architecture

```
src/
  components/ui/          shadcn primitives + custom (Badge tone, ErrorState, BackLink, Markdown, CodeBlock)
  components/data-table/  DataTable, ColumnDef, pagination
  components/share/       EntityListLayout, EmptyState, StatTile, AlertDeleteDialog, ConfirmActionDialog, ...
  components/layout/      AppLayout, sidebar, navbar
  config/                 axios-client, react-query, env, features (mock flags), locale
  features/
    auth/  marketing/
    platform/<feature>/   tenants, users, email, ai-settings, logs, audit, dashboard
    business/<feature>/   orders, delivery, dashboard, items/{catalog,departments,taxes,modifiers},
                          inventory/{stock,purchase-orders,transfers,production,sales}, people/{users,suppliers,customers},
                          branches, registers, payment-methods, settings, reports, ai-chat, onboarding
  hooks/  i18n/  lib/  routes/  store/  utils/
```

Each feature folder: `components/ hooks/ pages/ schemas/ services/ types/ i18n/ utils/` (not all always present). Tests live in `__tests__/` next to the code.

### Data flow

- `services/<name>.service.ts`: plain async functions on the shared `api` axios instance (`@/config/axios-client`, paths start with `/api/...`). They map backend DTOs (`types/api.ts`) to UI types (`types/index.ts`).
- `hooks/use-*.ts`: wrap TanStack Query per entity. Pages and components call hooks, **not** services or `useQuery` directly.
- Axios request interceptor adds `Authorization: Bearer` and `X-Tenant-Id` from the store. A 401 outside `/api/Auth/*` calls `expireSession()`.
- Global state: one zustand `useAppStore` persisted as `pos-manager-storage` (session, theme, locale, onboarding drafts). Server state belongs in React Query. `useAuth()` is the facade for session, roles, login/logout.

### Routing

`src/routes/app-routes.tsx`: `PublicRoute` / `ProtectedRoute allowedRoles` / `OnboardingGate` / `AppLayout` (sidebar + navbar + `Outlet`). Roles: `PlatformAdmin`, `PlatformSubAdmin`, `PlatformSupervisor`, `BusinessAdmin`. Guards are client-side UX only; the backend must enforce permissions. There is no error boundary and no lazy loading yet.

## Conventions

- **Lists:** use `EntityListLayout` (`title`, `description`, `eyebrow`, `back`, `stats`, `toolbar`, `tabs`, `heroFooter`) with `DataTable` (`columns` built by a `build*Columns(t, actions)` factory, `isLoading`, pagination, `emptyState`, `labels`). Inventory pages are the reference implementation (`useInventoryBranch`, server pagination with `INVENTORY_PAGE_SIZE`). The items catalog still uses hand-rolled tables.
- **Forms:** react-hook-form + `zodResolver`; schemas in `schemas/`, often factories taking `t`. Use the shadcn `Form` / `FormField` set from `@/components/ui/form`. Surface errors with `form.setError("root")` plus `notify.error`. Avoid `as never` casts on the resolver; fix the schema types instead.
- **Notifications:** `notify` / `useNotify()` from `@/hooks/use-notify`. Never import `react-hot-toast` directly. Backend messages: `getApiErrorMessage(error, fallback)` from `@/utils/api-error` (do not show raw `error.message` from axios).
- **i18n:** namespace per feature (`business-items`, `platform-tenants`, ...). Use `useTranslation(ns)` from `@/i18n/use-i18n`. Spanish is default and fallback. `es.json` and `en.json` must keep identical keys. A new namespace needs the JSON files, an entry in the `Namespace` union (`use-i18n.ts`) and in `resources`/`ns` in `src/i18n/index.ts`. No hardcoded user-facing strings, including `aria-label`s.
- **Money and dates:** use `useLocaleFormat()` in components. Beware: `utils/format.ts#formatCurrency` and the hook disagree on decimals (COP has none). Money inputs are currently `type="number"`; prefer a shared money input once it exists (backlog EC-3).
- **Query keys:** prefer key factories; every mutation must invalidate everything it affects (margins, `branch-items`, production keys are commonly forgotten).
- **Naming/style:** kebab-case files, named exports (except legacy `Spinner`, `ButterflyLoading`), `@/` alias, `cn` from `@/lib/utils` (not the `cn` npm package). Code comments are mostly Spanish; commit messages and new docs follow the user's rules (conventional commits, no AI attribution lines).
- **Accessibility:** icon-only buttons need `aria-label`; clickable cards need `role`/`tabIndex`/keyboard handlers; add `htmlFor` to labels.

## Known gotchas

- Radix `Popover` inside a `Dialog` portals to `document.body`; the dialog's scroll lock blocks wheel scroll in the popover list (this is backlog EC-2). Use `modal`, a portal `container`, or stop wheel propagation.
- `DataTable` selection is keyed by row index, not id. Do not rely on `selectedIds` across pages or after refetch.
- Order status exists in the UI only through kanban columns; `NeedsReview` and `Refunded` have no column or config and disappear from the board.
- Order item name field is `nameSnapshot` in types, but the real API payload renders as `undefined` on the cards; verify the real response before touching order items.
- "Todas las sucursales" on the orders board renders empty columns even when the counter shows orders.
- Sales/production stats paginate the whole history client-side; avoid calling them in new places.
- `tests/*` is in `.gitignore`, so Playwright specs and `tests/seed/*` are not versioned. `package-lock.json` and `.atl/` are tracked by mistake.
- The sidebar items for orders/delivery/AI appear a moment after load (module/license check), which shifts layout.

## Where to look

- `docs/AUDIT.md`: full audit (2026-11-17) with prioritized findings, Jira EC-1..EC-4 root causes, test coverage and an action plan. Read it before picking up cleanup work.
- `docs/modulo-domicilios-frontend.md`: delivery module.
- `docs/revert-jhonatan-plan.md`: history of the revert that removed WhatsApp/live-tracking work and `phone.ts`.
- `TODO-CATALOG.md`: older open-bug list (unverified).

## Working agreements

- Branch off up-to-date `main`; the Jira project is `EC`. Current fix branch for the backlog: `fix/orders-backlog-ec-1-4`.
- Before opening a PR: `bun run check`. Keep commits as reviewable work units.
- When you add a screen, list page or dialog: loading, empty **and** error states, es/en strings, keyboard access, and at least a unit test for the pure logic.
