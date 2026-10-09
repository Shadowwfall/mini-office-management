export function errorHandler(err, req, res, next) {
  // Unique constraint violation (e.g. duplicate employee_code or email)
  if (err.code === '23505') {
    let message = 'A record with this value already exists.';
    if (err.detail && err.detail.includes('email')) {
      message = 'An employee with this email already exists.';
    } else if (err.detail && err.detail.includes('employee_code')) {
      message = 'An employee with this employee code already exists.';
    }
    return res.status(409).json({ error: { message } });
  }

  // Foreign key restriction violation (e.g. deleting employee with leave records)
  if (err.code === '23503') {
    return res.status(409).json({
      error: { message: 'This employee has leave records. Mark them inactive instead.' }
    });
  }

  const status = err.status || err.statusCode || 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  if (status === 500) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(status).json({
    error: {
      message,
      ...(err.details ? { details: err.details } : {})
    }
  });
}
