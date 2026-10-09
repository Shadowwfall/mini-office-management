import React from 'react';

export default function Leave() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave Requests</h1>
          <p className="page-subtitle">Track and review employee leave</p>
        </div>
      </div>
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Leave request management will be enabled in Phase 7.
        </p>
      </div>
    </div>
  );
}
