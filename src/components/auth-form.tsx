'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: 'demo@tasks.local',
    password: 'password123',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const response = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(payload.error?.message ?? 'Something went wrong.');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand-mark">
          do<span>.</span>
        </div>
        <p className="eyebrow">A quieter way to get things done</p>
        <h1>{mode === 'login' ? 'Welcome back.' : 'Make space for progress.'}</h1>
        <p className="auth-intro">
          {mode === 'login'
            ? 'Pick up where you left off and keep your day moving.'
            : 'Create a focused workspace for the work that matters.'}
        </p>
        <form onSubmit={submit} className="stack-form">
          {mode === 'register' && (
            <label>
              Name
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
              />
            </label>
          )}
          <label>
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              required
              type="password"
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button button-primary" disabled={loading}>
            {loading ? 'Opening workspace…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <p className="auth-switch">
          {mode === 'login' ? 'New here?' : 'Already have an account?'}{' '}
          <Link href={mode === 'login' ? '/register' : '/login'}>
            {mode === 'login' ? 'Create an account' : 'Sign in'}
          </Link>
        </p>
        <p className="demo-hint">
          Demo access is prefilled. Use <strong>demo@tasks.local</strong> /{' '}
          <strong>password123</strong>.
        </p>
      </section>
      <aside className="auth-aside">
        <span>01 / 03</span>
        <p>Clarity is not about doing more. It is about knowing what matters next.</p>
        <div className="aside-line" />
      </aside>
    </main>
  );
}
