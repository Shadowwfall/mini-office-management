import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorBanner from '../components/ErrorBanner';
import Accordion from '../components/Accordion';
import { useErrorShake } from '../hooks/useErrorShake';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { shakingFields, triggerShake, clearShake } = useErrorShake();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const errors = {};
    if (!email.trim()) errors.email = 'Email address is required.';
    if (!password.trim()) errors.password = 'Password is required.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      triggerShake(Object.keys(errors));
      return;
    }

    setSubmitting(true);

    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'admin') {
        navigate('/', { replace: true });
      } else {
        navigate('/leave', { replace: true });
      }
    } catch (err) {
      setError(err);
      triggerShake(['email', 'password']);
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(demoEmail, demoPassword) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setFieldErrors({});
    clearShake('email');
    clearShake('password');
    setError(null);
  }

  return (
    <div style={{ maxWidth: '440px', margin: '60px auto' }}>
      <div className="card" style={{ padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '6px' }}>Sign In</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Mini Office Management System
          </p>
        </div>

        {error && (
          <ErrorBanner
            message={error.message || 'Invalid email or password.'}
            onDismiss={() => setError(null)}
          />
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className={`form-group t-input-wrap ${fieldErrors.email || (error && !fieldErrors.email) ? 'is-error' : ''}`}>
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              className={`form-input t-input ${fieldErrors.email || error ? 'is-invalid is-error' : ''} ${shakingFields.email ? 'is-shaking' : ''}`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
                clearShake('email');
                if (error) setError(null);
              }}
              placeholder="name@example.com"
              required
              autoFocus
            />
            {fieldErrors.email && (
              <p className="form-error t-error-msg">{fieldErrors.email}</p>
            )}
          </div>

          <div className={`form-group t-input-wrap ${fieldErrors.password || (error && !fieldErrors.password) ? 'is-error' : ''}`}>
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className={`form-input t-input ${fieldErrors.password || error ? 'is-invalid is-error' : ''} ${shakingFields.password ? 'is-shaking' : ''}`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
                clearShake('password');
                if (error) setError(null);
              }}
              placeholder="Enter your password"
              required
            />
            {fieldErrors.password && (
              <p className="form-error t-error-msg">{fieldErrors.password}</p>
            )}
          </div>

          <div style={{ marginTop: '24px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={submitting}
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '24px' }}>
          <Accordion title="Demo Accounts (Pre-seeded)" defaultOpen={true}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', marginBottom: '10px' }}>
              Click an account below to auto-fill credentials for quick testing:
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                onClick={() => fillDemo('admin@example.com', 'admin12345')}
              >
                Admin Demo
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                onClick={() => fillDemo('john.doe@example.com', 'employee12345')}
              >
                Employee Demo
              </button>
            </div>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
