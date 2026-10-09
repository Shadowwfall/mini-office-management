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
    console.log(`✓ Admin user already exists: ${adminEmail}`);
  }

  // Seed sample employee + employee-role user if database has no employees
  const empCount = await pool.query('SELECT COUNT(*)::int AS count FROM employees');
  if (empCount.rows[0].count === 0) {
    console.log('Seeding demo employee and employee login...');
    const empRes = await pool.query(
      `INSERT INTO employees (employee_code, full_name, email, phone, department, designation, joining_date, status)
       VALUES ('EMP-001', 'Demo Employee', 'demo.employee@example.com', '555-0100', 'Engineering', 'Software Engineer', '2024-01-10', 'active')
       RETURNING id`
    );
    const empId = empRes.rows[0].id;

    const empHash = await bcrypt.hash('employee12345', 10);
    await pool.query(
      `INSERT INTO users (email, password_hash, role, employee_id)
       VALUES ('demo.employee@example.com', $1, 'employee', $2)`,
      [empHash, empId]
    );
    console.log('✓ Demo employee account created: demo.employee@example.com / employee12345');
  }

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
