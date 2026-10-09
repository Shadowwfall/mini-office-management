import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';
import EmployeeForm from '../components/EmployeeForm';
import ErrorBanner from '../components/ErrorBanner';

export default function EmployeeNew() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleCreate(formData) {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiRequest('/api/employees', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      navigate('/employees', {
        state: { message: `Employee ${res.data.fullName} created successfully.` }
      });
    } catch (err) {
      setError(err.message || 'Failed to create employee.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-container page-narrow">
      {error && <ErrorBanner message={error} />}
      <EmployeeForm
        title="Add New Employee"
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
