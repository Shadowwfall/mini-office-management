import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';

export function createTestToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });
}

export function getAdminToken(userId = 1) {
  return createTestToken({
    sub: userId,
    id: userId,
    email: 'admin@test.com',
    role: 'admin',
    employeeId: null
  });
}

export function getEmployeeToken(employeeId = 88888) {
  return createTestToken({
    sub: employeeId,
    id: employeeId,
    email: 'employee@test.com',
    role: 'employee',
    employeeId
  });
}
