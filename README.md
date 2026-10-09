# Mini Office Management System

A lightweight, robust, and clean office management system featuring employee directory CRUD, leave application and atomic approval workflows, live metric dashboards, and role-based authentication.

Built with a clean, unbloated technology stack: **React (Vite) + Express 5 + PostgreSQL (Neon) + parameterized SQL with `pg`**.

---

## 🚀 Live Demo & Accounts

- **Frontend (Vercel)**: `https://<your-project>.vercel.app` (configured via `vercel.json`)
- **Backend API (Render)**: `https://<your-service>.onrender.com` (configured via `render.yaml`)

### Demo Credentials (Pre-seeded)
| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@example.com` | `admin12345` | Full access: Employees CRUD, Leave approval/rejection, Live dashboard stats |
| **Employee** | `john.doe@example.com` | `employee12345` | Self-service: Submit leave requests, View personal leave history & review status |

---

## 🛠️ Tech Stack & Design Choices

| Layer | Technology | Rationale & Trade-offs |
|---|---|---|
| **Frontend** | React 19 + Vite | Fast dev server, instant HMR, lightweight SPA bundle (<300 kB). |
| **Routing** | React Router v7 | Declarative nested routing with `<ProtectedRoute>` role gates and `<Navigate>`. |
| **Styling** | Vanilla CSS | Bespoke design system using CSS custom properties (tokens), responsive cards, data tables, and badges without Tailwind or heavy UI component libraries. |
| **Backend API** | Express 5 (Node.js) | Standard, minimal HTTP service with automatic async error propagation in Express 5. |
| **Database** | PostgreSQL on Neon | Managed serverless Postgres with instant branching, pooling via PgBouncer, and strict relational integrity. |
| **SQL Layer** | `pg` + Parameterized SQL | Direct control over queries without ORM abstraction overhead. Immune to SQL injection via `$1, $2` parameters. |
| **Validation** | Zod | Declarative schema validation for request bodies, query params, and numeric URL IDs. |
| **Authentication**| JWT + bcryptjs | Stateless Bearer token auth across separate Vercel and Render domains. |
| **Testing** | Node.js Test Runner + Supertest | Zero extra framework dependencies; executes fast API integration tests against Postgres. |

---

## 📦 Features

### 1. Employee Management (Admin Only)
- **Directory Table**: Paginated list with department badges and active/inactive status badges.
- **Search & Filters**: Instant multi-condition filtering by partial employee code, name, email, department, and status.
- **Create & Edit**: Validated forms checking required fields, phone regex, unique email (case-insensitive `lower(email)`), and employee code uniqueness.
- **Safe Deletion**: Relational integrity (`ON DELETE RESTRICT`) prevents deleting employees who have leave history with an informative conflict error (`409 Conflict`).

### 2. Leave Request Management
- **Self-Service Submission**: Employees submit leave requests with date range verification (`end_date >= start_date`), leave type (`annual`, `sick`, `casual`, `unpaid`), and reason.
- **Employee Isolation**: Non-admin users are strictly scoped on the server side to their own leave requests; employee ID query tampering is ignored.
- **Atomic Review Workflow**: Admins approve or reject pending requests with an optional note. Transitions use atomic SQL guards (`WHERE id = $4 AND status = 'pending'`) to guarantee that double reviews return `409 Conflict`.

### 3. Executive Dashboard (Admin Only)
- **Real-Time SQL Aggregations**:
  - Total active employees
  - Pending leave requests requiring attention
  - Approved leaves currently ongoing today (`CURRENT_DATE BETWEEN start_date AND end_date`)
  - Department headcount distribution visualized with proportional CSS bar charts.

---

## 🗄️ Database Architecture

### Entity Relationship Diagram
```
 users                          employees                      leave_requests
┌──────────────────┐           ┌────────────────────┐         ┌─────────────────────┐
│ id (PK)          │           │ id (PK)            │         │ id (PK)             │
│ email (UNIQUE)   │           │ employee_code (UQ) │         │ employee_id (FK)────┼──► employees.id
│ password_hash    │           │ full_name          │ 1     N │ leave_type          │    (ON DELETE RESTRICT)
│ role             │           │ email (lower, UQ)  │◄────────┤ start_date          │
│ employee_id (FK)─┼──┐        │ department         │         │ end_date            │
│ created_at       │  │        │ designation        │         │ reason              │
└──────────────────┘  │        │ joining_date       │         │ status              │
                      │ 0..1   │ status             │         │ submitted_at        │
                      └───────►│ created_at         │         │ reviewed_at         │
                               └────────────────────┘         │ reviewed_by (FK)────┼──► users.id
                                                              │ review_note         │
                                                              └─────────────────────┘
