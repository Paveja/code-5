import { and, desc, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { getCurrentUser } from '@/lib/auth';
import { fail, ok } from '@/lib/api';

type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return fail('Authentication required.', 401, 'UNAUTHORIZED');
  const { id } = await context.params;
  const task = (
    await db
      .select({ id: schema.tasks.id })
      .from(schema.tasks)
      .where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, user.id)))
      .limit(1)
  )[0];
  if (!task) return fail('Task not found.', 404, 'NOT_FOUND');
  const activity = await db
    .select()
    .from(schema.taskActivity)
    .where(eq(schema.taskActivity.taskId, id))
    .orderBy(desc(schema.taskActivity.createdAt));
  return ok({ activity });
}
