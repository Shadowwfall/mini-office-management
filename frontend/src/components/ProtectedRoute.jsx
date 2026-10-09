import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingMessage from './LoadingMessage';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingMessage message="Checking session..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-danger)', marginBottom: '8px' }}>Access Denied</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
          This page requires <strong>{requiredRole}</strong> privileges. You are currently logged in as <strong>{user.role}</strong>.
        </p>
        <a href={user.role === 'employee' ? '/leave' : '/'} className="btn btn-primary">
          Return to {user.role === 'employee' ? 'My Leave Requests' : 'Dashboard'}
        </a>
      </div>
    );
  }

  return children;
}
