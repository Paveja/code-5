import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, schema } from "@/db";
import { SESSION_COOKIE, SESSION_DURATION_DAYS } from "@/lib/constants";

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_DAYS * 86_400_000);

  db.insert(schema.sessions)
    .values({
      id: tokenHash(token),
      userId,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
    })
    .run();

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    db.delete(schema.sessions)
      .where(eq(schema.sessions.id, tokenHash(token)))
      .run();
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function currentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [user] = db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      role: schema.users.role,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(
      and(
        eq(schema.sessions.id, tokenHash(token)),
        gt(schema.sessions.expiresAt, new Date().toISOString()),
      ),
    )
    .limit(1)
    .all();

  return user ?? null;
}

export async function requireOperator() {
  const user = await currentUser();
  return user?.role === "operator" ? user : null;
}

export function newId() {
  return randomUUID();
}
