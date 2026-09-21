'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type Task = {
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  assignee?: string | null;
};
export function TaskForm({ task }: { task?: Task }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? 'todo',
    priority: task?.priority ?? 'medium',
    dueDate: task?.dueDate ?? '',
    assignee: task?.assignee ?? '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(task?.id);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const response = await fetch(isEdit ? `/api/tasks/${task?.id}` : '/api/tasks', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        dueDate: form.dueDate || null,
        assignee: form.assignee || null,
      }),
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(payload.error?.message ?? 'Please check the form.');
      return;
    }
    router.push(isEdit ? `/tasks/${task?.id}` : '/dashboard');
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="task-form">
      <div className="form-header">
        <div>
          <p className="eyebrow">{isEdit ? 'Refine the details' : 'A new beginning'}</p>
          <h1>{isEdit ? 'Edit task' : 'Create a task'}</h1>
        </div>
        <button type="button" className="button button-ghost" onClick={() => router.back()}>
          Cancel
        </button>
      </div>
      <label>
        Task title
        <input
          required
          maxLength={140}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="What needs your attention?"
        />
      </label>
      <label>
        Description
        <textarea
          required
          rows={6}
          maxLength={4000}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Add enough context for your future self…"
        />
      </label>
      <div className="form-grid">
        <label>
          Status
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </label>
        <label>
          Priority
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label>
          Due date
          <input
            type="date"
            value={form.dueDate ?? ''}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </label>
        <label>
          Assignee
          <input
            value={form.assignee ?? ''}
            onChange={(e) => setForm({ ...form, assignee: e.target.value })}
            placeholder="Optional"
          />
        </label>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="button button-primary" disabled={loading}>
          {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
        </button>
      </div>
    </form>
  );
}
