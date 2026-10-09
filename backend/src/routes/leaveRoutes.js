import { Router } from 'express';
import * as leaveController from '../controllers/leaveController.js';
import { validate } from '../middleware/validate.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  createLeaveSchema,
  updateLeaveStatusSchema,
  leaveQuerySchema,
  leaveIdParamSchema
} from '../validation/leaveSchemas.js';

const router = Router();

router.get(
  '/',
  verifyToken,
  validate(leaveQuerySchema, 'query'),
  leaveController.list
);

router.post(
  '/',
  verifyToken,
  validate(createLeaveSchema, 'body'),
  leaveController.create
);

router.patch(
  '/:id/status',
  verifyToken,
  requireRole('admin'),
  validate(leaveIdParamSchema, 'params'),
  validate(updateLeaveStatusSchema, 'body'),
  leaveController.updateStatus
);

export default router;
