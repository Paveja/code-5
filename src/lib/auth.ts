import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { and, eq, gt } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { db, schema } from '@/db';

export const SESSION_COOKIE = 'task_session';
const SESSION_DAYS = 14;

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}
export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
export function newId() {
  return crypto.randomUUID();
}
export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 86400000);
  await db
    .insert(schema.sessions)
    .values({ tokenHash: hashToken(token), userId, createdAt: now, expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  });
}

export async function clearSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token)
    await db.delete(schema.sessions).where(eq(schema.sessions.tokenHash, hashToken(token)));
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(
      and(
        eq(schema.sessions.tokenHash, hashToken(token)),
        gt(schema.sessions.expiresAt, new Date())
      )
    )
    .limit(1);
  return rows[0]?.user ?? null;
}
