import { z } from 'zod';

export const DEPARTMENTS = [
  'Engineering',
  'HR',
  'Finance',
  'Sales',
  'Operations',
  'Support'
];

export const EMPLOYEE_STATUSES = ['active', 'inactive'];

export const createEmployeeSchema = z.object({
  employeeCode: z
    .string()
    .trim()
    .min(1, 'Employee code is required')
    .max(20, 'Employee code cannot exceed 20 characters'),
  fullName: z
    .string()
    .trim()
    .min(1, 'Full name is required')
    .max(100, 'Full name cannot exceed 100 characters'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address')
    .max(255, 'Email cannot exceed 255 characters'),
  phone: z
    .string()
    .trim()
    .max(20, 'Phone cannot exceed 20 characters')
    .optional()
    .nullable(),
  department: z.enum(DEPARTMENTS, {
    errorMap: () => ({ message: `Department must be one of: ${DEPARTMENTS.join(', ')}` })
  }),
  designation: z
    .string()
    .trim()
    .min(1, 'Designation is required')
    .max(100, 'Designation cannot exceed 100 characters'),
  joiningDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Joining date must be in YYYY-MM-DD format'),
  status: z.enum(EMPLOYEE_STATUSES).optional().default('active')
});

export const updateEmployeeSchema = z.object({
  employeeCode: z
    .string()
    .trim()
    .min(1, 'Employee code is required')
    .max(20, 'Employee code cannot exceed 20 characters'),
  fullName: z
    .string()
    .trim()
    .min(1, 'Full name is required')
    .max(100, 'Full name cannot exceed 100 characters'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address')
    .max(255, 'Email cannot exceed 255 characters'),
  phone: z
    .string()
    .trim()
    .max(20, 'Phone cannot exceed 20 characters')
    .optional()
    .nullable(),
  department: z.enum(DEPARTMENTS, {
    errorMap: () => ({ message: `Department must be one of: ${DEPARTMENTS.join(', ')}` })
  }),
  designation: z
    .string()
    .trim()
    .min(1, 'Designation is required')
    .max(100, 'Designation cannot exceed 100 characters'),
  joiningDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Joining date must be in YYYY-MM-DD format'),
  status: z.enum(EMPLOYEE_STATUSES)
});

export const employeeQuerySchema = z.object({
  search: z.string().trim().optional(),
  department: z.enum(DEPARTMENTS).optional(),
  status: z.enum(EMPLOYEE_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const employeeIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Employee ID must be a positive integer')
});
