import { z } from 'zod';

export const statusSchema = z.enum(['todo', 'in_progress', 'done']);
export const prioritySchema = z.enum(['low', 'medium', 'high']);

export const credentialsSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .max(120, 'Title must be 120 characters or fewer.'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required.')
    .max(2000, 'Description must be 2,000 characters or fewer.'),
  status: statusSchema.default('todo'),
  priority: prioritySchema.default('medium'),
  dueDate: z.string().nullable().optional(),
  assignee: z.string().trim().max(80).nullable().optional(),
});

export const taskQuerySchema = z.object({
  search: z.string().trim().max(80).optional().default(''),
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
  sort: z.enum(['createdAt', 'dueDate', 'title', 'priority']).optional().default('createdAt'),
  direction: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(8),
});

export type TaskInput = z.infer<typeof taskSchema>;
