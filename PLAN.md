# Mini Office Management System: End-to-End Plan

No browsing was done for this plan. Provider details that change over time (free-tier limits, dashboard labels, exact option names) are marked **⚠ Confirm**. Check those in the official dashboards or docs before relying on them.

---

## Section 1: Project Understanding

**What we're building:** A web app where an office admin keeps employee records, employees request leave, the admin approves or rejects those requests, and a dashboard shows live statistics. Everything is stored in PostgreSQL.

**Users**
- **Admin (HR/office manager):** manages employees, reviews leave, sees the dashboard.
- **Employee:** submits leave and sees their own leave history.

**Modules**
- **A. Employees:** CRUD, search by ID/name/email, filter by department and status.
- **B. Leave:** submit, list and filter, approve or reject. Only `pending` can change, and the change is final.
- **C. Dashboard:** counts computed by SQL from real rows (employees by status and department, leave by status).

**How they connect:** Leave requests reference employees by foreign key. Approving a leave request updates one database row, and the dashboard query counts that row differently on its next load.

**What the evaluator should see you demonstrate**
1. Create an employee, refresh, and see it persist.
2. A duplicate email is rejected with a clear message.
3. Submit leave, approve it, and watch the dashboard numbers change.
4. Approving it a second time is refused.
5. Redeploy or restart, and the data is still there.
6. The live URL works on a phone.

**Assumptions (instead of questions)**
- One office, roughly under 1,000 employees, so no pagination complexity beyond a simple `limit/page`.
- Leave is simple: no balances or quotas, and no half-days.
- Departments are a fixed list (Engineering, HR, Finance, Sales, Operations, Support). It lives in one constants file on each side, not a table.
- Dates are calendar dates with no time zones.
- Leave types: `annual`, `sick`, `casual`, `unpaid`.
- Statuses are stored lowercase in the DB and API (`pending`, `approved`, `rejected`, `active`, `inactive`) and displayed capitalized in the UI.
- English only.

**Version 1 includes:** all three modules, a minimal login with two roles, deployment, and a README.
**Version 1 excludes:** password reset, email notifications, leave balances, file uploads, audit logs, dark mode, animations, and TypeScript.

---

## Section 2: Recommended Architecture
        ┌──────────── User's browser ────────────┐
        │  loads static React app from Vercel    │
        └───────┬──────────────────────┬─────────┘
                │ (1) HTML/JS/CSS      │ (2) fetch() JSON over HTTPS
                ▼                      ▼
    ┌────────────────────┐   ┌─────────────────────────────┐
    │  VERCEL            │   │  RENDER (Web Service)       │
    │  React + Vite      │   │  Node + Express REST API    │
    │  static files only │   │  validates, authorizes,     │
    │  VITE_API_URL ───────► │  runs SQL                   │
    └────────────────────┘   │  env: DATABASE_URL,         │
                             │  JWT_SECRET, CLIENT_ORIGIN  │
                             └──────────────┬──────────────┘
                                            │ (3) SQL over TLS
                                            ▼
                             ┌─────────────────────────────┐
                             │  NEON (managed PostgreSQL)  │
                             │  data lives here, not on    │
                             │  Render or Vercel           │
                             └─────────────────────────────┘
    GitHub repo ──auto-deploy──► Vercel (frontend/)  and  Render (backend/)


**Where things run**
- **React** is compiled by Vite into static files. Vercel serves them, and the code executes in the user's browser.
- **Express** is a long-running server process on Render.
- **PostgreSQL** lives on Neon's servers.

**Request flow (example: "Add employee")**
1. The form submits. The browser does `fetch(VITE_API_URL + "/api/employees", {method:"POST", ...})`.
2. Express checks CORS, then the login token, then validates the body with Zod.
3. A controller calls a database function, which runs a parameterized `INSERT`.
4. Postgres stores the row. Express replies `201` with JSON, and React updates the screen.

**Environment variables** keep configuration and secrets out of code. The same code runs everywhere, and only the values differ per environment.

**If the database is unavailable:** the pool throws, the central error handler logs it server-side, and the client gets `503 {"error":{"message":"Service temporarily unavailable"}}` with no connection details. The frontend shows a retry message. `/api/health` reports `db: "down"`.

**Persistence:** Render's disk is ephemeral and is wiped on every deploy. That's fine because the server stores nothing locally. Data lives in Neon, which is untouched by Render or Vercel restarts and redeploys.

**How you get the public URL:** Vercel gives `https://<project>.vercel.app` after the first deploy. That is your submission URL.

**Why not host Express on Vercel?** Vercel runs functions that start and stop per request. Express as written is a long-lived server. Render matches it directly, so we use Render.

---

## Section 3: Final Technology Decisions

**Database choice: Neon.**

| | Supabase | Neon |
|---|---|---|
| What it is | Backend platform (Postgres + auth + storage + auto-APIs) | Just Postgres |
| For this project | Most features go unused, and the dashboard invites confusion with Supabase Auth and Row Level Security | One connection string and you're done |
| Connection | Direct vs. pooler options with more variants to understand | Pooled and direct hosts, easy to tell apart |
| Free-tier risk | Free projects have been paused after inactivity ⚠ Confirm | Compute scales to zero and wakes on first query (small delay), but data stays ⚠ Confirm |

You want "a database," not a platform. Neon has less to learn, and a plain `pg` connection string works. Use **one Neon project**. Use its default branch as production. For local development, either create a Neon `dev` branch (recommended, nothing to install) or install Postgres locally.

