import React from 'react';
import { Link } from 'react-router-dom';
import TiltCard from './TiltCard';

/**
 * StatCard component with 3D tilt hover, icon chip, neutral tabular numbers, and optional link
 */
export default function StatCard({
  title,
  value,
  icon,
  iconVariant = 'primary',
  subtitle,
  to,
  badge,
  maxTilt = 12
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
      <TiltCard
        as={Link}
        to={to}
        className="stat-card-tilt-wrap"
        cardClassName="stat-card stat-card--interactive"
        title={`View ${title}`}
        maxTilt={maxTilt}
      >
        {inner}
      </TiltCard>
    );
  }

  return (
    <TiltCard
      className="stat-card-tilt-wrap"
      cardClassName="stat-card"
      maxTilt={maxTilt}
    >
      {inner}
    </TiltCard>
  );
}

