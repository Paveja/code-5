import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { createSession, verifyPassword } from '@/lib/auth';
import { credentialsSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/api';

export async function POST(request: Request) {
  const parsed = credentialsSchema.safeParse(await request.json());
  if (!parsed.success) return fail('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
  const user = (
    await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, parsed.data.email.toLowerCase()))
      .limit(1)
  )[0];
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash)))
    return fail('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
  await createSession(user.id);
  return ok({ id: user.id, name: user.name, email: user.email });
}
