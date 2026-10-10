import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/db/pool.js';
import { getAdminToken } from './helpers.js';

describe('Employees API', () => {
  let createdEmployeeId;
  const adminToken = getAdminToken();
  const rand = Math.floor(100000 + Math.random() * 900000);
  const testCode = `EMP-TEST-${rand}`;
  const testEmail = `test_${rand}@example.com`;

  before(async () => {
    await pool.query("DELETE FROM employees WHERE employee_code LIKE 'EMP-TEST-%'");
  });

  after(async () => {
    if (createdEmployeeId) {
      await pool.query('DELETE FROM employees WHERE id = $1', [createdEmployeeId]);
    }
  });

  it('POST /api/employees creates employee with valid data', async () => {
    const payload = {
      employeeCode: testCode,
      fullName: 'Alice Test',
      email: testEmail,
      phone: '1234567890',
      department: 'Engineering',
      designation: 'Software Engineer',
      joiningDate: '2024-01-15',
      status: 'active'
    };

    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    assert.equal(res.status, 201);
    assert.ok(res.body.data);
    assert.equal(res.body.data.employeeCode, testCode);
    assert.equal(res.body.data.fullName, 'Alice Test');
    assert.equal(res.body.data.email, testEmail.toLowerCase());
    assert.equal(res.body.data.department, 'Engineering');
    assert.equal(res.body.data.joiningDate, '2024-01-15');
    assert.equal(res.body.data.status, 'active');

    createdEmployeeId = res.body.data.id;
  });

  it('POST /api/employees rejects duplicate email case-insensitively with 409', async () => {
    const payload = {
      employeeCode: `EMP-X-${Math.floor(100000 + Math.random() * 900000)}`,
      fullName: 'Bob Test',
      email: testEmail.toUpperCase(),
      department: 'HR',
      designation: 'HR Specialist',
      joiningDate: '2024-02-01'
    };

    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    assert.equal(res.status, 409);
    assert.ok(res.body.error);
    assert.match(res.body.error.message, /already exists/i);
  });

  it('POST /api/employees rejects duplicate employee code with 409', async () => {
    const payload = {
      employeeCode: testCode,
      fullName: 'Charlie Test',
      email: `charlie_${rand}@example.com`,
      department: 'Sales',
      designation: 'Sales Exec',
      joiningDate: '2024-03-01'
    };

    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    assert.equal(res.status, 409);
    assert.ok(res.body.error);
    assert.match(res.body.error.message, /already exists/i);
  });

  it('POST /api/employees returns 400 on invalid body / missing fields', async () => {
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: ''
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.message, 'Validation failed');
    assert.ok(Array.isArray(res.body.error.details));
  });

  it('GET /api/employees lists employees and meta', async () => {
    const res = await request(app)
      .get('/api/employees?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.meta);
    assert.ok(res.body.meta.total >= 1);
    assert.equal(res.body.meta.page, 1);
    assert.equal(res.body.meta.limit, 10);
  });

  it('GET /api/employees searches by code and filters by department', async () => {
    const res = await request(app)
      .get(`/api/employees?search=${testCode}&department=Engineering&status=active`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].employeeCode, testCode);
  });

  it('GET /api/employees returns empty list when search matches nothing', async () => {
    const res = await request(app)
      .get('/api/employees?search=nonexistent_zzzzzz')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 0);
    assert.equal(res.body.meta.total, 0);
  });

  it('GET /api/employees/:id returns single employee', async () => {
    const res = await request(app)
      .get(`/api/employees/${createdEmployeeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.id, createdEmployeeId);
    assert.equal(res.body.data.fullName, 'Alice Test');
  });

  it('GET /api/employees/999999 returns 404', async () => {
    const res = await request(app)
      .get('/api/employees/999999')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 404);
  });

  it('GET /api/employees/abc returns 400 for non-numeric ID', async () => {
    const res = await request(app)
      .get('/api/employees/abc')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 400);
  });

  it('PUT /api/employees/:id updates an employee', async () => {
    const payload = {
      employeeCode: testCode,
      fullName: 'Alice Updated',
      email: testEmail,
      phone: '9876543210',
      department: 'Engineering',
      designation: 'Lead Engineer',
      joiningDate: '2024-01-15',
      status: 'active'
    };

    const res = await request(app)
      .put(`/api/employees/${createdEmployeeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.fullName, 'Alice Updated');
    assert.equal(res.body.data.designation, 'Lead Engineer');
  });

  it('DELETE /api/employees/:id deletes employee without leave records', async () => {
    const res = await request(app)
      .delete(`/api/employees/${createdEmployeeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 204);

    const getRes = await request(app)
      .get(`/api/employees/${createdEmployeeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(getRes.status, 404);
    createdEmployeeId = null;
  });
});
