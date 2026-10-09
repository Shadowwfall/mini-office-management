import React from 'react';

export default function ErrorBanner({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="alert-banner alert-error" role="alert">
      <div className="alert-content">
        <span className="alert-icon">⚠️</span>
        <span className="alert-text">{message}</span>
      </div>
      {onRetry && (
        <button type="button" className="btn btn-sm btn-outline" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
