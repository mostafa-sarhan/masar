# Phase A: Code review and security audit

> **Status re-check (Oct 24, after Phase 1 commit `6b02408` / `a056d7c`):**
> - Already fixed by Phase 1: #18 (frontend `npm audit`: 0 vulnerabilities), Low "lint 5 errors / audit logs never displayed".
> - #1 confirmed: `.env` is in express commits bef2bd6, fe76719, 99847ca (deleted in 6b02408). sys_shipping history only has a non-secret `VITE_API_URL`.
> - Every other item is still open → Phase B.

> **Phase B result (Oct 24)** — backend `daac7ed…6416165`, frontend `942d91a`:
> - Fixed: #2, #3, #4, #6, #7, #8, #9, #10, #11, #12, #13, #14, #15, #16, #19, all Low items.
> - #5: partial as planned — one server formula (`lib/money.ts`), fees still defaults/overrides; per-company fees in Phase C.
> - #17: Phase C (barcodes now use crypto `randomInt`, still 8 digits).
> - #1: purge commands in `PURGE_ENV_HISTORY.md` — not run.
> - Low "archive cron runs inside the API process": kept by your Phase 1 decision, now optional (`RUN_JOBS=false` + `npm run archive`).
> - #19 frontend headers: CSP meta added to production builds; real headers (CSP, frame-ancestors, HSTS) go in the host config in Phase 4.

Report based on the code as of 17:25 (before Phase 1 was committed). Some items may already be fixed by Phase 1 — re-check each one and skip what's done.

Already in good shape: helmet, rate limiting (global and on login), a CORS allowlist, bcrypt, the same error message for wrong email or wrong password, escaped print HTML, and Express 5's simple query parser. The backend has 0 npm vulnerabilities and tsc passes.

## 🔴 Critical

1. **Secrets are in git history.** In express/, commits bef2bd6, fe76719 and 99847ca contain .env with MONGO_URI and JWT_SECRET. Change the DB password and the JWT secret now, and clean the history before anyone else gets the repo.

## 🟠 High

2. **Mass assignment / no validation on orders.** Order creation passes the whole request body to the DB (routes/orders.ts:133), and order edits do the same (orders.ts:146-147). Any user can set merchant, barcode, isArchived, deliveredAt or cost. status accepts any string because it has no enum (models/order.ts:35). Merchant order creation doesn't check that cost is a number, and it rejects a cost of 0 (merchants.ts:57).
3. **The server doesn't enforce who can do what.** Employees can delete any order (orders.ts:158) and edit any field, cost included. They can also download every order with its financial data through /orders/export (orders.ts:75). Those pages are hidden from employees only in the frontend (App.jsx:43-47).
4. **No audit trail for orders.** Changes to status or cost, and deletions, record nothing about who made them. AuditLog only covers user accounts.
5. **Money is calculated in the browser, and the numbers disagree.** The fees are hardcoded as 20 and never saved (Account.jsx:7-8, Company.jsx:6-7, Member.jsx:14, Alldelivery.jsx:17). ReportDelivery.jsx:74 ignores the fee input entirely. The merchant's net only subtracts the company fee in Member.jsx:93-94, but subtracts both fees in Company.jsx:57. So the same merchant shows two different amounts.
6. **Exports have no size limit.** orders.ts:77 and orders.ts:105 return the whole collection. Four admin pages download every order, archived ones included, to calculate totals in the browser (Account.jsx:21, Company.jsx:17, Member.jsx:24, ReportDelivery.jsx:18). This gets slower as data grows, can be abused to overload the server, and puts all customer personal data in the browser.
7. **Sessions:**
   - The JWT is kept in localStorage (session.js:13) and lasts 7 days.
   - Tokens can't be revoked, and changing a password or role doesn't log out existing sessions (users.ts:64, middleware/auth.ts:13).
   - jwt.verify doesn't pin the algorithm (auth.ts:11).
   - The Bearer prefix isn't checked (auth.ts:7).
8. **Order status rules exist only in the frontend.** Only Adddelivery.jsx:39 checks that an order is "pending" before assigning a courier. The API allows any status change at any time.

## 🟡 Medium

9. **No validation layer.** Fields have no length limits. A malformed id returns 500 instead of 400 (orders.ts:123,147,160).
10. **NoSQL operator injection.** findOne({ email }) accepts an object such as {"$ne":null} (auth.ts:27, users.ts:32,61,87). It doesn't bypass login because the password is still checked, but the operator reaches the DB. Fix with zod plus sanitizeFilter.
11. **Passwords:**
    - There is no password policy (users.ts:27), and bcrypt uses cost 10.
    - There is a fallback that accepts plain-text passwords (auth.ts:35-38), so plain-text passwords may still be in the DB. Migrate them and remove the fallback.
12. **Admins can lock everyone out.** An admin can demote themselves, or the last admin can be demoted (users.ts:82).
13. **Merchant API keys are stored in plain text,** listed by the API (merchants.ts:45) and shown in the UI (Member.jsx:254). They can't be rotated or revoked. Because barcodes are unique across all merchants, the 409 response lets a merchant check whether another merchant's barcode exists (merchants.ts:61).
14. **Missing indexes.** Only barcode is indexed. Needed: {isArchived, createdAt}, {delivery, status}, status, company, phone. Search uses a regex that isn't anchored to the start (orders.ts:27), so it always scans the whole collection.
15. **One request per order in batch actions.** Courier assignment sends one PATCH at a time (Adddelivery.jsx:77), and bulk save sends N in parallel (Alldelivery.jsx:63). If some fail, the orders end up in a half-updated state. These need a single bulk endpoint.
16. **Links are stored as names, not ids.** Courier and company are saved as name strings (order.ts:33-34), and reports match on names (Member.jsx:67, ReportDelivery.jsx:57). Renaming a courier or company breaks its history.
17. **Barcodes are guessable.** They are 8 digits from Math.random (order.ts:24), so they can't be used for a public tracking page.
18. **Frontend dependencies:** 18 vulnerabilities (14 high). Most are build tools, but react-router-dom, vite and exceljs are direct dependencies.
19. **Logging and headers:**
    - Raw errors are printed with console.error(err) (index.ts:37, auth.ts:45, users.ts:50). There's no structured logging and no request ids.
    - The frontend host sets no CSP or security headers.
    - Audit log listing has no pagination (users.ts:111).

## ⚪ Low

- Inconsistent API responses: some return arrays, some {items}, some {message}. Error messages mix English and Arabic.
- Order statuses are Arabic strings stored as DB values, and they're repeated as literals in 5 files instead of using utils/orderStatus. They should be codes.
- Typing: any in order.ts:46 and orders.ts:15,45; old-style extends Document interfaces; model names are inconsistent.
- Lint has 5 errors. One shows dead code: Employee.jsx:15 fetches audit logs and never displays them.
- Print code: the print-window code is duplicated in two files and uses a setTimeout workaround. Orders.jsx:16-20 creates a React root that is never unmounted (a memory leak).
- Smaller issues:
  - The delivered-date update reads then writes, so concurrent edits can race (orders.ts:45).
  - The archive cron runs inside the API process.
  - There's no graceful shutdown.
  - /health doesn't check the DB.
  - Typos in names: Archife, Dashbord, companyFree.
- No tests at all.

## Phase B scope

Fix #2–#16, #18, #19 and the Low items.

Out of scope for B:
- #1 needs the owner to change the passwords and secrets, and approve rewriting git history.
- #5 and #17 depend on the Phase C design (fees stored per company, public tracking ids). In B, only move the fee calculation to the server, using one formula.