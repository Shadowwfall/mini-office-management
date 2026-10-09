import { Router } from 'express';
import * as employeeController from '../controllers/employeeController.js';
import { validate } from '../middleware/validate.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeQuerySchema,
  employeeIdParamSchema
} from '../validation/employeeSchemas.js';

const router = Router();

// Protect all employee endpoints: Admin only
router.use(verifyToken, requireRole('admin'));

router.get(
  '/',
  validate(employeeQuerySchema, 'query'),
  employeeController.list
);

router.get(
  '/:id',
  validate(employeeIdParamSchema, 'params'),
  employeeController.getById
);

router.post(
  '/',
  validate(createEmployeeSchema, 'body'),
  employeeController.create
);

router.put(
  '/:id',
  validate(employeeIdParamSchema, 'params'),
  validate(updateEmployeeSchema, 'body'),
  employeeController.update
);

router.delete(
  '/:id',
  validate(employeeIdParamSchema, 'params'),
  employeeController.remove
);

export default router;
