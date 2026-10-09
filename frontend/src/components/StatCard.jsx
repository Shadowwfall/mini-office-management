import React from 'react';

export default function StatCard({ title, value, icon, subtitle, colorClass = '' }) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {icon && <span className="stat-card-icon">{icon}</span>}
      </div>
      <div className="stat-card-value">{value}</div>
      {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
    </div>
  );
}
