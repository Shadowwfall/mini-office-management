import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import LeaveTable from '../components/LeaveTable';
import Pagination from '../components/Pagination';
import LoadingMessage from '../components/LoadingMessage';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import SlidingTabs from '../components/SlidingTabs';

const STATUS_TABS = [
  { value: '', label: 'All Requests' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }
];

export default function Leave() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(location.state?.message || null);
  const [processingId, setProcessingId] = useState(null);

  const fetchLeaveRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      if (statusFilter) params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await apiRequest(`/api/leave-requests?${params.toString()}`);
      setLeaveRequests(res.data || []);
      setTotal(res.meta?.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load leave requests.');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, statusFilter, search]);

  useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  async function handleAction(id, nextStatus) {
    const reviewNote = window.prompt(`Optional review note for ${nextStatus}:`);
    if (reviewNote === null) return; // User cancelled prompt

    setProcessingId(id);
    setError(null);
    try {
      await apiRequest(`/api/leave-requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextStatus,
          reviewNote: reviewNote.trim() || null
        })
      });
      setFeedbackMessage(`Leave request #${id} marked as ${nextStatus}.`);
      fetchLeaveRequests();
    } catch (err) {
      setError(err.message || `Failed to update status to ${nextStatus}.`);
    } finally {
      setProcessingId(null);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    fetchLeaveRequests();
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isAdmin ? 'Leave Requests' : 'My Leave Requests'}</h1>
          <p className="page-subtitle">
            {isAdmin
              ? 'Track, review, and manage absence requests'
              : 'View and track the status of your submitted leaves'}
          </p>
        </div>
        {!isAdmin && (
          <Link to="/leave/new" className="btn btn-primary">
            + Submit Leave Request
          </Link>
        )}
      </div>

      {feedbackMessage && (
        <div className="alert-banner alert-success" role="status">
          <span>✓ {feedbackMessage}</span>
          <button
            type="button"
            className="alert-close"
            onClick={() => setFeedbackMessage(null)}
          >
            ×
          </button>
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={fetchLeaveRequests} />}

      {/* Tabs & Search Filter Card */}
      <div className="card filter-card">
        <div className="filter-tabs-row">
          <SlidingTabs
            tabs={STATUS_TABS}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          />

          <form onSubmit={handleSearchSubmit} className="search-form-inline">
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search by employee name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Table & states */}
      <div className="card">
        {isLoading ? (
          <LoadingMessage message="Loading leave requests..." />
        ) : leaveRequests.length === 0 ? (
          <EmptyState
            message="No leave requests found for the selected criteria."
            action={
              !isAdmin ? (
                <Link to="/leave/new" className="btn btn-sm btn-primary">
                  Submit a Request
                </Link>
              ) : null
            }
          />
        ) : (
          <>
            <LeaveTable
              leaveRequests={leaveRequests}
              onAction={handleAction}
              processingId={processingId}
              isAdmin={isAdmin}
            />
            <Pagination
              page={page}
              limit={limit}
              total={total}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </>
        )}
      </div>
    </div>
  );
}