| Technology | Purpose | Why | Trade-off | Where |
|---|---|---|---|---|
| React + Vite | UI | Required, fast dev server | Client-side rendering needs an SPA fallback on Vercel | `frontend/` |
| React Router | Page navigation | Several pages | One extra dependency | `frontend/` |
| Fetch API | HTTP calls | Built in, enough | Manual JSON/error handling (wrapped once in `api.js`) | `frontend/src/api` |
| Plain CSS (one file + a few component styles) | Styling | Nothing to learn | No component library polish | `frontend/` |
| Express 5 | REST API | Conventional, minimal | Hand-wired structure. v5 forwards async errors to the error handler automatically ⚠ Confirm the installed major version | `backend/` |
| `pg` + raw SQL | Database access | You see exactly what runs, and parameterized queries prevent injection | You write SQL yourself (good for explaining) | `backend/src/db` |
| **No ORM** | | An ORM adds models, schema DSLs and migrations tooling on top of learning SQL | Slightly more typing | n/a |
| Zod | Request validation | Declarative, readable schemas | One more concept | `backend/src/validation` |
| dotenv | Load `.env` locally | Standard | Production uses real env vars | backend |
| helmet | Safe HTTP headers | One line of hardening | n/a | backend |
| cors | Allow Vercel origin | Needed across domains | Must be configured precisely | backend |
| bcryptjs | Password hashing | Pure JS, no native build problems on Render | Slightly slower than native `bcrypt` (irrelevant here) | auth |
| jsonwebtoken | Login tokens | Stateless, works across Vercel and Render domains | Can't revoke before expiry (keep expiry short) | auth |
| nodemon | Auto-restart in dev | Convenience | dev only | backend |
| Node's built-in test runner + supertest | API tests | No heavy test framework | Fewer features | `backend/tests` |
| Neon | Postgres | Above | Cold start after idle | cloud |
| Render | API hosting | Runs Express | Free tier sleeps ⚠ Confirm | cloud |
| Vercel | Frontend hosting | Free static hosting, auto HTTPS | Frontend only | cloud |
| GitHub | Source and CI trigger | Both hosts deploy from it | n/a | repo |

Backend uses ES modules (`"type": "module"` in `package.json`) so frontend and backend both use `import` syntax.

---

## Section 4: Database Design

### Relationship diagram
users employees leave_requests
┌───────────────┐ ┌────────────────────┐ ┌─────────────────────┐
│ id PK │ │ id PK │ │ id PK │
│ email UNIQUE │ │ employee_code UQ │ │ employee_id FK ─────┼──► employees.id
│ password_hash │ │ full_name │ 1 N │ leave_type │ (ON DELETE RESTRICT)
│ role │ 0..1 │ email UQ (lower) │◄─────┤ start_date │
│ employee_id FK├──────►│ phone, department │ │ end_date │
│ created_at │ 1 │ designation │ │ reason │
└───────────────┘ │ joining_date │ │ status │
│ status │ │ submitted_at │
│ created_at/updated │ │ reviewed_at │
└────────────────────┘ │ reviewed_by FK→users│
│ review_note │
└─────────────────────┘


- `users`: who can log in. An employee-role user links to one employee record. An admin has `employee_id = NULL`.
- `employees`: the people. `employee_code` is the business ID (e.g. `EMP-001`), while `id` is the internal key.
- `leave_requests`: one row per request, tied to an employee.

### Initial schema (`backend/migrations/001_initial_schema.sql`)

```sql
CREATE TABLE employees (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  employee_code VARCHAR(20)  NOT NULL UNIQUE,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  department    VARCHAR(50)  NOT NULL,
  designation   VARCHAR(100) NOT NULL,
  joining_date  DATE         NOT NULL,
  status        VARCHAR(10)  NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','inactive')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
-- Case-insensitive unique email: "A@x.com" and "a@x.com" are the same person
CREATE UNIQUE INDEX employees_email_unique ON employees (lower(email));
CREATE INDEX employees_department_idx ON employees (department);
CREATE INDEX employees_status_idx     ON employees (status);

CREATE TABLE users (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         VARCHAR(255) NOT NULL,
  password_hash TEXT         NOT NULL,
  role          VARCHAR(10)  NOT NULL CHECK (role IN ('admin','employee')),
  employee_id   INTEGER UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CHECK ( (role = 'employee' AND employee_id IS NOT NULL)
       OR (role = 'admin') )
);
CREATE UNIQUE INDEX users_email_unique ON users (lower(email));

CREATE TABLE leave_requests (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  employee_id  INTEGER      NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  leave_type   VARCHAR(10)  NOT NULL
               CHECK (leave_type IN ('annual','sick','casual','unpaid')),
  start_date   DATE         NOT NULL,
  end_date     DATE         NOT NULL,
  reason       VARCHAR(500) NOT NULL,
  status       VARCHAR(10)  NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','approved','rejected')),
  submitted_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  reviewed_at  TIMESTAMPTZ,
  reviewed_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  review_note  VARCHAR(500),
  CHECK (end_date >= start_date)
);
CREATE INDEX leave_employee_idx ON leave_requests (employee_id);
CREATE INDEX leave_status_idx   ON leave_requests (status);
```

**Why the key choices**
- `CHECK` constraints are a second line of defense: even buggy code can't store `status = 'maybe'`.
- `UNIQUE (lower(email))` enforces duplicates in the database, which is the only reliable place (two simultaneous requests can both pass an app-level check).
- `TIMESTAMPTZ` stores moments in time. `DATE` stores calendar dates.

**Deleting an employee who has leave requests (decision):** `ON DELETE RESTRICT`. The API returns `409 Conflict` with the message "This employee has leave records. Mark them inactive instead." Employees with no leave history can be hard-deleted. This protects history, and "inactive" is the real-world way to retire someone. The frontend shows a confirm dialog before any delete.

