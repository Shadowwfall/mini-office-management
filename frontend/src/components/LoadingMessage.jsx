import React from 'react';

export default function LoadingMessage({ message = 'Loading...' }) {
  return (
    <div className="state-container loading-state">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
}
