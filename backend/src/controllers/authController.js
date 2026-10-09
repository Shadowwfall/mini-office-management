import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';
import { config } from '../config/env.js';

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      `SELECT id, email, password_hash, role, employee_id
       FROM users
       WHERE lower(email) = lower($1)`,
      [email]
    );

    const user = result.rows[0];

    // Same generic error message for nonexistent email or wrong password
    if (!user) {
      return res.status(401).json({
        error: { message: 'Invalid email or password' }
      });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        error: { message: 'Invalid email or password' }
      });
    }

    const payload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee_id
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '8h' });

    res.status(200).json({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          employeeId: user.employee_id
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  res.status(200).json({
    data: req.user
  });
}