**Migrations:** a numbered-SQL-files approach with a tiny runner (`backend/scripts/migrate.js`).
- Files live in `backend/migrations/`: `001_initial_schema.sql`, `002_...sql`.
- The runner creates a `schema_migrations(filename, applied_at)` table, applies each unapplied file in order inside a transaction, and records it.
- **Rule:** never edit an applied migration. Add a new numbered file.
- Run with `npm run migrate` (use the **direct** Neon connection, see Section 12).
- A separate `npm run seed` creates the admin user (and optional sample data) from env vars. It is idempotent.

---

## Section 5: Complete API Design

**Conventions**
- Base path `/api`. JSON in and out. Field names are **camelCase** in the API (`employeeCode`), **snake_case** in the DB. Map them in SQL with aliases (`employee_code AS "employeeCode"`).
- Dates are `"YYYY-MM-DD"` strings.
- Success: `{ "data": ... }`. Lists add `"meta": {"total","page","limit"}`.
- Error: `{ "error": { "message": "...", "details": [{"field","message"}] } }`.
- Auth: `Authorization: Bearer <token>`.

**HTTP verbs**
- `GET` reads and never changes data.
- `POST` creates.
- `PUT` replaces or updates the whole resource (our edit form sends every field).
- `PATCH` changes one aspect (a leave status).
- `DELETE` removes.

| Method & URL | Purpose | Input | Success | Errors / rules |
|---|---|---|---|---|
| `GET /api/health` | Render health check | none | `200 {status:"ok", db:"up"}` | `503` if DB unreachable. Public. |
| `POST /api/auth/login` | Log in | `{email,password}` | `200 {data:{token,user:{id,email,role,employeeId}}}` | `400` bad body, `401` wrong credentials (same message for unknown email or wrong password). Rate-limit this route. |
| `GET /api/auth/me` | Current user | token | `200 {data:user}` | `401` |
| `GET /api/employees` | List/search/filter | query: `search` (matches code, name, email, partial, case-insensitive), `department`, `status`, `page`=1, `limit`=20 (max 100) | `200 {data:[…],meta}`, empty list is `200 []` | `400` invalid filter value. Admin only. |
| `GET /api/employees/:id` | One employee | | `200 {data}` | `400` non-numeric id, `404`. Admin. |
| `POST /api/employees` | Create | `{employeeCode,fullName,email,phone?,department,designation,joiningDate,status?}` | `201 {data}` | `400` validation, `409` duplicate code or email (map Postgres error `23505` to a message naming the field). Admin. |
| `PUT /api/employees/:id` | Update | same fields | `200 {data}` | `400`, `404`, `409`. Admin. |
| `DELETE /api/employees/:id` | Delete | | `204` | `404`, `409` has leave records (Postgres `23503`). Admin. |
| `GET /api/leave-requests` | List/filter | `status`, `employeeId`, `search` (employee name/code), `page`, `limit` | `200 {data:[…],meta}`. Each row includes `employeeName`, `employeeCode`. | Admin sees all. Employee is **forced** to own records (server ignores `employeeId`). |
| `POST /api/leave-requests` | Submit | admin: `{employeeId,…}`, employee: `employeeId` taken from the token. Fields: `leaveType,startDate,endDate,reason` | `201 {data}` status=`pending` | `400` (missing fields, end before start, start in the past beyond a rule you set, reason too long), `404` employee not found, `409` employee inactive (optional rule). |
| `PATCH /api/leave-requests/:id/status` | Approve/reject | `{status:"approved"\|"rejected", reviewNote?}` | `200 {data}` | `400` bad status, `404`, `409` already reviewed. Admin only. |
| `GET /api/dashboard/stats` | Dashboard numbers | none | see below | Admin only. |

**Dashboard response**
```json
{ "data": {
  "employees": { "total": 12, "active": 10, "inactive": 2 },
  "byDepartment": [ {"department":"Engineering","count":5}, ... ],
  "leave": { "total": 8, "pending": 3, "approved": 4, "rejected": 1 }
}}
```
With no data: all zeros and `byDepartment: []`.

**Safe status transition (one atomic statement, no race conditions)**
```sql
UPDATE leave_requests
SET status = $1, reviewed_at = now(), reviewed_by = $2, review_note = $3
WHERE id = $4 AND status = 'pending'
RETURNING *;
```
If zero rows come back, run a lookup: not found → `404`, otherwise → `409`.

Total: 13 endpoints. No unnecessary ones.

---

## Section 6: Frontend Pages and UI

**Shared behavior**
- Every data page has four states: **loading** (text "Loading…" or a simple spinner), **empty** ("No employees match your filters"), **error** (red banner with a Retry button), and **success** (a green message after create, update, or delete, auto-dismissing).
- Disable submit buttons while a request is in flight to prevent double submits.
- Layout is a top navbar that collapses to a simple stacked menu on small screens. Tables become horizontally scrollable on mobile (`overflow-x: auto`) or card-style rows.
- Styling uses CSS variables for colors and a mobile-first approach: one column by default, with `@media (min-width: 768px)` for grids.

| Page (route) | Purpose / user sees | Actions | API calls |
|---|---|---|---|
| Login `/login` | Email, password | Log in | `POST /auth/login` |
| Dashboard `/` (admin) | 3–4 stat cards (total, active, inactive, pending leave), a department bar list, leave-status breakdown | Refresh | `GET /dashboard/stats` |
| Employees `/employees` (admin) | Search box, department and status dropdowns, table (code, name, email, department, status), pagination | Add, View, Edit, Delete (confirm) | `GET /employees`, `DELETE /employees/:id` |
| Add employee `/employees/new` | Form with inline field errors | Save, Cancel | `POST /employees` |
| Edit employee `/employees/:id/edit` | Same form, prefilled | Save | `GET /employees/:id`, `PUT /employees/:id` |
| Employee detail `/employees/:id` (nice-to-have) | Fields plus their leave history | Edit | `GET /employees/:id`, `GET /leave-requests?employeeId=` |
| Leave list `/leave` | Status filter tabs (All/Pending/Approved/Rejected), search, table with colored status badges. Admin rows show **Approve/Reject** buttons on pending items only. | Approve/Reject (with optional note) | `GET /leave-requests`, `PATCH …/status` |
| Submit leave `/leave/new` | Form: (admin: employee dropdown), type, dates, reason | Submit | `POST /leave-requests`, `GET /employees` (for admin dropdown) |

