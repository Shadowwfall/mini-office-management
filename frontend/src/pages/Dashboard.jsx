import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import StatCard from '../components/StatCard';
import LoadingMessage from '../components/LoadingMessage';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiRequest('/api/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingMessage message="Loading live dashboard statistics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
        </div>
        <ErrorBanner message={error} onRetry={fetchStats} />
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

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Office Dashboard</h1>
          <p className="page-subtitle">Real-time counts calculated directly from database records</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchStats}>
            ↻ Refresh Stats
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
              icon="👥"
              subtitle="All registered staff"
            />
            <StatCard
              title="Active Staff"
              value={employees.active}
              icon="🟢"
              colorClass="stat-success"
              subtitle={`${employees.total > 0 ? Math.round((employees.active / employees.total) * 100) : 0}% of workforce`}
            />
            <StatCard
              title="Inactive Staff"
              value={employees.inactive}
              icon="⚪"
              colorClass="stat-muted"
              subtitle="Retired or inactive"
            />
            <StatCard
              title="Pending Leave"
              value={leave.pending}
              icon="⏳"
              colorClass={leave.pending > 0 ? 'stat-warning' : ''}
              subtitle="Requires review"
            />
          </div>

          {/* Breakdown Sections */}
          <div className="dashboard-grid">
            {/* Department Breakdown */}
            <div className="card dashboard-section">
              <div className="card-header">
                <h2 className="card-title">Employees by Department</h2>
              </div>
              <div className="dashboard-card-body">
                {byDepartment.length === 0 ? (
                  <p className="text-subtle">No department data available.</p>
                ) : (
                  <div className="bar-list">
                    {byDepartment.map((dept) => {
                      const pct = Math.round((dept.count / maxDeptCount) * 100);
                      return (
                        <div key={dept.department} className="bar-item">
                          <div className="bar-label-row">
                            <span className="font-semibold">{dept.department}</span>
                            <span className="text-subtle font-semibold">
                              {dept.count} {dept.count === 1 ? 'staff' : 'staff'}
                            </span>
                          </div>
                          <div className="bar-track">
                            <div
                              className="bar-fill bar-primary"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Leave Status Breakdown */}
            <div className="card dashboard-section">
              <div className="card-header">
                <h2 className="card-title">Leave Requests Overview</h2>
              </div>
              <div className="dashboard-card-body">
                <div className="leave-summary-grid">
                  <div className="leave-summary-card">
                    <span className="text-subtle">Total Requests</span>
                    <span className="summary-number">{leave.total}</span>
                  </div>
                  <div className="leave-summary-card">
                    <span className="text-subtle">Pending Review</span>
                    <span className="summary-number text-warning">{leave.pending}</span>
                  </div>
                  <div className="leave-summary-card">
                    <span className="text-subtle">Approved</span>
                    <span className="summary-number text-success">{leave.approved}</span>
                  </div>
                  <div className="leave-summary-card">
                    <span className="text-subtle">Rejected</span>
                    <span className="summary-number text-danger">{leave.rejected}</span>
                  </div>
                </div>

                {leave.total > 0 && (
                  <div className="bar-list" style={{ marginTop: '1.5rem' }}>
                    <div className="bar-item">
                      <div className="bar-label-row">
                        <span>Approved</span>
                        <span className="text-subtle">
                          {Math.round((leave.approved / leave.total) * 100)}% ({leave.approved})
                        </span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill bar-success"
                          style={{
                            width: `${(leave.approved / leave.total) * 100}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="bar-item">
                      <div className="bar-label-row">
                        <span>Pending</span>
                        <span className="text-subtle">
                          {Math.round((leave.pending / leave.total) * 100)}% ({leave.pending})
                        </span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill bar-warning"
                          style={{
                            width: `${(leave.pending / leave.total) * 100}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="bar-item">
                      <div className="bar-label-row">
                        <span>Rejected</span>
                        <span className="text-subtle">
                          {Math.round((leave.rejected / leave.total) * 100)}% ({leave.rejected})
                        </span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill bar-danger"
                          style={{
                            width: `${(leave.rejected / leave.total) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
