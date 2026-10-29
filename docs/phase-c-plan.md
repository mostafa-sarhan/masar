# Phase C — SaaS architecture

> **Status: implemented (Oct 29).** Backend commits fde69b4 (groundwork), 0d19d10 (a), 7dbfe63 (b), a63e78b (c), 89aa691 (d), 3d93964 (e); frontend c4f01a5, 0aa5212, 81c5384, 2bb0f1b, 8485d9e, 6d8280e.
> Approved changes vs. this proposal: barcode unique **per tenant**; tenant subscription fields (plan, status trial/active/suspended, trialEndsAt, maxUsers, maxOrdersPerMonth); platform admin with its own login, every action audited; AccessRequest model; forced password change for one-time passwords; rate-limit module; Excel import inside a transaction.
> Phase order: C → E (design) → Demo mode → Deploy.

Goal: one deployment serves many shipping companies (tenants), fully isolated, on `app.` + `api.` same-site subdomains.

## 1. Tenancy
- **Shared DB, `tenantId` on every tenant-owned document.** One DB per tenant was rejected: migrations, cron and backups would multiply, and the code is already centralised on `scope(req)`.
- **The tenant comes from the logged-in user**, not the URL: the access token carries `tid`, and `requireAuth` loads the user and the tenant. No wildcard subdomains or cookies, so `SameSite=Strict` stays.
- **Isolation is enforced 3 ways:**
  1. `scope(req)` returns `{ tenantId }` and every query already goes through it.
  2. A Mongoose plugin that **fails closed**: a query on a tenant model without `tenantId` throws.
  3. Cross-tenant tests on every endpoint: tenant A can't read, change or report on B's ids.
- **Suspended tenants are rejected** at login, refresh and `requireAuth`.

## 2. Roles (per tenant)
| Role | Can do |
|---|---|
| owner | everything + Settings; the last owner can't be removed |
| admin | today's admin |
| employee | today's employee |
| courier (linked to a Courier) | only their open orders: mark delivered / returned / refused |
| merchant (linked to a Merchant) | own orders, create orders, own statement, own API key |
| platform_admin (no tenant) | create / suspend tenants (`/platform`) |

## 3. Data model changes
| Model | Change |
|---|---|
| **Tenant** (new) | `name, slug, status, settings: { fees: {courier, company}, merchantDeductions: ["company"], archiveAfterDays: 3, timezone: "Africa/Cairo", currency: "EGP", labelName, logo }` |
| User | `+ tenantId` (null only for platform_admin), roles above, `+ courierId?`, `+ merchantId?`; email stays globally unique |
| Order | `+ tenantId`, `+ trackingId` (random, public), `+ statusHistory[{status, at, by, note}]`, `+ fees {courier, company}` snapshot written on delivery, `+ reason` for returned/refused |
| Courier | `+ tenantId, phone, active`; unique `{tenantId, name}` |
| Merchant | `+ tenantId, phone`, `+ companyFee?` (per-merchant override); unique `{tenantId, name}`; the API key resolves the tenant |
| AuditEvent, RefreshToken | `+ tenantId` |
| Indexes | `tenantId` first in every compound index; `barcode` and `trackingId` stay globally unique (scanner, public link) |

## 4. Money
- **Fees and deductions are tenant settings** (fees per order, plus which fees are deducted from the merchant; the default is the company fee only). A merchant can have its own company-fee override.
- **Fees are snapshotted on the order at delivery.** Reports add up the snapshots, so a settings change never rewrites past statements. The fee query params stay only as an admin "what-if".
- **Day boundaries use the tenant's timezone** instead of UTC.

## 5. Features
- **Settings page** (owner/admin): fees, deductions, archive days, timezone, label name/logo.
- **Order details panel:** order data plus a status timeline and audit history.
- **Courier mobile view** (`/courier`):
  - my open orders, with call and map buttons
  - one-tap delivered / returned / refused, with a reason
  - my totals for the day
- **Merchant portal** (`/portal`): own orders, create order, own statement, rotate own API key.
- **Bulk actions on Orders:** select rows, then assign a courier, change status or print labels (uses the existing bulk endpoints).
- **Reports page with tabs:** Summary · Merchants · Couriers · Statement. It replaces Accounts, Companies, Merchants and Courier reports.
- **Excel import:**
  - .xlsx up to 2 MB and 1,000 rows, with a downloadable template
  - a dry run first, with errors per row
  - then an all-or-nothing commit
- **Public tracking page** `/track/:trackingId` (#17): status timeline only, no phone or address, rate-limited.

## 6. Migration (idempotent, like Phase B)
- Create one tenant from the current data.
- Set `tenantId` everywhere.
- Make the first admin the owner.
- Seed settings from the current env defaults.
- Backfill `trackingId`.
- Build `statusHistory` from AuditEvents, or from the current status where there are none.
- Snapshot fees on delivered orders using the current defaults.

## 7. Order of work (one commit each) — all done
- **C1:** tenancy core, migration, fail-closed plugin, cross-tenant tests
- **C2:** settings, fee snapshots, timezone-aware reports
- **C3:** courier and merchant roles and their views
- **C4:** order details and timeline, public tracking
- **C5:** bulk actions UI, Reports tabs, Excel import

Demo mode (old Phase 3) gets simpler on top of this: the demo is one tenant, and a reset wipes and reseeds only that tenant.

**Later, not in C:** self-signup with email verification, billing and plans, custom domains per tenant, SMS/WhatsApp notifications.
