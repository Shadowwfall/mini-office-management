import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { LEAVE_TYPES } from '../constants';
import ErrorBanner from '../components/ErrorBanner';
import LoadingMessage from '../components/LoadingMessage';

export default function LeaveNew() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveType: LEAVE_TYPES[0].value,
    startDate: today,
    endDate: today,
    reason: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    async function loadEmployees() {
      setLoadingEmployees(true);
      try {
        const res = await apiRequest('/api/employees?limit=100');
        const list = res.data || [];
        setEmployees(list);
        if (list.length > 0) {
          setFormData((prev) => ({ ...prev, employeeId: list[0].id.toString() }));
        }
      } catch (err) {
        setServerError('Failed to load employees for leave submission: ' + err.message);
      } finally {
        setLoadingEmployees(false);
      }
    }
    loadEmployees();
  }, []);

  function validate() {
    const newErrors = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Please select an employee.';
    }

    if (!formData.leaveType) {
      newErrors.leaveType = 'Please select a leave type.';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required.';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required.';
    } else if (formData.startDate && formData.endDate < formData.startDate) {
      newErrors.endDate = 'End date must be on or after start date.';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required.';
    } else if (formData.reason.length > 500) {
      newErrors.reason = 'Reason cannot exceed 500 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      await apiRequest('/api/leave-requests', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: Number(formData.employeeId),
          leaveType: formData.leaveType,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason.trim()
        })
      });

      navigate('/leave', {
        state: { message: 'Leave request submitted successfully.' }
      });
    } catch (err) {
      setServerError(err.message || 'Failed to submit leave request.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadingEmployees) {
    return (
      <div className="page-container page-narrow">
        <LoadingMessage message="Loading employee directory..." />
      </div>
    );
  }

  return (
    <div className="page-container page-narrow">
      <div className="page-header">
        <div>
          <h1 className="page-title">Submit Leave Request</h1>
          <p className="page-subtitle">File an upcoming absence or time off</p>
        </div>
      </div>

      {serverError && <ErrorBanner message={serverError} />}

      <div className="card form-card">
        <form onSubmit={handleSubmit} className="form-body" noValidate>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label htmlFor="employeeId" className="form-label">
                Employee <span className="text-danger">*</span>
              </label>
              {employees.length === 0 ? (
                <p className="text-subtle">
                  No employees available. Please create an employee first.
                </p>
              ) : (
                <select
                  id="employeeId"
                  name="employeeId"
                  className={`form-select ${errors.employeeId ? 'is-invalid' : ''}`}
                  value={formData.employeeId}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeCode}) - {emp.department}
                    </option>
                  ))}
                </select>
              )}
              {errors.employeeId && <p className="form-error">{errors.employeeId}</p>}
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label htmlFor="leaveType" className="form-label">
                Leave Type <span className="text-danger">*</span>
              </label>
              <select
                id="leaveType"
                name="leaveType"
                className={`form-select ${errors.leaveType ? 'is-invalid' : ''}`}
                value={formData.leaveType}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                {LEAVE_TYPES.map((lt) => (
                  <option key={lt.value} value={lt.value}>
                    {lt.label}
                  </option>
                ))}
              </select>
              {errors.leaveType && <p className="form-error">{errors.leaveType}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="startDate" className="form-label">
                Start Date <span className="text-danger">*</span>
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                className={`form-input ${errors.startDate ? 'is-invalid' : ''}`}
                value={formData.startDate}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.startDate && <p className="form-error">{errors.startDate}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="endDate" className="form-label">
                End Date <span className="text-danger">*</span>
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                className={`form-input ${errors.endDate ? 'is-invalid' : ''}`}
                value={formData.endDate}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.endDate && <p className="form-error">{errors.endDate}</p>}
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label htmlFor="reason" className="form-label">
                Reason <span className="text-danger">*</span>
              </label>
              <textarea
                id="reason"
                name="reason"
                rows="4"
                className={`form-input ${errors.reason ? 'is-invalid' : ''}`}
                placeholder="Brief description for the requested time off..."
                value={formData.reason}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.reason && <p className="form-error">{errors.reason}</p>}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/leave')}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || employees.length === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
