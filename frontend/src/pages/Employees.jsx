import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { DEPARTMENTS, EMPLOYEE_STATUSES } from '../constants';
import EmployeeTable from '../components/EmployeeTable';
import Pagination from '../components/Pagination';
import LoadingMessage from '../components/LoadingMessage';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import AccordionSelect from '../components/AccordionSelect';

export default function Employees() {
  const location = useLocation();

  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    ...DEPARTMENTS.map((dept) => ({ value: dept, label: dept }))
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...EMPLOYEE_STATUSES
  ];

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(location.state?.message || null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      if (search.trim()) params.append('search', search.trim());
      if (department) params.append('department', department);
      if (status) params.append('status', status);

      const res = await apiRequest(`/api/employees?${params.toString()}`);
      setEmployees(res.data || []);
      setTotal(res.meta?.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load employees.');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, department, status]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  async function handleDelete(emp) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${emp.fullName} (${emp.employeeCode})? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(emp.id);
    setError(null);
    try {
      await apiRequest(`/api/employees/${emp.id}`, { method: 'DELETE' });
      setFeedbackMessage(`Employee ${emp.fullName} was successfully deleted.`);
      fetchEmployees();
    } catch (err) {
      setError(err.message || 'Failed to delete employee.');
    } finally {
      setDeletingId(null);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  }

  function handleFilterReset() {
    setSearch('');
    setDepartment('');
    setStatus('');
    setPage(1);
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">Manage directory, roles, and status</p>
        </div>
        <Link to="/employees/new" className="btn btn-primary">
          + Add Employee
        </Link>
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

      {error && <ErrorBanner message={error} onRetry={fetchEmployees} />}

      {/* Filters bar */}
      <div className="card filter-card">
        <form onSubmit={handleSearchSubmit} className="filter-form">
          <div className="filter-group">
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search by code, name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <AccordionSelect
              options={departmentOptions}
              value={department}
              placeholder="All Departments"
              onChange={(val) => {
                setDepartment(val);
                setPage(1);
              }}
            />
          </div>

          <div className="filter-group">
            <AccordionSelect
              options={statusOptions}
              value={status}
              placeholder="All Statuses"
              onChange={(val) => {
                setStatus(val);
                setPage(1);
              }}
            />
          </div>

          {(search || department || status) && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleFilterReset}
            >
              Clear Filters
            </button>
          )}
        </form>
      </div>

      {/* Table & states */}
      <div className="card">
        {isLoading ? (
          <LoadingMessage message="Loading employees..." />
        ) : employees.length === 0 ? (
          <EmptyState
            message="No employees match your search or filter criteria."
            action={
              <Link to="/employees/new" className="btn btn-sm btn-primary">
                Add an Employee
              </Link>
            }
          />
        ) : (
          <>
            <EmployeeTable
              employees={employees}
              onDelete={handleDelete}
              deletingId={deletingId}
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
