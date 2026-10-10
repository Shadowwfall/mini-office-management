import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const isAdmin = user?.role === 'admin';

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <Link to={isAdmin ? '/' : '/leave'} className="brand-logo">
            <span className="brand-badge">Mini</span>Office
          </Link>
          <button
            className="navbar-toggle"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation"
          >
            ☰
          </button>
        </div>

        {user && (
          <nav className={`navbar-links ${isOpen ? 'is-open' : ''}`}>
            {isAdmin && (
              <>
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/employees"
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                  onClick={() => setIsOpen(false)}
                >
                  Employees
                </NavLink>
              </>
            )}

            <NavLink
              to="/leave"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              onClick={() => setIsOpen(false)}
            >
              {isAdmin ? 'Leave Requests' : 'My Leaves'}
            </NavLink>

            <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isAdmin ? (
                <Link
                  to="/employees/new"
                  className="btn btn-sm btn-primary"
                  onClick={() => setIsOpen(false)}
                >
                  + Add Employee
                </Link>
              ) : (
                <Link
                  to="/leave/new"
                  className="btn btn-sm btn-primary"
                  onClick={() => setIsOpen(false)}
                >
                  + Request Leave
                </Link>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  paddingLeft: '12px',
                  borderLeft: '1px solid var(--color-border)'
                }}
              >
                <span
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-secondary)',
                    maxWidth: '140px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={user.email}
                >
                  {user.email}
                </span>
                <span
                  className={`badge ${isAdmin ? 'badge-primary' : 'badge-neutral'}`}
                  style={{ textTransform: 'capitalize' }}
                >
                  {user.role}
                </span>
                <button
                  type="button"
                  className="theme-toggle-btn"
                  onClick={toggleTheme}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  aria-label="Toggle color theme"
                >
                  {theme === 'dark' ? (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