**Components:** `Navbar`, `ProtectedRoute`, `StatCard`, `EmployeeForm` (shared by add and edit), `EmployeeTable`, `LeaveTable`, `StatusBadge`, `Pagination`, `LoadingMessage`, `ErrorBanner`, `EmptyState`.
**State:** `useState` and `useEffect` only. Auth state sits in one small React context. No Redux.
**Frontend validation** mirrors the backend rules (required fields, email format, end date ≥ start date) purely for fast feedback. The backend remains the authority.

---

## Section 7: Folder Structure

mini-office-management/
├── README.md
├── .gitignore # node_modules, .env*, dist (keep .env.example)
├── docs/ # screenshots, architecture diagram
├── frontend/ # Vercel root directory
│ ├── package.json
│ ├── vite.config.js
│ ├── vercel.json # SPA fallback rewrite
│ ├── index.html
│ ├── .env.example # VITE_API_URL=http://localhost:5000
│ └── src/
│ ├── main.jsx # mounts React
│ ├── App.jsx # routes
│ ├── api/client.js # fetch wrapper: base URL, token header, error parsing
│ ├── context/AuthContext.jsx
│ ├── constants.js # departments, leave types, statuses
│ ├── pages/ # Dashboard, Employees, EmployeeNew, EmployeeEdit, EmployeeDetail, Leave, LeaveNew, Login
│ ├── components/ # Navbar, ProtectedRoute, StatCard, EmployeeForm, StatusBadge, ...
│ └── styles/main.css
└── backend/ # Render root directory
├── package.json # “type”:”module”, scripts: dev, start, migrate, seed, test
├── .env.example
├── migrations/001_initial_schema.sql
├── scripts/migrate.js, seed.js
├── tests/ # api tests
└── src/
├── server.js # reads PORT, starts listening
├── app.js # builds Express app (helmet, cors, json, routes, error handler); exported for tests
├── config/env.js # reads + checks required env vars at startup
├── db/pool.js # single pg Pool + DATE type parser
├── routes/ # auth, employees, leave, dashboard, health
├── controllers/ # take request → call db → send response
├── queries/ # all SQL lives here (employeeQueries.js, ...)
├── validation/ # Zod schemas
└── middleware/ # auth.js (verifyToken, requireRole), validate.js, errorHandler.js, notFound.js


**Request path:** `route → middleware (auth, validate) → controller → query → database`. That's four small layers, each with one job. The split between `server.js` and `app.js` lets tests import the app without opening a port.

---

## Section 8: Phased Implementation Roadmap

Each phase builds on the previous one. Don't start a phase until the previous "Done" is true.

**Phase 0: Scope and acceptance criteria** (no dependencies)
- *Goal/why:* Avoid building the wrong thing and fix field names once.
- *Tasks:* Confirm the assumptions in Section 1. Copy the API field names and status values from Sections 4–5 into `docs/contract.md`. Mark features Must / Should / Could:
  - **Must:** employees CRUD+search+filter, leave submit and approve/reject, dashboard, persistence, deployment, README, and some access protection (Phase 9).
  - **Should:** employee-role users, pagination, employee detail page, API tests.
  - **Could:** charts beyond CSS bars, leave-overlap check, CSV export, dark mode.
- *Done:* One-page contract exists.

**Phase 1: Prerequisites and repo**
- *Tasks:* Install Node.js LTS (check `node -v` ⚠ Confirm the current LTS), Git, VS Code. Create GitHub account and an empty repo `mini-office-management`. Locally:
mkdir mini-office-management && cd mini-office-management
git init && git branch -M main
git remote add origin <your-repo-url>

  Create `.gitignore` **before** the first commit.
- *Files:* `.gitignore`, `README.md` (stub).
- *Test/Done:* `git push -u origin main` shows files on GitHub.
- *Mistakes:* Committing `.env` or `node_modules`. If you ever commit a secret, **rotate it**, because deleting the file isn't enough.

**Phase 2: Scaffold frontend and backend**
- *Commands:*

npm create vite@latest frontend -- --template react
cd frontend && npm install && npm install react-router-dom && cd ..
mkdir backend && cd backend && npm init -y
npm install express cors helmet pg zod dotenv bcryptjs jsonwebtoken
npm install -D nodemon supertest

  Set `"type":"module"` and scripts (`"dev":"nodemon src/server.js"`, `"start":"node src/server.js"`) in `backend/package.json`.
- *Files:* `backend/src/app.js` and `server.js` with a `GET /api/health` that returns `{status:"ok"}`. Server listens on `process.env.PORT || 5000`.
- *Test:* `npm run dev` in each folder. Visit `http://localhost:5000/api/health` and `http://localhost:5173`.
- *Done:* Both run. Commit.
- *Mistakes:* Running commands in the wrong folder. Check your terminal path.

