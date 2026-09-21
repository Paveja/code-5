'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDate, priorityLabel, statusLabel } from '@/lib/utils';

type DateValue = string | Date;
type Task = {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  assignee: string | null;
  createdAt: DateValue;
  updatedAt: DateValue;
};
type Activity = { id: string; summary: string; createdAt: DateValue };
export function TaskDetail({ task, activity }: { task: Task; activity: Activity[] }) {
  const router = useRouter();
  async function remove() {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
    router.push('/dashboard');
    router.refresh();
  }
  return (
    <div className="detail-shell">
      <header className="detail-top">
        <Link href="/dashboard" className="back-link">
          ← Back to tasks
        </Link>
        <div className="detail-actions">
          <Link href={`/tasks/${task.id}/edit`} className="button button-secondary">
            Edit task
          </Link>
          <button className="button button-danger" onClick={remove}>
            Delete
          </button>
        </div>
      </header>
      <div className="detail-grid">
        <article className="detail-card">
          <div className="detail-meta">
            <span className={`status-badge ${task.status}`}>{statusLabel(task.status)}</span>
            <span className={`priority-pill ${task.priority}`}>
              {priorityLabel(task.priority)} priority
            </span>
          </div>
          <h1>{task.title}</h1>
          <p className="detail-description">{task.description}</p>
          <dl className="metadata-grid">
            <div>
              <dt>Due date</dt>
              <dd>{formatDate(task.dueDate)}</dd>
            </div>
            <div>
              <dt>Assignee</dt>
              <dd>{task.assignee || 'Unassigned'}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDate(task.createdAt)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatDate(task.updatedAt)}</dd>
            </div>
          </dl>
        </article>
        <aside className="activity-card">
          <p className="eyebrow">History</p>
          <h2>Activity</h2>
          {activity.length === 0 ? (
            <p className="muted">No activity yet.</p>
          ) : (
            <ol className="activity-list">
              {activity.map((item) => (
                <li key={item.id}>
                  <span className="activity-dot" />
                  <div>
                    <strong>{item.summary}</strong>
                    <small>{formatDate(item.createdAt)}</small>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </div>
  );
}
