import { and, desc, eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { db, schema } from '@/db';
import { getCurrentUser } from '@/lib/auth';
import { TaskDetail } from '@/components/task-detail';
export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const { id } = await params;
  const task = (
    await db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, user.id)))
      .limit(1)
  )[0];
  if (!task) notFound();
  const activity = await db
    .select()
    .from(schema.taskActivity)
    .where(eq(schema.taskActivity.taskId, id))
    .orderBy(desc(schema.taskActivity.createdAt));
  return <TaskDetail task={task} activity={activity} />;
}