**Phase 3: Database provider**
- *Tasks:* Create a Neon account and project (⚠ Confirm region choice: pick one near your Render region, and note Render's region options when you create the service). Copy both connection strings from the Neon dashboard: **pooled** (host contains `-pooler`) and **direct**. ⚠ Confirm the dashboard wording. Create a `dev` branch if using the branch approach. Create `backend/.env` (gitignored) with `DATABASE_URL` and `DATABASE_URL_DIRECT`.
- *Test:* Run a one-off script that does `SELECT now()` through `pg`.
- *Done:* You see a timestamp.
- *Mistakes:* Spaces or quotes in `.env`, and pasting the password with special characters unencoded in a hand-built URL (copy the provider's string as-is).

**Phase 4: Schema and DB connection**
- *Files:* `migrations/001_initial_schema.sql`, `scripts/migrate.js`, `src/db/pool.js`, `src/config/env.js`. In `pool.js`, make the `DATE` type return plain strings: `types.setTypeParser(1082, v => v)`. Without this, `pg` returns JS `Date` objects and dates shift by time zone.
- *Command:* `npm run migrate`
- *Test:* Run migrate twice (the second time should say "nothing to apply"). Inspect tables in the Neon SQL editor. Extend `/api/health` to run `SELECT 1`.
- *Done:* Three tables exist, health shows `db:"up"`. Temporarily break the password and confirm health returns 503.

**Phase 5: Validation, error handling, employee APIs**
- *Tasks:* Build `errorHandler`, `notFound`, `validate(schema)` middleware, Zod schemas, `employeeQueries.js`, controller, routes. List query uses a parameter array and builds `WHERE` clauses from the filters that are present (**never** string-concatenate user input). Search: `employee_code ILIKE $n OR full_name ILIKE $n OR email ILIKE $n` with `'%' || term || '%'` built as a *parameter*. Map error code `23505` → 409, `23503` → 409.
- *Test:* Use Postman/Thunder Client/curl for every employee case in Section 11.
- *Done:* All employee endpoints behave per the table. Temporarily skip auth, which is added in Phase 9.
- *Mistakes:* Forgetting `app.use(express.json())`, returning 200 for errors, and leaking raw database error messages.

**Phase 6: Employee UI**
- *Tasks:* `api/client.js` (adds base URL, parses error JSON, throws errors with `message`), router, Navbar, EmployeeTable, EmployeeForm, list/add/edit pages, loading/empty/error states. Add CORS to the backend: `cors({origin: process.env.CLIENT_ORIGIN})`, with `CLIENT_ORIGIN=http://localhost:5173` locally.
- *Test:* Create, edit, delete, search and filter in the browser, then hard refresh and verify persistence. Check Neon's table view.
- *Done:* Full employee flow works with real data.
- *Mistakes:* CORS errors (origin must match exactly, with no trailing slash), and forgetting to `await`/handle the rejected `fetch`. Note that `fetch` does *not* reject on 4xx/5xx, so your client wrapper must check `response.ok`.

**Phase 7: Leave management**
- *Tasks:* Leave schema (already created), Zod rules (`endDate >= startDate`, valid dates, `reason` 1–500), queries (joined with employee name), submit and PATCH endpoints, Leave list and form pages, StatusBadge, approve/reject buttons only on `pending` rows.
- *Test:* Section 11 leave cases, including double-approval.
- *Done:* Submit → approve → status persists and buttons disappear.
- *Mistakes:* Comparing dates as strings incorrectly (ISO `YYYY-MM-DD` strings compare correctly, other formats don't), and enforcing transitions only in the UI.

**Phase 8: Dashboard**
- *Tasks:* Queries:
```sql
  SELECT COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status='active')   AS active,
         COUNT(*) FILTER (WHERE status='inactive') AS inactive
  FROM employees;
  SELECT department, COUNT(*)::int AS count FROM employees GROUP BY department ORDER BY department;
  SELECT COUNT(*) FILTER (WHERE status='pending') AS pending, ... FROM leave_requests;
```
  Postgres returns `COUNT` as a string (bigint), so cast with `::int`. Page with cards and CSS-width bars (no chart library needed).
- *Test:* Empty DB → zeros and "No data yet". Add/approve things and confirm numbers change after reload.
- *Done:* No hardcoded numbers anywhere.

**Phase 9: Authentication and authorization** (decision below)
- *Tasks:* `seed.js` creates one admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars (hash with `bcryptjs`, 10–12 rounds). Login route returns a JWT (`expiresIn: "8h"`, payload `{sub, role, employeeId}`). `verifyToken` middleware, `requireRole("admin")`. Apply to routes per the Section 5 table. Frontend: AuthContext, Login page, `ProtectedRoute`, token added to `Authorization` header in `client.js`, 401 → redirect to login. Admin can create an employee-role login either by a seed script option or an optional "Create login" button (Should-have; for v1 seeding two demo employee accounts is acceptable).
- *Test:* Call every protected endpoint with no token (401), with an employee token (403), with an admin token (200). Confirm an employee can't read another employee's leave by guessing ids.
- *Done:* Hiding buttons isn't the only protection, because the API itself refuses.

**Phase 10: Integrated testing and fixes**
- Run the full acceptance checklist (Section 11), then fix bugs with a written bug list. Add API tests for the riskiest rules (duplicate email, transitions, auth). *Done:* Every checklist item passes locally against the Neon `dev` branch.

**Phase 11: Production configuration**
- *Tasks:* Finalize `.env.example` files. Backend start reads PORT; `config/env.js` fails fast with a clear message listing any missing variables. Add `frontend/vercel.json`:
```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```
  Decide the production DB: Neon default (prod) branch, with its own `DATABASE_URL`. Generate a long random `JWT_SECRET` (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
- *Done:* Pushed to GitHub, no secrets in the repo (`git grep` for your DB password).

**Phase 12: Deploy backend to Render**
- Follow Section 12. *Done:* `https://<service>.onrender.com/api/health` returns `ok / db:up`.

**Phase 13: Deploy frontend to Vercel**
- Follow Section 12, then set `CLIENT_ORIGIN` on Render to the Vercel URL, and redeploy or restart the backend. *Done:* The live site loads and login works.

**Phase 14: Live end-to-end test**
- Run the full acceptance checklist on the live URL, on a real phone. Restart the Render service from its dashboard and confirm that data survives. *Done:* All checks pass.

**Phase 15: README, screenshots, submission**
- Section 13 structure. Take screenshots of the Dashboard, Employees, and Leave pages (and mobile). Add the live link and demo credentials (for a **demo-only** admin account with a throwaway password). *Done:* Section 15 checklist complete.

---

## Section 9: Local Development Setup

**Prerequisites:** Node.js LTS, Git, a Neon account (or local PostgreSQL), a terminal, an API client (Thunder Client in VS Code is easiest).

**Steps**
1. `git clone <repo> && cd mini-office-management`
2. `cd backend && npm install`, then copy `.env.example` → `.env` and fill it in.
3. `npm run migrate` and `npm run seed`.
4. `npm run dev` (API on `http://localhost:5000`).
5. In a second terminal: `cd frontend && npm install`, copy `.env.example` → `.env`, and run `npm run dev` (app on `http://localhost:5173`).

**How the frontend calls the backend:** `client.js` does `fetch(`${import.meta.env.VITE_API_URL}${path}`)`. Locally `VITE_API_URL=http://localhost:5000`. In production it's the Render URL.

**`backend/.env.example`** (placeholders only)
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST-pooler.region.neon.tech/DBNAME?sslmode=require
DATABASE_URL_DIRECT=postgresql://USER:PASSWORD@HOST.region.neon.tech/DBNAME?sslmode=require
JWT_SECRET=replace-with-a-long-random-string
CLIENT_ORIGIN=http://localhost:5173
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me-before-seeding


**Production values on Render** (set in the dashboard, never in files): `NODE_ENV=production`, `DATABASE_URL`, `DATABASE_URL_DIRECT` (only if migrating there), `JWT_SECRET`, `CLIENT_ORIGIN=https://<project>.vercel.app`. `PORT` is injected by Render ⚠ Confirm.

**`frontend/.env.example`**
VITE_API_URL=http://localhost:5000

Production on Vercel: `VITE_API_URL=https://<service>.onrender.com`.

**Which variables go where:** Only `VITE_API_URL` belongs to the frontend. Vite embeds `VITE_*` values into the public JavaScript, so **anything there is visible to every visitor**. Never put database URLs, JWT secrets, or admin passwords in a `VITE_` variable. Everything else stays backend-only.

**Verify persistence:** Create an employee in the UI, stop both servers, restart them, and confirm the employee still appears. Also confirm the row in the Neon SQL editor.

---

## Section 10: Validation, Security, Error Handling Checklist

**Essential**
- [ ] Frontend: required fields, email format, date order, max lengths, with inline messages (convenience only).
- [ ] Backend: Zod on every body, query param and `:id` (positive integer). Trim strings, lowercase emails, and reject unknown enum values.
- [ ] All SQL parameterized (`$1, $2`). **No** string-built SQL from user input.
- [ ] Status codes: 200, 201, 204, 400, 401, 403, 404, 409, 500, 503 used as in Section 5.
- [ ] Central error handler: logs full error server-side, returns a generic message for unexpected errors (no stack traces or SQL in production).
- [ ] Duplicates: unique indexes in DB plus mapped `23505` → `409` with a field-specific message.
- [ ] Leave validation: valid dates, `end >= start`, enum for type, reason length, employee exists. The DB has a matching `CHECK`.
- [ ] Status transitions enforced in SQL (`WHERE status='pending'`).
- [ ] CORS: allow only the exact Vercel origin (no `*`).
- [ ] Secrets only in environment variables. `.env` gitignored. Fail fast if missing.
- [ ] Auth: bcrypt hashes, JWT with expiry, server-side `requireRole`, same error for bad email or password, employees restricted to their own leave records server-side.
- [ ] Web vulnerabilities: **SQL injection** (parameters), **XSS** (React escapes output, so never use `dangerouslySetInnerHTML`), **broken access control** (server-side checks), **brute force** (rate limit login), **info leakage** (`helmet`, generic errors).
- [ ] Logging: log method, path, status, and error messages. **Never** log passwords, tokens, or the full `DATABASE_URL`.
- [ ] DB failure: pool `error` event handled, and 503 returned with a friendly message.
- [ ] JSON body size limit (`express.json({limit:"100kb"})`).
- [ ] Backups/export: Neon offers point-in-time restore on some plans ⚠ Confirm retention for your plan. Additionally run `pg_dump` periodically, or export tables to CSV, before your demo.

**Optional hardening:** HTTP-only cookies via a same-origin proxy, refresh tokens, audit log, account lockout, stricter password rules, request ID logging.

**Auth decision.** Implement it, but after the core modules work (Phase 9) and before going public. The app lets people change employee data, and a public unprotected admin interface would be irresponsible. The mechanism is a bearer JWT in the `Authorization` header, stored in `localStorage`.
- *Trade-off:* `localStorage` is readable by injected JavaScript (XSS), while httpOnly cookies are safer against that. But cookies across two domains (Vercel and Render) need `SameSite=None; Secure`, CORS credentials, and can be blocked as third-party cookies, which is a common beginner pain. For this project, bearer tokens are the practical choice, with a short expiry and React's built-in escaping as the XSS defense. Say this trade-off out loud in your evaluation.
- *If you run out of time:* deploy with at minimum an admin-only login protecting every API route except `/health` and `/auth/login`, and state that employee self-service is a known limitation.

---

## Section 11: Testing Strategy

**Manual:** Use the browser for flows and Thunder Client/curl for API edge cases (including bad data the UI wouldn't let you send).
**Automated (small but meaningful):** Using `node --test` and supertest against the Neon `dev` branch (or a test schema), cover duplicate email → 409, invalid leave dates → 400, double approval → 409, no token → 401, employee token on an admin route → 403, and dashboard counts after inserting known rows. ⚠ Never point tests at the production database.

**Acceptance checklist**

| # | Action | Expected |
|---|---|---|
| 1 | Create a valid employee | 201, appears in the list, still there after refresh |
| 2 | Create with an existing email (different letter case) | 409, "email already in use", form keeps input |
| 3 | Create with an existing employee code | 409, message names the code |
| 4 | Create with an empty name / bad email / future-absurd date | 400, field-level errors |
| 5 | `GET /api/employees/99999` | 404 |
| 6 | `GET /api/employees/abc` | 400 |
| 7 | Search "zzzz" | 200, empty list, UI shows "No employees match" |
| 8 | Search by partial name, code, and email | Matching rows |
| 9 | Filter department + status together | Intersection only |
| 10 | Edit an employee, reload | Changes persist |
| 11 | Delete an employee with no leave | 204, gone |
| 12 | Delete an employee who has leave | 409 with advice to mark inactive |
| 13 | Submit valid leave | 201, status Pending |
| 14 | Submit with end before start | 400, nothing saved |
| 15 | Submit for a nonexistent employee | 404 |
| 16 | Approve a pending request | Status Approved, buttons gone, `reviewed_at` set |
| 17 | Approve it again / reject an approved one | 409, status unchanged |
| 18 | Filter leave by Pending/Approved/Rejected | Correct rows only |
| 19 | Dashboard on empty DB | Zeros, no crash, friendly empty text |
| 20 | Dashboard after steps 13 and 16 | Counts match direct SQL counts |
| 21 | Call admin endpoints without a token / with an employee token | 401 / 403 |
| 22 | Employee views leave | Only their own, even if they alter query params |
| 23 | Wrong password login | 401, generic message |
| 24 | Break `DATABASE_URL` temporarily | 503 from API, UI error banner, no secrets exposed |
| 25 | Restart backend/redeploy | Data intact |
| 26 | Open on a 375px-wide screen | No horizontal page scroll, forms usable, tables scroll inside their container |
| 27 | Refresh on `/employees` in production | Page loads (SPA rewrite works) |

---

## Section 12: Deployment Plan

**Local vs. production differences:** URLs (`localhost` → `onrender.com` and `vercel.app`), HTTPS everywhere, secrets set in dashboards, `NODE_ENV=production`, CORS origin changes, a separate production database branch, and the build step (`vite build`).

**Step 1: Prepare GitHub.** Everything committed on `main`, `.env` ignored, `.env.example` files present, and `backend/package.json` has `"engines": {"node": ">=20"}` (pick the current LTS ⚠ Confirm). Render can also be pinned with a `NODE_VERSION` environment variable ⚠ Confirm.

**Step 2: Database (Neon).** Use the production (default) branch. Copy the pooled and direct strings. Run migrations and the seed against production **from your laptop** once:

cd backend

temporarily set DATABASE_URL_DIRECT / ADMIN_* in a shell session or a separate .env.production you never commit

npm run migrate
npm run seed



Why direct for migrations: pooled connections go through a proxy (PgBouncer) that is designed for application queries, while schema changes are safer on a direct connection ⚠ Confirm in Neon's docs. Why pooled for the app: a hosted server can open many short connections, and the pooler handles that efficiently. **SSL:** Neon requires TLS, and `sslmode=require` in the connection string handles it. If `pg` complains about SSL, ⚠ Confirm the current recommended `pg` SSL setting in Neon's Node.js guide. No IP allow-listing should be needed by default ⚠ Confirm.



**Step 3: Render backend.** New → Web Service → connect GitHub repo.

- Root Directory: `backend`

- Runtime: Node

- Build Command: `npm install` (optionally `npm install && npm run migrate` if you set `DATABASE_URL_DIRECT` on Render, so each deploy applies new migrations. This is safe because the runner is idempotent.)

- Start Command: `npm start` (`node src/server.js`)

- Health Check Path: `/api/health` ⚠ Confirm field name in Render settings

- Environment variables: from Section 9.

- Code must listen on `process.env.PORT` and, if you pass a host, use `0.0.0.0`.

- HTTPS is automatic on `onrender.com`.

- First deploy: watch **Logs**. Success looks like "API listening on port …". Visit `/api/health`.

- **Free-tier note ⚠ Confirm current policy:** free web services have historically spun down after ~15 minutes of inactivity, and the next request takes ~30–60 seconds to wake. **Demo workaround:** open the health URL a few minutes before your evaluation, and make the frontend show "Waking up the server, this can take up to a minute…" if the first request is slow. An external uptime pinger is an option but check Render's current terms. Free tiers also have monthly usage limits.



**Step 4: Vercel frontend.** Add New Project → import the repo.

- Root Directory: `frontend`

- Framework Preset: Vite

- Build: `npm run build`. Output: `dist` (Vite defaults ⚠ Confirm auto-detected)

- Environment variable: `VITE_API_URL=https://<your-service>.onrender.com` (no trailing slash)

- Deploy. Copy the `*.vercel.app` URL.

- `VITE_*` variables are baked in **at build time**, so changing one requires a redeploy.



**Step 5: Connect them.** On Render set `CLIENT_ORIGIN` to the exact Vercel URL (scheme and host, no trailing slash), then redeploy/restart. Preview deployment URLs differ from the production URL and will fail CORS unless allowed. Test with the production URL only.



**Step 6: Test live.** Run the Section 11 checklist. Open the browser DevTools Network tab and confirm API calls go to the Render URL (not localhost), return 200s, and have no CORS errors.



**Redeploy:** `git push` to `main` triggers auto-deploys on both platforms. Schema change: add a new migration file, and it applies via the build command (or run `npm run migrate` locally). Back-end change that needs new env vars: add them in the dashboard first.



**Common failures:** see Section 14.



---



## Section 13: README and Submission



**README outline**

1. Title, one-paragraph description, live URL, demo credentials (demo only)

2. Features (by module)

3. Tech stack table

4. Architecture diagram and "why this architecture" (static frontend, separate API, managed DB)

5. Database schema overview and ER diagram

6. API documentation table (from Section 5)

7. Folder structure

8. Prerequisites

9. Local setup (numbered steps from Section 9)

10. Environment variable reference (name, where, example, required?)

11. Database migrations and seeding

12. Testing instructions

13. Deployment architecture and steps

14. Screenshots (`docs/`)

15. Known limitations (free-tier cold starts, bearer token in localStorage, no password reset, single office, no leave balances, not claimed production-ready)



**Never commit:** `.env` or any file with real credentials, the database URL, `JWT_SECRET`, admin passwords, `node_modules/`, build output (`dist/`), personal data, or real employee records. If a secret leaks, rotate it immediately.



---



## Section 14: Risk Register and Troubleshooting



**Diagnosis order (always follow this):** 1) Is the backend up? (`/api/health`) → 2) Is the DB reachable? → 3) Are env vars correct? → 4) Does the frontend call the right URL? → 5) CORS → 6) Application logic. Read logs first and change one thing at a time.



