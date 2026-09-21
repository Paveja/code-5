import { and, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { getCurrentUser, newId } from '@/lib/auth';
import { fail, ok } from '@/lib/api';
import { taskSchema } from '@/lib/validation';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return fail('Authentication required.', 401, 'UNAUTHORIZED');
  const { id } = await context.params;
  const task = (
    await db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, user.id)))
      .limit(1)
  )[0];
  if (!task) return fail('Task not found.', 404, 'NOT_FOUND');
  return ok({ task });
}

export async function PATCH(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return fail('Authentication required.', 401, 'UNAUTHORIZED');
  const { id } = await context.params;
  const existing = (
    await db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, user.id)))
      .limit(1)
  )[0];
  if (!existing) return fail('Task not found.', 404, 'NOT_FOUND');
  const parsed = taskSchema.partial().safeParse(await request.json());
  if (!parsed.success)
    return fail(
      'Please check the task fields.',
      422,
      'VALIDATION_ERROR',
      parsed.error.flatten().fieldErrors
    );
  const now = new Date();
  const changes = { ...parsed.data, updatedAt: now };
  const summary =
    parsed.data.status && parsed.data.status !== existing.status
      ? `Moved to ${parsed.data.status.replace('_', ' ')}`
      : parsed.data.assignee !== undefined
        ? `Assigned to ${parsed.data.assignee || 'unassigned'}`
        : 'Updated task details';
  await db.transaction(async (tx) => {
    await tx.update(schema.tasks).set(changes).where(eq(schema.tasks.id, id));
    await tx.insert(schema.taskActivity).values({
      id: newId(),
      taskId: id,
      userId: user.id,
      action: 'updated',
      summary,
      createdAt: now,
    });
  });
  return ok({ task: { ...existing, ...changes } });
}

export async function DELETE(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return fail('Authentication required.', 401, 'UNAUTHORIZED');
  const { id } = await context.params;
  const existing = (
    await db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, user.id)))
      .limit(1)
  )[0];
  if (!existing) return fail('Task not found.', 404, 'NOT_FOUND');
  await db.delete(schema.tasks).where(eq(schema.tasks.id, id));
  return ok({ deleted: true });
}
