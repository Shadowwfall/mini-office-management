import * as leaveQueries from '../queries/leaveQueries.js';

export async function list(req, res, next) {
  try {
    const query = req.validatedQuery || req.query;
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 20);

    // If role is employee, force filtering only to their own records
    const targetEmployeeId =
      req.user.role === 'employee' ? req.user.employeeId : query.employeeId;

    const { leaveRequests, total } = await leaveQueries.listLeaveRequests({
      status: query.status,
      employeeId: targetEmployeeId,
      search: query.search,
      page,
      limit
    });

    res.status(200).json({
      data: leaveRequests,
      meta: {
        total,
        page,
        limit
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const payload = { ...req.body };

    // If employee submits, force their own employeeId from token
    if (req.user.role === 'employee') {
      payload.employeeId = req.user.employeeId;
    }

    const result = await leaveQueries.createLeaveRequest(payload);
    if (result.error === 'EMPLOYEE_NOT_FOUND') {
      return res.status(404).json({
        error: { message: `Employee with ID ${payload.employeeId} not found.` }
      });
    }

    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const id = Number((req.validatedParams && req.validatedParams.id) || req.params.id);
    const { status, reviewNote } = req.body;

    const result = await leaveQueries.updateLeaveStatus(id, {
      status,
      reviewNote,
      reviewedBy: req.user.id
    });

    if (result.notFound) {
      return res.status(404).json({
        error: { message: `Leave request with ID ${id} not found.` }
      });
    }

    if (result.conflict) {
      return res.status(409).json({
        error: {
          message: `Leave request has already been reviewed (current status: ${result.currentStatus}).`
        }
      });
    }

    res.status(200).json({ data: result.data });
  } catch (err) {
    next(err);
  }
}