| Problem | Symptom | Likely cause | Fix |

|---|---|---|---|

| DB connection error | Health returns 503, logs "ECONNREFUSED"/"password authentication failed"/SSL error | Wrong string, missing `sslmode=require`, DB paused/waking | Re-copy the string from Neon, retry after a few seconds, check SSL |

| Missing env var | Backend crashes at startup or `undefined` in logs | Variable not set on Render or `.env` not loaded | Check the dashboard spelling, redeploy |

| CORS failure | Browser console: "blocked by CORS policy" | `CLIENT_ORIGIN` mismatch, trailing slash, `http` vs `https` | Set the exact origin, restart backend |

| Wrong API URL | Requests go to `localhost` in production, or 404 | `VITE_API_URL` not set at build time | Set in Vercel, **redeploy** |

| Vercel build fails | Build log error | Wrong root directory, missing dependency, case-sensitive import paths (Linux) | Set root to `frontend`, fix file-name casing |

| Render won't start | "No open ports"/timeout | Not listening on `process.env.PORT`, wrong start command, wrong root dir | Fix `server.js`, check Start Command |

| Migration failure | SQL error in migrate output | Edited an applied migration, wrong connection | Never edit old files, add a new migration, use direct URL |

| Data not persisting | Data vanishes | Using a local file/in-memory store, or pointing to a different DB branch | Confirm `DATABASE_URL` target, check rows in Neon |

