import * as employeeQueries from '../queries/employeeQueries.js';

export async function list(req, res, next) {
  try {
    const query = req.validatedQuery || req.query;
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 20);

    const { employees, total } = await employeeQueries.listEmployees({
      search: query.search,
      department: query.department,
      status: query.status,
      page,
      limit
    });

    res.status(200).json({
      data: employees,
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

export async function getById(req, res, next) {
  try {
    const id = Number((req.validatedParams && req.validatedParams.id) || req.params.id);
    const employee = await employeeQueries.getEmployeeById(id);
    if (!employee) {
      return res.status(404).json({
        error: { message: `Employee with ID ${id} not found.` }
      });
    }

    res.status(200).json({ data: employee });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const employee = await employeeQueries.createEmployee(req.body);
    res.status(201).json({ data: employee });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const id = Number((req.validatedParams && req.validatedParams.id) || req.params.id);
    const employee = await employeeQueries.updateEmployee(id, req.body);
    if (!employee) {
      return res.status(404).json({
        error: { message: `Employee with ID ${id} not found.` }
      });
    }

    res.status(200).json({ data: employee });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const id = Number((req.validatedParams && req.validatedParams.id) || req.params.id);
    const deleted = await employeeQueries.deleteEmployee(id);
    if (!deleted) {
      return res.status(404).json({
        error: { message: `Employee with ID ${id} not found.` }
      });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
