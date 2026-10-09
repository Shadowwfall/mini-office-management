import React from 'react';

export default function EmptyState({ message = 'No records found.', action }) {
  return (
    <div className="state-container empty-state">
      <div className="empty-icon">📭</div>
      <p className="empty-text">{message}</p>
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}