| 404 on page refresh | `/employees` works via link but not on reload | Missing SPA rewrite | Add `vercel.json` |

| Dates off by one | Dates shift a day | `Date` object timezone conversion | Use the DATE type parser (Phase 4) |

| Counts are strings | `"3"` instead of `3` | `COUNT` returns bigint | `::int` cast |

| 401 after login | Token not sent | Missing header in `client.js`, expired token | Check the Network tab's request headers |

| Slow first request | 30–60 s delay | Render free-tier sleep / Neon cold start | Warm up before the demo, show a loading message |



---



## Section 15: Final Completion Checklist



**Functional:** Employee CRUD, search and filters work · Leave submit and approve/reject work with enforced transitions · Dashboard shows live DB numbers and handles empty data · Modules reflect each other.

**Backend:** All 13 endpoints behave per spec · Zod validation everywhere · Central error handler · `/api/health` checks the DB · Binds to `PORT`.

**Database:** Migrations applied in production · Constraints and indexes present · Delete behavior documented and tested · Data survives restarts.

**Frontend:** All pages with loading/empty/error/success states · Works at 375px · SPA refresh works in production · Uses `VITE_API_URL`.

**Security:** No secrets in Git · Passwords hashed · Server-side authorization verified · CORS limited · Parameterized SQL · No sensitive data in logs.

