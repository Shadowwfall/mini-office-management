import pool from '../db/pool.js';

export async function getDashboardStats() {
  const employeeStatsQuery = `
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'active')::int   AS active,
      COUNT(*) FILTER (WHERE status = 'inactive')::int AS inactive
    FROM employees;
  `;

  const departmentStatsQuery = `
    SELECT department, COUNT(*)::int AS count
    FROM employees
    GROUP BY department
    ORDER BY department ASC;
  `;

  const leaveStatsQuery = `
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'pending')::int  AS pending,
      COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
      COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected
    FROM leave_requests;
  `;

  const [empRes, deptRes, leaveRes] = await Promise.all([
    pool.query(employeeStatsQuery),
    pool.query(departmentStatsQuery),
    pool.query(leaveStatsQuery)
  ]);

  const empRow = empRes.rows[0] || { total: 0, active: 0, inactive: 0 };
  const leaveRow = leaveRes.rows[0] || { total: 0, pending: 0, approved: 0, rejected: 0 };

  return {
    employees: {
      total: empRow.total || 0,
      active: empRow.active || 0,
      inactive: empRow.inactive || 0
    },
    byDepartment: deptRes.rows || [],
    leave: {
      total: leaveRow.total || 0,
      pending: leaveRow.pending || 0,
      approved: leaveRow.approved || 0,
      rejected: leaveRow.rejected || 0
    }
  };
}
