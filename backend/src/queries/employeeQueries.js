import pool from '../db/pool.js';

const SELECT_FIELDS = `
  id,
  employee_code AS "employeeCode",
  full_name     AS "fullName",
  email,
  phone,
  department,
  designation,
  joining_date  AS "joiningDate",
  status,
  created_at    AS "createdAt",
  updated_at    AS "updatedAt"
`;

export async function listEmployees({ search, department, status, page = 1, limit = 20 }) {
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(
      `(employee_code ILIKE $${params.length} OR full_name ILIKE $${params.length} OR email ILIKE $${params.length})`
    );
  }

  if (department) {
    params.push(department);
    conditions.push(`department = $${params.length}`);
  }

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countSql = `SELECT COUNT(*)::int AS total FROM employees ${whereClause}`;
  const countResult = await pool.query(countSql, params);
  const total = countResult.rows[0].total;

  // Get paginated data
  const offset = (page - 1) * limit;
  const dataParams = [...params, limit, offset];
  const dataSql = `
    SELECT ${SELECT_FIELDS}
    FROM employees
    ${whereClause}
    ORDER BY id ASC
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
  `;

  const { rows } = await pool.query(dataSql, dataParams);
  return { employees: rows, total };
}

export async function getEmployeeById(id) {
  const sql = `SELECT ${SELECT_FIELDS} FROM employees WHERE id = $1`;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
}

export async function createEmployee(data) {
  const { employeeCode, fullName, email, phone, department, designation, joiningDate, status } = data;
  const sql = `
    INSERT INTO employees (
      employee_code, full_name, email, phone, department, designation, joining_date, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING ${SELECT_FIELDS}
  `;
  const { rows } = await pool.query(sql, [
    employeeCode,
    fullName,
    email,
    phone || null,
    department,
    designation,
    joiningDate,
    status || 'active'
  ]);
  return rows[0];
}

export async function updateEmployee(id, data) {
  const { employeeCode, fullName, email, phone, department, designation, joiningDate, status } = data;
  const sql = `
    UPDATE employees
    SET
      employee_code = $1,
      full_name = $2,
      email = $3,
      phone = $4,
      department = $5,
      designation = $6,
      joining_date = $7,
      status = $8,
      updated_at = now()
    WHERE id = $9
    RETURNING ${SELECT_FIELDS}
  `;
  const { rows } = await pool.query(sql, [
    employeeCode,
    fullName,
    email,
    phone || null,
    department,
    designation,
    joiningDate,
    status,
    id
  ]);
  return rows[0] || null;
}

export async function deleteEmployee(id) {
  const sql = `DELETE FROM employees WHERE id = $1 RETURNING id`;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
}
