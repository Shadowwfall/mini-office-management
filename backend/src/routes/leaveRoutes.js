import { Router } from 'express';
import * as leaveController from '../controllers/leaveController.js';
import { validate } from '../middleware/validate.js';
import {
  createLeaveSchema,
  updateLeaveStatusSchema,
  leaveQuerySchema,
  leaveIdParamSchema
} from '../validation/leaveSchemas.js';

const router = Router();

router.get(
  '/',
  validate(leaveQuerySchema, 'query'),
  leaveController.list
);

router.post(
  '/',
  validate(createLeaveSchema, 'body'),
  leaveController.create
);

router.patch(
  '/:id/status',
  validate(leaveIdParamSchema, 'params'),
  validate(updateLeaveStatusSchema, 'body'),
  leaveController.updateStatus
);

export default router;
