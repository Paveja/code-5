import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import { getCurrentUser, newId } from '@/lib/auth';
import { fail, ok } from '@/lib/api';
import { taskQuerySchema, taskSchema } from '@/lib/validation';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return fail('Authentication required.', 401, 'UNAUTHORIZED');
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const query = taskQuerySchema.safeParse(params);
  if (!query.success)
    return fail('Invalid filters.', 422, 'VALIDATION_ERROR', query.error.flatten().fieldErrors);
  const { search, status, priority, sort, direction, page, pageSize } = query.data;
  const filters = [eq(schema.tasks.userId, user.id)];
  if (status) filters.push(eq(schema.tasks.status, status));
  if (priority) filters.push(eq(schema.tasks.priority, priority));
  if (search)
    filters.push(
      or(like(schema.tasks.title, `%${search}%`), like(schema.tasks.description, `%${search}%`))!
    );
  const orderColumn = {
    createdAt: schema.tasks.createdAt,
    dueDate: schema.tasks.dueDate,
    title: schema.tasks.title,
    priority: schema.tasks.priority,
  }[sort];
  const rows = await db
    .select()
    .from(schema.tasks)
    .where(and(...filters))
    .orderBy(direction === 'asc' ? asc(orderColumn) : desc(orderColumn))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const count =
    (
      await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.tasks)
        .where(and(...filters))
    )[0]?.count ?? 0;
  return ok({
    tasks: rows,
    pagination: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) },
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return fail('Authentication required.', 401, 'UNAUTHORIZED');
  const parsed = taskSchema.safeParse(await request.json());
  if (!parsed.success)
    return fail(
      'Please check the task fields.',
      422,
      'VALIDATION_ERROR',
      parsed.error.flatten().fieldErrors
    );
  const now = new Date();
  const task = {
    id: newId(),
    userId: user.id,
    ...parsed.data,
    dueDate: parsed.data.dueDate ?? null,
    assignee: parsed.data.assignee ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await db.transaction(async (tx) => {
    await tx.insert(schema.tasks).values(task);
    await tx.insert(schema.taskActivity).values({
      id: newId(),
      taskId: task.id,
      userId: user.id,
      action: 'created',
      summary: 'Created this task',
      createdAt: now,
    });
  });
  return ok({ task }, { status: 201 });
}
