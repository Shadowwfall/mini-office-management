import React from 'react';
import { Link } from 'react-router-dom';

/**
 * StatCard component with icon chip, neutral tabular numbers, and optional link
 */
export default function StatCard({
  title,
  value,
  icon,
  iconVariant = 'primary',
  subtitle,
  to,
  badge
}) {
  const inner = (
    <>
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {icon && (
          <div className={`stat-icon stat-icon--${iconVariant}`} aria-hidden="true">
            {icon}
          </div>
        )}
      </div>
      <div className="stat-card-body">
        <div className="stat-card-value tabular-nums">{value}</div>
        {badge && <span className="stat-card-badge">{badge}</span>}
      </div>
      {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
      {to && (
        <div className="stat-card-action-hint">
          <span>View records</span>
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 3l5 5-5 5" />
          </svg>
        </div>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className="stat-card stat-card--interactive" title={`View ${title}`}>
        {inner}
      </Link>
    );
  }

  return <div className="stat-card">{inner}</div>;
}
