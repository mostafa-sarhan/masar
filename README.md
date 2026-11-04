# Masar | مسار

Shipping-company management SaaS for Egypt and MENA: orders, couriers, merchants, settlements and public tracking, multi-tenant, Arabic-first.

## Repository layout

```
masar/
  client/   React 19 + Vite + TypeScript (src/app, src/features/<feature>, src/components/ui, src/lib, src/styles)
  server/   Express 5 + MongoDB API (src/modules/<feature>/*.routes|controller|service|model|schema.ts, config/, lib/, jobs/, scripts/, tests/)
  shared/   Status codes, roles, zod schemas and API types used by both
  docs/     Deploy notes, architecture plan, audit, checklist, design proposal
```

npm workspaces; one `package-lock.json` at the root.

## Requirements

- Node.js 22+
- Docker (for the local database), or any MongoDB **replica set** (transactions need one; Atlas works as is)

## Run locally

```sh
npm install
npm run db:up                                  # MongoDB 7 replica set in Docker (localhost:27018, data kept in a volume)
cp server/.env.example server/.env             # works as is for local development; set a real JWT_SECRET anyway
cp client/.env.example client/.env             # VITE_API_URL=http://localhost:5000
npm run seed                                   # demo company + one account per role (prints the logins)
npm run dev                                    # API on :5000, web on :5173
```

Then open http://localhost:5173/login and sign in with one of the printed accounts
(`owner@masar-demo.test` … `merchant@masar-demo.test`, password `Test123456`).

| Page | URL |
|---|---|
| Landing | http://localhost:5173/welcome |
| App login | http://localhost:5173/login |
| Platform console | http://localhost:5173/platform |
| Public tracking | http://localhost:5173/track/&lt;trackingId&gt; |

Platform admin (separate login): `npm run build && npm run platform-admin -w @masar/server -- you@example.com` prints a one-time password.

Existing data from the single-company version: `npm run build && npm run migrate -w @masar/server` (idempotent; also run after every deploy).

Stop the database with `npm run db:down` (data stays); `docker compose down -v` wipes it.

## Scripts (root)

| Script | What it does |
|---|---|
| `npm run dev` | Builds `shared`, then runs shared (watch), API and web together |
| `npm run build` | Builds shared, server (`server/dist`) and client (`client/dist`) |
| `npm test` | All tests: shared and client unit tests, server API tests (vitest + supertest, in-memory MongoDB replica set) |
| `npm run seed` | Builds, then creates or replaces the demo company (`SEED_*` in `server/.env`) |
| `npm run db:up` / `db:down` | Start / stop the local MongoDB replica set (Docker) |
| `npm run lint` | ESLint for all workspaces |
| `npm run typecheck` | TypeScript for all workspaces |

Set `MONGOMS_SYSTEM_BINARY=/path/to/mongod` to run the tests with a local MongoDB binary instead of downloading one.

## Documentation

- [docs/deploy-notes.md](docs/deploy-notes.md): production settings (replica set, same-site subdomains, proxy, rate limits)
- [docs/phase-c-plan.md](docs/phase-c-plan.md): multi-tenant architecture
- [docs/phase-a-audit.md](docs/phase-a-audit.md): security audit and what was fixed
- [docs/checklist.md](docs/checklist.md): project progress
- [docs/design/](docs/design/): the Waybill design direction

The docs were written before the monorepo; `express/` there means `server/`, `sys_shipping/` means `client/`.
