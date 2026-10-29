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
- MongoDB as a **replica set** (transactions). Atlas works as is; locally: `mongod --replSet rs0` then `rs.initiate()` once.

## Getting started

```sh
npm install
cp server/.env.example server/.env    # set MONGO_URI, JWT_SECRET, CORS_ORIGINS=http://localhost:5173, COOKIE_SECURE=false
cp client/.env.example client/.env    # VITE_API_URL=http://localhost:5000
npm run build                         # migrate / platform-admin run from server/dist
npm run migrate -w @masar/server      # idempotent; turns existing data into the first tenant
npm run platform-admin -w @masar/server -- you@example.com   # prints a one-time password
npm run dev                           # shared (watch) + API on :5000 + web on :5173
```

## Scripts (root)

| Script | What it does |
|---|---|
| `npm run dev` | Builds `shared`, then runs shared (watch), API and web together |
| `npm run build` | Builds shared, server (`server/dist`) and client (`client/dist`) |
| `npm test` | Server test suite (vitest + supertest, in-memory MongoDB replica set) |
| `npm run lint` | ESLint for all workspaces |
| `npm run typecheck` | TypeScript for all workspaces |

Set `MONGOMS_SYSTEM_BINARY=/path/to/mongod` to run the tests with a local MongoDB binary instead of downloading one.

## Documentation

- [docs/deploy-notes.md](docs/deploy-notes.md): production settings (replica set, same-site subdomains, proxy, rate limits)
- [docs/phase-c-plan.md](docs/phase-c-plan.md): multi-tenant architecture
- [docs/phase-a-audit.md](docs/phase-a-audit.md): security audit and what was fixed
- [docs/checklist.md](docs/checklist.md): project progress
- [docs/design-proposal/](docs/design-proposal/): design directions (Waybill chosen)

The docs were written before the monorepo; `express/` there means `server/`, `sys_shipping/` means `client/`.
