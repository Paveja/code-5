import { describe, expect, it } from 'vitest';
import { credentialsSchema, taskQuerySchema, taskSchema } from '@/lib/validation';

describe('validation', () => {
  it('rejects short passwords', () => {
    expect(
      credentialsSchema.safeParse({ email: 'demo@example.com', password: 'short' }).success
    ).toBe(false);
  });
  it('applies task defaults', () => {
    expect(taskSchema.parse({ title: 'Plan', description: 'Write the outline' })).toMatchObject({
      status: 'todo',
      priority: 'medium',
    });
  });
  it('bounds pagination and parses filters', () => {
    expect(taskQuerySchema.parse({ page: '2', pageSize: '10', status: 'done' })).toMatchObject({
      page: 2,
      pageSize: 10,
      status: 'done',
    });
    expect(taskQuerySchema.safeParse({ pageSize: '1000' }).success).toBe(false);
  });
});