**Testing:** Checklist items 1–27 pass locally **and** live · Key API tests pass.

**Deployment:** Vercel + Render + Neon connected · HTTPS live URL · Cold-start plan ready.

**Documentation:** README complete · `.env.example` files · Screenshots · Live link · Limitations stated.

**Evaluation readiness:** You can explain, unaided, the request flow, schema, endpoints, deployment, and auth trade-off; the demo script (Section 1) works from a cold start.



**Minimum to call it complete:** Employee and leave modules plus the dashboard work against real PostgreSQL data on the live URL, data persists across a restart, API endpoints are protected server-side, no secrets are committed, and the README lets someone else run and understand it.



---



## Final Summary



**1. Stack and hosting:** React + Vite (Vercel) → Express 5 REST API (Render) → PostgreSQL on **Neon**, raw SQL via `pg`, Zod validation, JWT auth (bcryptjs), GitHub for deployments.



**2. Architecture**



Browser ─► Vercel (React static) ─fetch/HTTPS─► Render (Express) ─SQL/TLS─► Neon (Postgres)



**3. Milestones:** M1 Repo + scaffolds (P0–2) → M2 DB + schema + health (P3–4) → M3 Employee API + UI (P5–6) → M4 Leave workflow (P7) → M5 Dashboard (P8) → M6 Auth (P9) → M7 Full local test (P10) → M8 Backend live (P11–12) → M9 Frontend live + connected (P13) → M10 Live tests, README, screenshots (P14–15).



**4. Successful submission:** A public Vercel URL where an evaluator can log in, create and search employees, submit and approve leave, see the dashboard change, and refresh or restart without losing data. It's backed by a GitHub repo with a complete README, with no secrets committed, and you can explain every layer.