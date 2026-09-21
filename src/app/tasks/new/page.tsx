import { redirect } from 'next/navigation';
import { TaskForm } from '@/components/task-form';
import { getCurrentUser } from '@/lib/auth';
export default async function NewTaskPage() {
  if (!(await getCurrentUser())) redirect('/login');
  return (
    <main className="form-shell">
      <TaskForm />
    </main>
  );
}
