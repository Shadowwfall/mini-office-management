import React from 'react';

export default function ErrorBanner({ message, error, onRetry, onDismiss }) {
  const displayMessage = message || error?.message || (typeof error === 'string' ? error : null);
  if (!displayMessage) return null;

  return (
    <div className="alert-banner alert-error" role="alert" style={{ marginBottom: '16px' }}>
      <div className="alert-content" style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
        <span className="alert-icon">⚠️</span>
        <span className="alert-text">{displayMessage}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          className="alert-close"
          onClick={onDismiss}
          aria-label="Dismiss error"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'inherit', lineHeight: 1 }}
        >
          ×
        </button>
      )}
      {onRetry && (
        <button type="button" className="btn btn-sm btn-outline" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
