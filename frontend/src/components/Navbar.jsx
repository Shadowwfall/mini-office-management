import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <Link to="/" className="brand-logo">
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

        <nav className={`navbar-links ${isOpen ? 'is-open' : ''}`}>
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
          <NavLink
            to="/leave"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            onClick={() => setIsOpen(false)}
          >
            Leave Requests
          </NavLink>
          <div className="navbar-actions">
            <Link
              to="/employees/new"
              className="btn btn-sm btn-primary"
              onClick={() => setIsOpen(false)}
            >
              + Add Employee
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
