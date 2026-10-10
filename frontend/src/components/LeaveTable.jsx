import React from 'react';
import StatusBadge from './StatusBadge';

export default function LeaveTable({ leaveRequests, onAction, processingId, isAdmin = false }) {
  if (!leaveRequests || leaveRequests.length === 0) {
    return null;
  }

  function calculateDays(start, end) {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e - s);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }

  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Type</th>
            <th>Duration</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Submitted</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leaveRequests.map((req) => {
            const isPending = req.status === 'pending';
            const isProcessing = processingId === req.id;
            const days = calculateDays(req.startDate, req.endDate);

            return (
              <tr key={req.id}>
                <td>
                  <span className="font-semibold">{req.employeeName}</span>
                  <div>
                    <span className="code-tag">{req.employeeCode}</span>
                  </div>
                </td>
                <td>
                  <span className="text-capitalize">{req.leaveType}</span>
                </td>
                <td>
                  <div>{req.startDate} to {req.endDate}</div>
                  <div className="text-subtle">{days} {days === 1 ? 'day' : 'days'}</div>
                </td>
                <td style={{ maxWidth: '240px', whiteSpace: 'normal' }}>
                  <span>{req.reason}</span>
                  {req.reviewNote && (
                    <div className="text-subtle" style={{ fontStyle: 'italic', marginTop: '2px' }}>
                      Note: {req.reviewNote}
                    </div>
                  )}
                </td>
                <td>
                  <StatusBadge status={req.status} />
                </td>
                <td className="text-subtle">
                  {req.submittedAt ? req.submittedAt.split('T')[0] : '-'}
                </td>
                <td className="text-right">
                  <div className="table-actions">
                    {isAdmin ? (
                      isPending ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-xs btn-primary"
                            disabled={isProcessing}
                            onClick={() => onAction(req.id, 'approved')}
                          >
                            {isProcessing ? '...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-danger"
                            disabled={isProcessing}
                            onClick={() => onAction(req.id, 'rejected')}
                          >
                            {isProcessing ? '...' : 'Reject'}
                          </button>
                        </>
                      ) : (
                        <span className="text-subtle" style={{ fontSize: '0.8125rem' }}>
                          —
                        </span>
                      )
                    ) : (
                      <span className="text-subtle" style={{ fontSize: '0.8125rem' }}>
                        {isPending ? 'Pending Review' : '—'}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
