import { and, eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { db, schema } from '@/db';
import { getCurrentUser } from '@/lib/auth';
import { TaskForm } from '@/components/task-form';
export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
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
  return (
    <main className="form-shell">
      <TaskForm task={task} />
    </main>
  );
}