```

---

## 📡 API Reference

All protected endpoints require `Authorization: Bearer <token>`.

### Authentication
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Sign in with email and password, returns JWT token and user profile. |
| `GET` | `/api/auth/me` | Authenticated | Fetch current authenticated user info. |

### Employees
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/employees` | Admin | List employees with pagination (`page`, `limit`), `search`, `department`, `status`. |
| `POST` | `/api/employees` | Admin | Create employee. Validates uniqueness of code and email. |
| `GET` | `/api/employees/:id` | Admin | Get single employee by numeric ID. |
| `PUT` | `/api/employees/:id` | Admin | Update employee fields. |
| `DELETE` | `/api/employees/:id` | Admin | Delete employee. Returns `409` if leave history exists. |

### Leave Requests
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/leave-requests` | Authenticated | List leave requests (admins view all, employees view only their own). |
| `POST` | `/api/leave-requests` | Authenticated | Submit new leave request. |
| `PATCH` | `/api/leave-requests/:id/status` | Admin | Approve or reject pending leave (`{ status: 'approved'\|'rejected', reviewNote }`). |

### Dashboard & Health
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | Admin | Live KPI aggregates and department breakdown. |
| `GET` | `/api/health` | Public | System liveness probe checking Postgres pool connection. |

---

## 💻 Local Setup & Development

### Prerequisites
- Node.js >= 20.x
- Neon PostgreSQL project (or local Postgres instance)

### 1. Clone & Install
```bash
git clone <repository-url>
cd mini-office-management

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Environment Setup
Create `backend/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://USER:PASSWORD@HOST-pooler.region.neon.tech/neondb?sslmode=require
DATABASE_URL_DIRECT=postgresql://USER:PASSWORD@HOST.region.neon.tech/neondb?sslmode=require
JWT_SECRET=supersecretlocaljwtkey
CLIENT_ORIGIN=http://localhost:5173
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin12345
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
```

### 3. Run Database Migrations & Seeds
```bash
cd backend
npm run migrate   # Idempotent migration runner applying SQL in order
npm run seed      # Creates default admin and employee accounts
```

### 4. Run Development Servers
In Terminal 1 (Backend):
```bash
cd backend
npm run dev       # Starts Express with nodemon on http://localhost:5000
```

In Terminal 2 (Frontend):
```bash
cd frontend
npm run dev       # Starts Vite dev server on http://localhost:5173
```

---

## 🧪 Testing

The backend includes a comprehensive integration test suite covering the full acceptance checklist:

```bash
cd backend
npm test
```
**Test Coverage Includes:**
- Admin login, invalid password rejection, nonexistent user handling
- Token verification and role gate rejection (401 without token, 403 for insufficient role)
- Employee CRUD: unique email constraint, unique code constraint, missing field validation, deletion protection with leave records
- Leave request validation: end date before start date, nonexistent employee 404, atomic status transitions, double-review 409 conflict
- Employee data isolation: ensuring non-admins cannot query or spoof another employee's records
- Dashboard statistical counts

---

## 🌐 Production Deployment

### 1. Database (Neon)
1. Run migrations and seed from your laptop pointing to your Neon database:
   ```bash
   cd backend
   npm run migrate
   npm run seed
   ```

### 2. Backend (Render)
1. In the Render Dashboard, click **New > Web Service** and connect your GitHub repository.
2. Select:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
3. Configure Environment Variables on Render:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: `your Neon pooled connection string`
   - `JWT_SECRET`: `secure random 64-char string`
   - `CLIENT_ORIGIN`: `https://your-frontend.vercel.app` (set after creating Vercel app)

### 3. Frontend (Vercel)
1. In the Vercel Dashboard, import your GitHub repository.
2. Select:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
3. Set Environment Variable:
   - `VITE_API_URL`: `https://your-render-service.onrender.com` (no trailing slash)
4. Deploy. Vercel automatically honors `frontend/vercel.json` for client-side routing rewrites.
5. Update `CLIENT_ORIGIN` on Render with your Vercel URL and restart the web service.

---

## 📄 License
MIT License.
