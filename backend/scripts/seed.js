import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('FATAL: Database connection string missing.');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });

async function seed() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';
  const employeeEmail = 'john.doe@example.com';
  const employeePassword = 'employee12345';

  console.log(`Checking admin account (${adminEmail})...`);
  const existingAdmin = await pool.query(
    'SELECT id, email, role FROM users WHERE lower(email) = lower($1)',
    [adminEmail]
  );

  if (existingAdmin.rows.length === 0) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await pool.query(
      `INSERT INTO users (email, password_hash, role, employee_id)
       VALUES ($1, $2, 'admin', NULL)`,
      [adminEmail, passwordHash]
    );
    console.log(`✓ Admin user created: ${adminEmail}`);
  } else {
    // Ensure password is up to date with config
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, existingAdmin.rows[0].id]
    );
    console.log(`✓ Admin user verified/updated: ${adminEmail}`);
  }

  console.log(`Checking demo employee account (${employeeEmail})...`);

  // Ensure employee record exists
  let empRes = await pool.query(
    'SELECT id, employee_code, email FROM employees WHERE lower(email) = lower($1)',
    [employeeEmail]
  );

  let employeeId;
  if (empRes.rows.length === 0) {
    // Generate a unique employee code or use EMP-002
    const codeCheck = await pool.query("SELECT id FROM employees WHERE employee_code = 'EMP-002'");
    const empCode = codeCheck.rows.length === 0 ? 'EMP-002' : `EMP-${Date.now().toString().slice(-4)}`;

    const newEmp = await pool.query(
      `INSERT INTO employees (employee_code, full_name, email, phone, department, designation, joining_date, status)
       VALUES ($1, 'John Doe', $2, '555-0199', 'Engineering', 'Frontend Developer', '2024-02-01', 'active')
       RETURNING id`,
      [empCode, employeeEmail]
    );
    employeeId = newEmp.rows[0].id;
    console.log(`✓ Demo employee record created: John Doe (${employeeEmail})`);
  } else {
    employeeId = empRes.rows[0].id;
    console.log(`✓ Demo employee record exists: ID ${employeeId}`);
  }

  // Ensure user login account exists for john.doe@example.com
  const existingUser = await pool.query(
    'SELECT id, email FROM users WHERE lower(email) = lower($1)',
    [employeeEmail]
  );

  const empPasswordHash = await bcrypt.hash(employeePassword, 10);

  if (existingUser.rows.length === 0) {
    await pool.query(
      `INSERT INTO users (email, password_hash, role, employee_id)
       VALUES ($1, $2, 'employee', $3)`,
      [employeeEmail, empPasswordHash, employeeId]
    );
    console.log(`✓ Demo employee login account created: ${employeeEmail} / ${employeePassword}`);
  } else {
    await pool.query(
      'UPDATE users SET password_hash = $1, role = $2, employee_id = $3 WHERE id = $4',
      [empPasswordHash, 'employee', employeeId, existingUser.rows[0].id]
    );
    console.log(`✓ Demo employee login account verified/updated: ${employeeEmail} / ${employeePassword}`);
  }

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
