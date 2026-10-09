import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { getEmployeeToken } from './helpers.js';

describe('Authentication & Authorization API', () => {
  let adminToken;

  it('POST /api/auth/login logs in admin with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'admin12345'
    });

    assert.equal(res.status, 200);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.email, 'admin@example.com');
    assert.equal(res.body.data.user.role, 'admin');

    adminToken = res.body.data.token;
  });

  it('POST /api/auth/login returns 401 for incorrect password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'wrongpassword'
    });

    assert.equal(res.status, 401);
    assert.equal(res.body.error.message, 'Invalid email or password');
  });

  it('POST /api/auth/login returns 401 for nonexistent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nonexistent@example.com',
      password: 'admin12345'
    });

    assert.equal(res.status, 401);
    assert.equal(res.body.error.message, 'Invalid email or password');
  });

  it('GET /api/auth/me returns current user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.email, 'admin@example.com');
    assert.equal(res.body.data.role, 'admin');
  });

  it('GET /api/auth/me returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    assert.equal(res.status, 401);
  });

  it('Admin endpoint returns 401 without token', async () => {
    const res = await request(app).get('/api/employees');
    assert.equal(res.status, 401);
  });

  it('Admin endpoint returns 403 when called with employee role token', async () => {
    const empToken = getEmployeeToken();
    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${empToken}`);

    assert.equal(res.status, 403);
    assert.match(res.body.error.message, /insufficient permissions/i);
  });
});
