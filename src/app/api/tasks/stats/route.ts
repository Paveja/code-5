import { eq, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import { getCurrentUser } from '@/lib/auth';
import { fail, ok } from '@/lib/api';
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail('Authentication required.', 401, 'UNAUTHORIZED');
  const rows = await db
    .select({ status: schema.tasks.status, count: sql<number>`count(*)` })
    .from(schema.tasks)
    .where(eq(schema.tasks.userId, user.id))
    .groupBy(schema.tasks.status);
  return ok(Object.fromEntries(rows.map((row) => [row.status, row.count])));
}
