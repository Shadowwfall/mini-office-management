import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
                  className="btn btn-sm btn-secondary"
                  onClick={handleLogout}
                  style={{ marginLeft: '4px' }}
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
