import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEPARTMENTS, EMPLOYEE_STATUSES } from '../constants';
import { useErrorShake } from '../hooks/useErrorShake';

export default function EmployeeForm({ initialData = {}, onSubmit, isSubmitting, title }) {
  const navigate = useNavigate();
  const { shakingFields, triggerShake, clearShake } = useErrorShake();

  const [formData, setFormData] = useState({
    employeeCode: initialData.employeeCode || '',
    fullName: initialData.fullName || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    department: initialData.department || DEPARTMENTS[0],
    designation: initialData.designation || '',
    joiningDate: initialData.joiningDate || new Date().toISOString().split('T')[0],
    status: initialData.status || 'active'
  });

  const [errors, setErrors] = useState({});

  function validate() {
    const newErrors = {};
    if (!formData.employeeCode.trim()) {
      newErrors.employeeCode = 'Employee code is required.';
    } else if (formData.employeeCode.length > 20) {
      newErrors.employeeCode = 'Employee code cannot exceed 20 characters.';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.department) {
      newErrors.department = 'Department is required.';
    }

    if (!formData.designation.trim()) {
      newErrors.designation = 'Designation is required.';
    }

    if (!formData.joiningDate) {
      newErrors.joiningDate = 'Joining date is required.';
    }

    setErrors(newErrors);

    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length > 0) {
      triggerShake(errorKeys);
      return false;
    }
    return true;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
      clearShake(name);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  }

  return (
    <div className="card form-card">
      <div className="card-header">
        <h2 className="card-title">{title}</h2>
      </div>
      <form onSubmit={handleSubmit} className="form-body" noValidate>
        <div className="form-grid">
          {/* Employee Code */}
          <div className={`form-group t-input-wrap ${errors.employeeCode ? 'is-error' : ''}`}>
            <label htmlFor="employeeCode" className="form-label">
              Employee Code <span className="text-danger">*</span>
            </label>
            <input
              id="employeeCode"
              name="employeeCode"
              type="text"
              className={`form-input t-input ${errors.employeeCode ? 'is-invalid is-error' : ''} ${shakingFields.employeeCode ? 'is-shaking' : ''}`}
              placeholder="e.g. EMP-001"
              value={formData.employeeCode}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {errors.employeeCode && (
              <p className="form-error t-error-msg">{errors.employeeCode}</p>
            )}
          </div>

          {/* Full Name */}
          <div className={`form-group t-input-wrap ${errors.fullName ? 'is-error' : ''}`}>
            <label htmlFor="fullName" className="form-label">
              Full Name <span className="text-danger">*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              className={`form-input t-input ${errors.fullName ? 'is-invalid is-error' : ''} ${shakingFields.fullName ? 'is-shaking' : ''}`}
              placeholder="e.g. John Doe"
              value={formData.fullName}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {errors.fullName && (
              <p className="form-error t-error-msg">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div className={`form-group t-input-wrap ${errors.email ? 'is-error' : ''}`}>
            <label htmlFor="email" className="form-label">
              Work Email <span className="text-danger">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className={`form-input t-input ${errors.email ? 'is-invalid is-error' : ''} ${shakingFields.email ? 'is-shaking' : ''}`}
              placeholder="e.g. john@company.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="form-error t-error-msg">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="form-group t-input-wrap">
            <label htmlFor="phone" className="form-label">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="form-input t-input"
              placeholder="e.g. +1 555-0199"
              value={formData.phone}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          {/* Department */}
          <div className={`form-group t-input-wrap ${errors.department ? 'is-error' : ''}`}>
            <label htmlFor="department" className="form-label">
              Department <span className="text-danger">*</span>
            </label>
            <select
              id="department"
              name="department"
              className={`form-select t-input ${errors.department ? 'is-invalid is-error' : ''} ${shakingFields.department ? 'is-shaking' : ''}`}
              value={formData.department}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            {errors.department && (
              <p className="form-error t-error-msg">{errors.department}</p>
            )}
          </div>

          {/* Designation */}
          <div className={`form-group t-input-wrap ${errors.designation ? 'is-error' : ''}`}>
            <label htmlFor="designation" className="form-label">
              Designation <span className="text-danger">*</span>
            </label>
            <input
              id="designation"
              name="designation"
              type="text"
              className={`form-input t-input ${errors.designation ? 'is-invalid is-error' : ''} ${shakingFields.designation ? 'is-shaking' : ''}`}
              placeholder="e.g. Senior Software Engineer"
              value={formData.designation}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {errors.designation && (
              <p className="form-error t-error-msg">{errors.designation}</p>
            )}
          </div>

          {/* Joining Date */}
          <div className={`form-group t-input-wrap ${errors.joiningDate ? 'is-error' : ''}`}>
            <label htmlFor="joiningDate" className="form-label">
              Joining Date <span className="text-danger">*</span>
            </label>
            <input
              id="joiningDate"
              name="joiningDate"
              type="date"
              className={`form-input t-input ${errors.joiningDate ? 'is-invalid is-error' : ''} ${shakingFields.joiningDate ? 'is-shaking' : ''}`}
              value={formData.joiningDate}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {errors.joiningDate && (
              <p className="form-error t-error-msg">{errors.joiningDate}</p>
            )}
          </div>

          {/* Status */}
          <div className="form-group t-input-wrap">
            <label htmlFor="status" className="form-label">
              Status <span className="text-danger">*</span>
            </label>
            <select
              id="status"
              name="status"
              className="form-select t-input"
              value={formData.status}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              {EMPLOYEE_STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/employees')}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Employee'}
          </button>
        </div>
      </form>
    </div>
  );
}
