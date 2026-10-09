import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';
import EmployeeForm from '../components/EmployeeForm';
import LoadingMessage from '../components/LoadingMessage';
import ErrorBanner from '../components/ErrorBanner';

export default function EmployeeEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadEmployee() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiRequest(`/api/employees/${id}`);
        setEmployee(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load employee details.');
      } finally {
        setIsLoading(false);
      }
    }
    loadEmployee();
  }, [id]);

  async function handleUpdate(formData) {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiRequest(`/api/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      navigate('/employees', {
        state: { message: `Employee ${res.data.fullName} updated successfully.` }
      });
    } catch (err) {
      setError(err.message || 'Failed to update employee.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="page-container page-narrow">
        <LoadingMessage message="Loading employee..." />
      </div>
    );
  }

  return (
    <div className="page-container page-narrow">
      {error && <ErrorBanner message={error} />}
      {employee && (
        <EmployeeForm
          title={`Edit Employee: ${employee.fullName}`}
          initialData={employee}
          onSubmit={handleUpdate}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
