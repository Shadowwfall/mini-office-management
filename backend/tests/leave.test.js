import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/db/pool.js';
import { getAdminToken, getEmployeeToken } from './helpers.js';

describe('Leave Requests API', () => {
  let employeeId;
  let leaveId;
  let adminToken;
  let employeeToken;
  const rand = Math.floor(100000 + Math.random() * 900000);
  const testCode = `EMP-L-${rand}`;
  const testEmail = `leave_${rand}@example.com`;

  before(async () => {
    // Ensure an admin user exists
    const userRes = await pool.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
    let adminUserId = userRes.rows[0]?.id;
    if (!adminUserId) {
      const inserted = await pool.query(
        `INSERT INTO users (email, password_hash, role) VALUES ('testadmin@example.com', 'dummyhash', 'admin') RETURNING id`
      );
      adminUserId = inserted.rows[0].id;
    }

    // Create an employee for testing leave requests
    const res = await pool.query(
      `INSERT INTO employees (employee_code, full_name, email, department, designation, joining_date, status)
       VALUES ($1, $2, $3, 'Engineering', 'Developer', '2024-01-01', 'active')
       RETURNING id`,
      [testCode, 'Leave Tester', testEmail]
    );
    employeeId = res.rows[0].id;
    adminToken = getAdminToken(adminUserId);
    employeeToken = getEmployeeToken(employeeId);
  });

  after(async () => {
    if (leaveId) {
      await pool.query('DELETE FROM leave_requests WHERE id = $1', [leaveId]);
    }
    if (employeeId) {
      await pool.query('DELETE FROM employees WHERE id = $1', [employeeId]);
    }
  });

  it('POST /api/leave-requests rejects unauthenticated requests with 401', async () => {
    const res = await request(app).post('/api/leave-requests').send({});
    assert.equal(res.status, 401);
  });

  it('POST /api/leave-requests submits a valid leave request', async () => {
    const payload = {
      employeeId,
      leaveType: 'annual',
      startDate: '2025-06-01',
      endDate: '2025-06-05',
      reason: 'Summer family trip'
    };

    const res = await request(app)
      .post('/api/leave-requests')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);
    assert.equal(res.status, 201);
    assert.ok(res.body.data);
    assert.equal(res.body.data.employeeId, employeeId);
    assert.equal(res.body.data.leaveType, 'annual');
    assert.equal(res.body.data.startDate, '2025-06-01');
    assert.equal(res.body.data.endDate, '2025-06-05');
    assert.equal(res.body.data.status, 'pending');
    assert.equal(res.body.data.employeeCode, testCode);

    leaveId = res.body.data.id;
  });

  it('POST /api/leave-requests rejects end date before start date with 400', async () => {
    const payload = {
      employeeId,
      leaveType: 'casual',
      startDate: '2025-06-10',
      endDate: '2025-06-05',
      reason: 'Invalid dates'
    };

    const res = await request(app)
      .post('/api/leave-requests')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);
    assert.equal(res.status, 400);
    assert.equal(res.body.error.message, 'Validation failed');
  });

  it('POST /api/leave-requests returns 404 for nonexistent employee', async () => {
    const payload = {
      employeeId: 999999,
      leaveType: 'sick',
      startDate: '2025-07-01',
      endDate: '2025-07-02',
      reason: 'Not feeling well'
    };

    const res = await request(app)
      .post('/api/leave-requests')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);
    assert.equal(res.status, 404);
    assert.match(res.body.error.message, /not found/i);
  });

  it('GET /api/leave-requests lists requests with employee info for admin', async () => {
    const res = await request(app)
      .get('/api/leave-requests?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.meta);
    assert.ok(res.body.meta.total >= 1);

    const found = res.body.data.find((item) => item.id === leaveId);
    assert.ok(found);
    assert.equal(found.employeeCode, testCode);
  });

  it('GET /api/leave-requests filters by status pending', async () => {
    const res = await request(app)
      .get('/api/leave-requests?status=pending')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    const found = res.body.data.find((item) => item.id === leaveId);
    assert.ok(found);
    assert.equal(found.status, 'pending');
  });

  it('PATCH /api/leave-requests/:id/status forbids non-admin from approving', async () => {
    const res = await request(app)
      .patch(`/api/leave-requests/${leaveId}/status`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ status: 'approved' });

    assert.equal(res.status, 403);
  });

  it('PATCH /api/leave-requests/:id/status approves a pending request', async () => {
    const res = await request(app)
      .patch(`/api/leave-requests/${leaveId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved', reviewNote: 'Approved by admin' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'approved');
    assert.equal(res.body.data.reviewNote, 'Approved by admin');
    assert.ok(res.body.data.reviewedAt);
  });

  it('PATCH /api/leave-requests/:id/status rejects double transition with 409', async () => {
    const res = await request(app)
      .patch(`/api/leave-requests/${leaveId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'rejected', reviewNote: 'Trying to reject already approved' });

    assert.equal(res.status, 409);
    assert.match(res.body.error.message, /already been reviewed/i);
  });

  it('PATCH /api/leave-requests/999999/status returns 404', async () => {
    const res = await request(app)
      .patch('/api/leave-requests/999999/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });

    assert.equal(res.status, 404);
  });

  it('DELETE /api/employees/:id returns 409 when employee has leave records', async () => {
    const res = await request(app)
      .delete(`/api/employees/${employeeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 409);
    assert.match(res.body.error.message, /has leave records/i);
  });
});

