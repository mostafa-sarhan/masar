# Demo Upgrade Checklist
Branch `demo-upgrade` in both repos: `express/` (API) and `sys_shipping/` (frontend).

## Phase 0 — Audit
- [x] Audit stack, Render config, roles/pages/flow, issues
- [x] Approval received (Phase 1 scope extended by user)

## Phase 1 — Cleanup & Update
- [x] Remove Render URLs/config; one API client using VITE_API_URL
- [x] .env.example for both apps; .env gitignored; untracked .env, dist, node_modules
- [x] Remove secret/user logging (issue 3)
- [x] helmet, rate limiting, CORS_ORIGINS, logout clears token (issue 5)
- [x] Roles admin/employee only (issue 6)
- [x] Archive job in server, hourly, 3 days from deliveredAt (issue 7)
- [x] Server-side pagination/filtering + barcode retry (issue 8)
- [x] xlsx -> exceljs (issue 9)
- [x] Remove dead files/packages, dev tools to devDependencies (issue 10)
- [x] Login uses bcrypt, upgrades legacy plain-text passwords on login (issue 2)
- [x] Backend admin-only authorization for orders (issue 4) — done in Phase B (#3)
- [x] Code cleanup: shared API client, session, order row/pagination components
- [x] Upgrade deps: React 19, Vite 8, ESLint 10, Express 5.3, Mongoose 9.11 (TS kept 5.9)
- [x] Verified: tsc, eslint, vite build, API end-to-end against local MongoDB
- [x] Browser check (headless Chrome): all pages, login/refresh/logout, assign, batch save, reports, merchant key

## Phase B — Security & correctness (items from PHASE_A_AUDIT.md)
- [x] Foundation: app/server split, zod validation, error + response shape, pino logs + request ids, /health DB check, graceful shutdown (#9, #10, #19, Low)
- [x] Auth: httpOnly cookies, access + refresh tokens, tokenVersion, HS256, password policy, bcrypt 12, lockout guard (#7, #11, #12)
- [x] Orders: status codes + state machine, ObjectId refs, role field whitelists, audit trail, bulk endpoints, indexes, export cap (#2, #3, #4, #6, #8, #14, #15, #16)
- [x] Merchants: hashed API keys, show once, rotate/revoke, no barcode oracle (#13)
- [x] Reports: one server-side fee formula (#5 partial); merchant net = delivered − company fee (courier fee internal)
- [x] Migration script (passwords, statuses, refs, keys)
- [x] Tests: vitest + supertest
- [x] Frontend: cookie auth, new API shape, status labels, server reports, bulk actions, print refactor, renames, CSP
- [x] #1 git history purge commands prepared in PURGE_ENV_HISTORY.md (not run)

## Phase C — SaaS (done; see PHASE_C_PLAN.md)
- [x] Groundwork: feature modules (routes → controller → service → model), transactions, rate-limit module (memory/Redis/Mongo store, TRUST_PROXY, progressive lockout), forced password change, body limits
- [x] (a) Multi-tenancy: tenantId everywhere + fail-closed plugin, plans/status/limits, owner role, platform admin (separate login, audited), access requests
- [x] (b) Tenant settings, fee snapshots at delivery, per-merchant company fee, timezone-aware dates
- [x] (c) Courier and merchant roles: courier mobile view, merchant portal
- [x] (d) Order timeline, order details panel, public tracking page
- [x] (e) Bulk actions UI, Reports page with tabs, Excel import (dry run + atomic commit)
- [x] Verified: 140+ backend tests, typecheck, build, frontend lint/build, migration from original data (twice), headless Chrome flows for every role

## ~~Phase 2 — Redesign proposal~~
Dropped: replaced by Phase C (SaaS) and Phase E (design).

## Phase E — Masar monorepo + design — done
- [x] Monorepo `masar/` (client, server, shared, docs) with both histories; old repos kept as backups
- [x] Server kebab-case files and folders; client converted to strict TypeScript, feature-based
- [x] Design system "Waybill" (light + dark, RTL, AA contrast, Readex Pro): buttons, fields, date ranges, tables that become cards on phones, modals, drawers, toasts, confirm dialogs, badges, stamps, empty states, skeletons, command search (Ctrl/⌘ K)
- [x] Every screen redesigned for every role; no `alert` / `prompt` / `confirm` left
- [x] Landing page `/welcome` with plans (no prices), request-access form (honeypot) and a live-demo section
- [x] Route-level code splitting; exceljs only loads on export
- [x] Verified: 144 server tests, typecheck, lint, build, 10 headless Chrome UI flows, 160 screenshots (desktop + mobile, light + dark)

## Final stretch (Nov 4–6) — done, except the VPS deploy
- [x] Pushed to `mostafa-sarhan/masar` (private); fresh clone builds and passes; old repos and backups deleted
      (Atlas `.env` kept outside any repo in `shipping/_private/`)
- [x] Local dev: MongoDB replica set in Docker (`npm run db:up`), `npm run seed`, clean URLs with `#/` redirects
- [x] Combobox for every growing list (Arabic-aware search, keyboard, RTL, server search, multi-select)
- [x] Egypt's 27 governorates + cities; shipping zones with per-merchant prices; price quoted on creation,
      admin-editable until delivery, locked into the fee snapshot; filters, reports, merchant API codes, Excel import
- [x] Production: Dockerfiles, compose with Mongo auth, optional HTTPS edge, daily backups (restore tested),
      Sentry hooks, draining health, deploy scripts — see [DEPLOY.md](DEPLOY.md)
- [x] Demo mode: demo company, one-click logins, hourly reset, banner + WhatsApp, restricted actions
- [x] Verified: 196 tests (shared 11, server 178, client 7), typecheck, lint, build, 17 headless Chrome flows
- [ ] Deploy to the VPS: masar.mostafasarhan.tech + demo.masar.mostafasarhan.tech, API under /api (docs/DEPLOY.md)
- [ ] Later: guided tour in the demo; off-site copy of backups
