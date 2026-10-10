import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function EmployeeTable({ employees, onDelete, deletingId }) {
  if (!employees || employees.length === 0) {
    return null;
  }

  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Designation</th>
            <th>Status</th>
            <th>Joining Date</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>
                <span className="code-tag">{emp.employeeCode}</span>
              </td>
              <td>
                <span className="font-semibold">{emp.fullName}</span>
                {emp.phone && <div className="text-subtle">{emp.phone}</div>}
              </td>
              <td>{emp.email}</td>
              <td>{emp.department}</td>
              <td>{emp.designation}</td>
              <td>
                <StatusBadge status={emp.status} />
              </td>
              <td>{emp.joiningDate}</td>
              <td className="text-right">
                <div className="table-actions">
                  <Link
                    to={`/employees/${emp.id}/edit`}
                    className="btn btn-xs btn-outline"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="btn btn-xs btn-danger"
                    disabled={deletingId === emp.id}
                    onClick={() => onDelete(emp)}
                  >
                    {deletingId === emp.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
