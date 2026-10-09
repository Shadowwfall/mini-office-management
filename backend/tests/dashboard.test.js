import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { getAdminToken } from './helpers.js';

describe('Dashboard Stats API', () => {
  it('GET /api/dashboard/stats returns correct shape with numeric counts', async () => {
    const adminToken = getAdminToken();
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.data);

    const { employees, byDepartment, leave } = res.body.data;

    // Check employee stats
    assert.ok(employees);
    assert.equal(typeof employees.total, 'number');
    assert.equal(typeof employees.active, 'number');
    assert.equal(typeof employees.inactive, 'number');
    assert.equal(employees.total, employees.active + employees.inactive);

    // Check department breakdown
    assert.ok(Array.isArray(byDepartment));
    for (const item of byDepartment) {
      assert.equal(typeof item.department, 'string');
      assert.equal(typeof item.count, 'number');
    }

    // Check leave stats
    assert.ok(leave);
    assert.equal(typeof leave.total, 'number');
    assert.equal(typeof leave.pending, 'number');
    assert.equal(typeof leave.approved, 'number');
    assert.equal(typeof leave.rejected, 'number');
    assert.equal(leave.total, leave.pending + leave.approved + leave.rejected);
  });
});
