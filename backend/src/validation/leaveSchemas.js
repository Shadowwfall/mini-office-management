import { z } from 'zod';

export const LEAVE_TYPES = ['annual', 'sick', 'casual', 'unpaid'];
export const LEAVE_STATUSES = ['pending', 'approved', 'rejected'];

export const createLeaveSchema = z
  .object({
    employeeId: z.coerce.number().int().positive('Valid employee ID is required'),
    leaveType: z.enum(LEAVE_TYPES, {
      errorMap: () => ({ message: `Leave type must be one of: ${LEAVE_TYPES.join(', ')}` })
    }),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
    reason: z
      .string()
      .trim()
      .min(1, 'Reason is required')
      .max(500, 'Reason cannot exceed 500 characters')
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate']
  });

export const updateLeaveStatusSchema = z.object({
  status: z.enum(['approved', 'rejected'], {
    errorMap: () => ({ message: "Status must be either 'approved' or 'rejected'" })
  }),
  reviewNote: z.string().trim().max(500, 'Review note cannot exceed 500 characters').optional().nullable()
});

export const leaveQuerySchema = z.object({
  status: z.enum(LEAVE_STATUSES).optional(),
  employeeId: z.coerce.number().int().positive().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const leaveIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Leave ID must be a positive integer')
});
