import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import StatCard from '../components/StatCard';
import TiltCard from '../components/TiltCard';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';

// SVG Icons for clean, cross-platform professional appearance
function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function UserCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}

function UserMinusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="17" y1="11" x2="22" y2="11" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function RefreshIcon({ spinning }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="14"
      height="14"
      className={spinning ? 'spin' : ''}
    >
      <path d="M21.5 2v6h-6M2.5 22v-6h6" />
      <path d="M21.5 8a9 9 0 0 0-16.14-3.5L2.5 8M2.5 16a9 9 0 0 0 16.14 3.5L21.5 16" />
    </svg>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const res = await apiRequest('/api/dashboard/stats');
      setStats(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Loading Skeleton State for initial load
  if (isLoading && !stats) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Office Dashboard</h1>
            <p className="page-subtitle">Overview of your workforce and leave activity</p>
          </div>
        </div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card skeleton-card">
              <div className="skeleton-line skeleton-title" />
              <div className="skeleton-line skeleton-value" />
              <div className="skeleton-line skeleton-subtitle" />
            </div>
          ))}
        </div>
        <div className="dashboard-grid">
          <div className="card skeleton-card" style={{ height: '240px' }} />
          <div className="card skeleton-card" style={{ height: '240px' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Office Dashboard</h1>
            <p className="page-subtitle">Overview of your workforce and leave activity</p>
          </div>
        </div>
        <ErrorBanner message={error} onRetry={() => fetchStats(true)} />
      </div>
    );
  }

  const { employees, byDepartment, leave } = stats || {
    employees: { total: 0, active: 0, inactive: 0 },
    byDepartment: [],
    leave: { total: 0, pending: 0, approved: 0, rejected: 0 }
  };

  const hasData = employees.total > 0 || leave.total > 0;
  const maxDeptCount = Math.max(1, ...byDepartment.map((d) => d.count));
  const activeRate = employees.total > 0 ? Math.round((employees.active / employees.total) * 100) : 0;

  // Stacked segmented bar percentage computation with strict 100% rounding guarantee
  const totalLeave = leave.total || 0;
  const approvedPct = totalLeave > 0 ? Math.round((leave.approved / totalLeave) * 100) : 0;
  const pendingPct = totalLeave > 0 ? Math.round((leave.pending / totalLeave) * 100) : 0;
  // Compute rejected as remainder so segments sum exactly to 100%
  const rejectedPct = totalLeave > 0 ? Math.max(0, 100 - approvedPct - pendingPct) : 0;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Office Dashboard</h1>
          <p className="page-subtitle">Overview of your workforce and leave activity</p>
        </div>
        <div className="header-actions">
          {lastUpdated && (
            <span className="last-updated-text text-muted tabular-nums">
              Updated {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fetchStats(true)}
            disabled={isRefreshing}
            aria-label="Refresh live statistics"
          >
            <RefreshIcon spinning={isRefreshing} />
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="card">
          <EmptyState
            message="No records found in the database yet. Get started by adding your first employee."
            action={
              <Link to="/employees/new" className="btn btn-primary">
                + Add First Employee
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {/* Top KPI Stat Cards */}
          <div className="stats-grid">
            <StatCard
              title="Total Employees"
              value={employees.total}
              icon={<UsersIcon />}
              iconVariant="primary"
              subtitle="Registered workforce"
            />
            <StatCard
              title="Active Staff"
              value={employees.active}
              icon={<UserCheckIcon />}
              iconVariant="success"
              subtitle={`${activeRate}% of total workforce`}
            />
            <StatCard
              title="Inactive Staff"
              value={employees.inactive}
              icon={<UserMinusIcon />}
              iconVariant="neutral"
              subtitle={employees.inactive === 1 ? '1 inactive member' : `${employees.inactive} inactive members`}
            />
            <StatCard
              title="Pending Leave"
              value={leave.pending}
              icon={<ClockIcon />}
              iconVariant="warning"
              subtitle={leave.pending > 0 ? 'Requires manager review' : 'All requests resolved'}
              to="/leave"
              badge={leave.pending > 0 ? `${leave.pending} action needed` : null}
            />
          </div>

          {/* Breakdown Sections */}
          <div className="dashboard-grid">
            {/* Department Breakdown Card */}
            <TiltCard maxTilt={6} className="dashboard-section-tilt-wrap" cardClassName="card dashboard-section">
              <div className="card-header card-header-split">
                <div>
                  <h2 className="card-title">Employees by Department</h2>
                  <p className="card-subtitle text-muted">Headcount and proportional distribution</p>
                </div>
                <span className="badge badge-neutral">
                  {byDepartment.length} {byDepartment.length === 1 ? 'Department' : 'Departments'}
                </span>
              </div>
              <div className="dashboard-card-body">
                {byDepartment.length === 0 ? (
                  <div className="empty-substate">
                    <p className="text-muted">No department data available.</p>
                    <span className="text-subtle text-xs">Add employees with assigned departments to view distribution.</span>
                  </div>
                ) : (
                  <>
                    <div className="dept-breakdown-list">
                      {byDepartment.map((dept) => {
                        const share = employees.total > 0
                          ? Math.round((dept.count / employees.total) * 100)
                          : 0;

                        return (
                          <div key={dept.department} className="dept-breakdown-row">
                            <div className="dept-info-col">
                              <span className="dept-name font-semibold">{dept.department}</span>
                              <div
                                className="dept-bar-track bar-track dept-track"
                                role="progressbar"
                                aria-label={`${dept.department} share of workforce`}
                                aria-valuenow={share}
                                aria-valuemin="0"
                                aria-valuemax="100"
                              >
                                <div
                                  className="dept-bar-fill bar-fill bar-primary"
                                  style={{ width: `${share}%` }}
                                />
                              </div>
                            </div>
                            <div className="dept-stat-col">
                              <span className="dept-count font-semibold tabular-nums">
                                {dept.count} {dept.count === 1 ? 'staff' : 'staff'}
                              </span>
                              <span className="dept-pct text-muted tabular-nums">
                                {share}% share
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="card-footer-subtle">
                      <span className="text-muted text-xs">
                        {employees.total} total staff across {byDepartment.length} departments
                      </span>
                      <Link to="/employees" className="link-action">
                        View Directory →
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </TiltCard>

            {/* Leave Requests Overview Card */}
            <TiltCard maxTilt={6} className="dashboard-section-tilt-wrap" cardClassName="card dashboard-section">
              <div className="card-header card-header-split">
                <div>
                  <h2 className="card-title">Leave Requests Overview</h2>
                  <p className="card-subtitle text-muted">Status distribution across all submissions</p>
                </div>
                <span className="badge badge-neutral tabular-nums">
                  {totalLeave} {totalLeave === 1 ? 'Total Request' : 'Total Requests'}
                </span>
              </div>
              <div className="dashboard-card-body">
                {totalLeave === 0 ? (
                  <div className="empty-substate">
                    <p className="text-muted">No leave requests recorded yet.</p>
                    <span className="text-subtle text-xs">Leave submissions by employees will appear here.</span>
                  </div>
                ) : (
                  <>
                    {/* Stacked Segmented Progress Bar */}
                    <div className="segmented-progress-container">
                      <div className="segmented-progress-header">
                        <span className="font-semibold text-xs text-uppercase text-muted">Approval Pipeline</span>
                        <span className="text-xs text-muted tabular-nums">{leave.approved} of {totalLeave} approved</span>
                      </div>
                      <div
                        className="segmented-progress-track"
                        role="progressbar"
                        aria-label="Leave requests status distribution"
                        aria-valuenow={approvedPct}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        {approvedPct > 0 && (
                          <div
                            className="segmented-bar-segment segment--success"
                            style={{ width: `${approvedPct}%` }}
                            title={`Approved: ${leave.approved} (${approvedPct}%)`}
                          />
                        )}
                        {pendingPct > 0 && (
                          <div
                            className="segmented-bar-segment segment--warning"
                            style={{ width: `${pendingPct}%` }}
                            title={`Pending: ${leave.pending} (${pendingPct}%)`}
                          />
                        )}
                        {rejectedPct > 0 && (
                          <div
                            className="segmented-bar-segment segment--danger"
                            style={{ width: `${rejectedPct}%` }}
                            title={`Rejected: ${leave.rejected} (${rejectedPct}%)`}
                          />
                        )}
                      </div>
                    </div>

                    {/* Consistent Status Badge Legend */}
                    <div className="leave-status-legend">
                      <div className="legend-item">
                        <span className="status-badge status-approved">
                          Approved
                        </span>
                        <div className="legend-stats">
                          <span className="font-semibold tabular-nums">{leave.approved}</span>
                          <span className="text-muted text-xs tabular-nums">({approvedPct}%)</span>
                        </div>
                      </div>

                      <div className="legend-item">
                        <span className="status-badge status-pending">
                          Pending
                        </span>
                        <div className="legend-stats">
                          <span className="font-semibold tabular-nums">{leave.pending}</span>
                          <span className="text-muted text-xs tabular-nums">({pendingPct}%)</span>
                        </div>
                      </div>

                      <div className="legend-item">
                        <span className="status-badge status-rejected">
                          Rejected
                        </span>
                        <div className="legend-stats">
                          <span className="font-semibold tabular-nums">{leave.rejected}</span>
                          <span className="text-muted text-xs tabular-nums">({rejectedPct}%)</span>
                        </div>
                      </div>
                    </div>

                    <div className="card-footer-subtle">
                      <span className="text-muted text-xs">
                        {leave.pending > 0
                          ? `⚠️ ${leave.pending} request${leave.pending === 1 ? '' : 's'} pending administrative review`
                          : '✓ All submitted requests have been reviewed'}
                      </span>
                      <Link to="/leave" className="link-action">
                        Manage Requests →
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </TiltCard>
          </div>
        </>
      )}
    </div>
  );
}
