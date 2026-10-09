CREATE TABLE IF NOT EXISTS employees (
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

CREATE UNIQUE INDEX IF NOT EXISTS employees_email_unique ON employees (lower(email));
CREATE INDEX IF NOT EXISTS employees_department_idx ON employees (department);
CREATE INDEX IF NOT EXISTS employees_status_idx     ON employees (status);

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         VARCHAR(255) NOT NULL,
  password_hash TEXT         NOT NULL,
  role          VARCHAR(10)  NOT NULL CHECK (role IN ('admin','employee')),
  employee_id   INTEGER UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CHECK ( (role = 'employee' AND employee_id IS NOT NULL)
       OR (role = 'admin') )
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (lower(email));

CREATE TABLE IF NOT EXISTS leave_requests (
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

CREATE INDEX IF NOT EXISTS leave_employee_idx ON leave_requests (employee_id);
CREATE INDEX IF NOT EXISTS leave_status_idx   ON leave_requests (status);
