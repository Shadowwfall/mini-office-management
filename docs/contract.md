# Project Contract: Mini Office Management System

## 1. Scope & Priorities

### Must-Have (v1 Core)
- **Employees Module**: CRUD operations, search (by code, name, email), filter by department and status.
- **Leave Management Module**: Submit leave request, list and filter by status, admin approve/reject (final transition from `pending`).
- **Dashboard Module**: Live stats computed via SQL (employees by status/dept, leave requests by status).
- **Persistence & Cloud DB**: Managed PostgreSQL (Neon) with strict constraints and migrations.
- **Authentication & Authorization**: Admin and employee authentication (JWT), role-based endpoint access control.
- **Production Deployment & Docs**: Backend on Render, Frontend on Vercel, comprehensive README.

### Should-Have
- Employee-role self-service view (restricted to own leave requests).
- Simple pagination (`page`, `limit`).
- Employee detail view with leave history.
- API tests using Node test runner + supertest.

### Could-Have (Post-v1)
- Graphical charts beyond CSS bar indicators.
- Date overlap validation for leave.
- CSV export.
- Dark mode.

---

## 2. Constants & Allowed Values

- **Departments**: `Engineering`, `HR`, `Finance`, `Sales`, `Operations`, `Support`
- **Employee Statuses**: `active`, `inactive`
- **Leave Types**: `annual`, `sick`, `casual`, `unpaid`
- **Leave Statuses**: `pending`, `approved`, `rejected`
- **User Roles**: `admin`, `employee`

---

## 3. Data Models & Field Mappings

### Employees
| API Field (camelCase) | DB Column (snake_case) | Type | Notes |
|---|---|---|---|
| `id` | `id` | INTEGER | PK, auto-generated |
| `employeeCode` | `employee_code` | VARCHAR(20) | UNIQUE, required |
| `fullName` | `full_name` | VARCHAR(100) | Required |
| `email` | `email` | VARCHAR(255) | Case-insensitive UNIQUE, required |
| `phone` | `phone` | VARCHAR(20) | Optional |
| `department` | `department` | VARCHAR(50) | Required enum |
| `designation` | `designation` | VARCHAR(100) | Required |
| `joiningDate` | `joining_date` | DATE (YYYY-MM-DD) | Required |
| `status` | `status` | VARCHAR(10) | Default `'active'`, check `('active','inactive')` |
| `createdAt` | `created_at` | TIMESTAMPTZ | Default `now()` |
| `updatedAt` | `updated_at` | TIMESTAMPTZ | Default `now()` |

### Users (Auth)
| API Field | DB Column | Type | Notes |
|---|---|---|---|
| `id` | `id` | INTEGER | PK, auto-generated |
| `email` | `email` | VARCHAR(255) | Case-insensitive UNIQUE, required |
| `passwordHash` | `password_hash` | TEXT | bcrypt hash (not exposed in API) |
| `role` | `role` | VARCHAR(10) | `'admin'` or `'employee'` |
| `employeeId` | `employee_id` | INTEGER | FK -> `employees.id`, null for admin |
| `createdAt` | `created_at` | TIMESTAMPTZ | Default `now()` |

### Leave Requests
| API Field | DB Column | Type | Notes |
|---|---|---|---|
| `id` | `id` | INTEGER | PK, auto-generated |
| `employeeId` | `employee_id` | INTEGER | FK -> `employees.id` (ON DELETE RESTRICT) |
| `leaveType` | `leave_type` | VARCHAR(10) | Check `('annual','sick','casual','unpaid')` |
| `startDate` | `start_date` | DATE (YYYY-MM-DD) | Required |
| `endDate` | `end_date` | DATE (YYYY-MM-DD) | Required, `endDate >= startDate` |
| `reason` | `reason` | VARCHAR(500) | Required (1-500 chars) |
| `status` | `status` | VARCHAR(10) | Default `'pending'`, check `('pending','approved','rejected')` |
| `submittedAt` | `submitted_at` | TIMESTAMPTZ | Default `now()` |
| `reviewedAt` | `reviewed_at` | TIMESTAMPTZ | Nullable |
| `reviewedBy` | `reviewed_by` | INTEGER | FK -> `users.id` (SET NULL) |
| `reviewNote` | `review_note` | VARCHAR(500) | Optional |

---

## 4. API Endpoints Contract

- Base URL: `/api`
- Content-Type: `application/json`
- Success Envelope: `{ "data": ... }` (+ `"meta": { "total", "page", "limit" }` for lists)
- Error Envelope: `{ "error": { "message": "...", "details": [...] } }`

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | Public | Healthcheck (`{ status: "ok", db: "up" }`) |
| `POST` | `/api/auth/login` | Public | Authenticate user, returns JWT & user object |
| `GET` | `/api/auth/me` | Authenticated | Current user details |
| `GET` | `/api/employees` | Admin | List & search employees (`search`, `department`, `status`, `page`, `limit`) |
| `GET` | `/api/employees/:id` | Admin | Get single employee |
| `POST` | `/api/employees` | Admin | Create employee (unique code & email) |
| `PUT` | `/api/employees/:id` | Admin | Update employee fields |
| `DELETE` | `/api/employees/:id` | Admin | Delete employee (fails if leave records exist) |
| `GET` | `/api/leave-requests` | Authenticated | List leave requests (admin sees all, employee sees self) |
| `POST` | `/api/leave-requests` | Authenticated | Submit leave request (status starts as `pending`) |
| `PATCH` | `/api/leave-requests/:id/status` | Admin | Update status (`approved` or `rejected`), only allowed if `pending` |
| `GET` | `/api/dashboard/stats` | Admin | Aggregated stats for employees and leave |
