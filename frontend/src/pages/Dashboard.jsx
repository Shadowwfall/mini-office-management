import React from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Office overview and key operational metrics</p>
        </div>
      </div>
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          Welcome to the Mini Office Management System. Manage employees or review requests.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/employees" className="btn btn-primary">
            View Employees
          </Link>
          <Link to="/employees/new" className="btn btn-secondary">
            + Add Employee
          </Link>
        </div>
      </div>
    </div>
  );
}
