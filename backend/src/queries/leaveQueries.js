import pool from '../db/pool.js';

const SELECT_FIELDS = `
  lr.id,
  lr.employee_id  AS "employeeId",
  e.full_name     AS "employeeName",
  e.employee_code AS "employeeCode",
  lr.leave_type   AS "leaveType",
  lr.start_date   AS "startDate",
  lr.end_date     AS "endDate",
  lr.reason,
  lr.status,
  lr.submitted_at AS "submittedAt",
  lr.reviewed_at  AS "reviewedAt",
  lr.reviewed_by  AS "reviewedBy",
  lr.review_note  AS "reviewNote"
`;

export async function listLeaveRequests({ status, employeeId, search, page = 1, limit = 20 }) {
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`lr.status = $${params.length}`);
  }

  if (employeeId) {
    params.push(employeeId);
    conditions.push(`lr.employee_id = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(
      `(e.full_name ILIKE $${params.length} OR e.employee_code ILIKE $${params.length})`
    );
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM leave_requests lr
    JOIN employees e ON lr.employee_id = e.id
    ${whereClause}
  `;
  const countResult = await pool.query(countSql, params);
  const total = countResult.rows[0].total;

  const offset = (page - 1) * limit;
  const dataParams = [...params, limit, offset];
  const dataSql = `
    SELECT ${SELECT_FIELDS}
    FROM leave_requests lr
    JOIN employees e ON lr.employee_id = e.id
    ${whereClause}
    ORDER BY lr.submitted_at DESC
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
  `;

  const { rows } = await pool.query(dataSql, dataParams);
  return { leaveRequests: rows, total };
}

export async function getLeaveRequestById(id) {
  const sql = `
    SELECT ${SELECT_FIELDS}
    FROM leave_requests lr
    JOIN employees e ON lr.employee_id = e.id
    WHERE lr.id = $1
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
}

export async function createLeaveRequest(data) {
  const { employeeId, leaveType, startDate, endDate, reason } = data;

  // Verify employee exists first
  const empCheck = await pool.query('SELECT id, status FROM employees WHERE id = $1', [employeeId]);
  if (empCheck.rows.length === 0) {
    return { error: 'EMPLOYEE_NOT_FOUND' };
  }

  const insertSql = `
    INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status)
    VALUES ($1, $2, $3, $4, $5, 'pending')
    RETURNING id
  `;
  const { rows } = await pool.query(insertSql, [employeeId, leaveType, startDate, endDate, reason]);
  return getLeaveRequestById(rows[0].id);
}

export async function updateLeaveStatus(id, { status, reviewNote = null, reviewedBy = null }) {
  // Atomic status transition: update only if current status is 'pending'
  const updateSql = `
    UPDATE leave_requests
    SET status = $1, reviewed_at = now(), reviewed_by = $2, review_note = $3
    WHERE id = $4 AND status = 'pending'
    RETURNING id
  `;

  const updateResult = await pool.query(updateSql, [status, reviewedBy, reviewNote, id]);

  if (updateResult.rows.length > 0) {
    return { data: await getLeaveRequestById(id) };
  }

  // Row was not updated: check whether it exists or was already reviewed
  const lookup = await pool.query('SELECT id, status FROM leave_requests WHERE id = $1', [id]);
  if (lookup.rows.length === 0) {
    return { notFound: true };
  }

  return { conflict: true, currentStatus: lookup.rows[0].status };
}
