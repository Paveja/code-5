'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { formatDate, priorityLabel, statusLabel } from '@/lib/utils';

type Task = {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
};
type User = { name: string; email: string };
const statusOptions = ['all', 'todo', 'in_progress', 'done'];

export function Dashboard({ user }: { user: User }) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [sort, setSort] = useState('createdAt');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function load() {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({
      page: String(page),
      pageSize: '6',
      sort,
      direction: 'desc',
    });
    if (query) params.set('search', query);
    if (status !== 'all') params.set('status', status);
    if (priority !== 'all') params.set('priority', priority);
    const response = await fetch(`/api/tasks?${params}`);
    const payload = await response.json();
    if (!response.ok) setError(payload.error?.message ?? 'Unable to load tasks.');
    else {
      setTasks(payload.data.tasks);
      setTotal(payload.data.pagination.total);
    }
    setLoading(false);
  }
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [page, status, priority, sort]);
  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    void load();
  }
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }
  const counts = {
    total,
    active: tasks.filter((task) => task.status !== 'done').length,
    done: tasks.filter((task) => task.status === 'done').length,
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand-mark">
          do<span>.</span>
        </Link>
        <nav>
          <span className="nav-label">Workspace</span>
          <Link className="nav-link active" href="/dashboard">
            <span>◒</span> Overview
          </Link>
          <Link className="nav-link" href="/tasks/new">
            <span>＋</span> New task
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
          <button className="icon-button" onClick={logout} aria-label="Sign out">
            ↗
          </button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">
              {new Intl.DateTimeFormat('en', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              }).format(new Date())}
            </p>
            <h1>Good morning, {user.name.split(' ')[0]}.</h1>
          </div>
          <Link href="/tasks/new" className="button button-primary">
            ＋ <span>New task</span>
          </Link>
        </header>
        <section className="stats-grid">
          <article>
            <span className="stat-kicker">All tasks</span>
            <strong>{counts.total}</strong>
            <small>Across your workspace</small>
          </article>
          <article>
            <span className="stat-kicker">In progress</span>
            <strong>{counts.active}</strong>
            <small>Keep the momentum</small>
          </article>
          <article>
            <span className="stat-kicker">Completed</span>
            <strong>{counts.done}</strong>
            <small>Small wins count</small>
          </article>
          <article className="quote-card">
            <span>“</span>
            <p>Focus on the next right thing.</p>
          </article>
        </section>
        <section className="task-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Your workspace</p>
              <h2>
                Tasks <span>{total}</span>
              </h2>
            </div>
            <Link href="/tasks/new" className="text-link">
              View all <span>→</span>
            </Link>
          </div>
          <div className="toolbar">
            <form onSubmit={submitSearch} className="search-box">
              <span>⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks"
                aria-label="Search tasks"
              />
            </form>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by status"
            >
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {item === 'all' ? 'All statuses' : statusLabel(item)}
                </option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by priority"
            >
              <option value="all">All priorities</option>
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort tasks">
              <option value="createdAt">Recently added</option>
              <option value="dueDate">Due date</option>
              <option value="title">Title</option>
              <option value="priority">Priority</option>
            </select>
          </div>
          {error && (
            <div className="error-state">
              <strong>We could not load your tasks.</strong>
              <p>{error}</p>
              <button className="button button-secondary" onClick={() => void load()}>
                Try again
              </button>
            </div>
          )}
          {loading ? (
            <div className="task-list" aria-busy="true">
              {[1, 2, 3].map((item) => (
                <div className="task-row skeleton" key={item} />
              ))}
            </div>
          ) : !error && tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✦</div>
              <h3>
                {query || status !== 'all'
                  ? 'Nothing matches those filters.'
                  : 'Your list is a clean slate.'}
              </h3>
              <p>
                {query || status !== 'all'
                  ? 'Try broadening your search or filters.'
                  : 'Add one meaningful next step and start building momentum.'}
              </p>
              <Link href="/tasks/new" className="button button-primary">
                Create your first task
              </Link>
            </div>
          ) : (
            !error && (
              <div className="task-list">
                {tasks.map((task) => (
                  <Link href={`/tasks/${task.id}`} className="task-row" key={task.id}>
                    <span
                      className={`status-dot ${task.status}`}
                      aria-label={statusLabel(task.status)}
                    />
                    <div className="task-copy">
                      <strong>{task.title}</strong>
                      <p>{task.description}</p>
                    </div>
                    <span className={`priority-pill ${task.priority}`}>
                      {priorityLabel(task.priority)}
                    </span>
                    <span className="task-due">
                      {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                    </span>
                    <span className="row-arrow">→</span>
                  </Link>
                ))}
              </div>
            )
          )}
          {!loading && total > 6 && (
            <div className="pagination">
              <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                ← Previous
              </button>
              <span>
                Page {page} of {Math.ceil(total / 6)}
              </span>
              <button disabled={page >= Math.ceil(total / 6)} onClick={() => setPage(page + 1)}>
                Next →
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
