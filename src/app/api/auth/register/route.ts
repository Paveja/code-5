import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { createSession, hashPassword, newId } from '@/lib/auth';
import { credentialsSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/api';

export async function POST(request: Request) {
  const parsed = credentialsSchema
    .extend({ name: credentialsSchema.shape.email.transform(() => '').optional() })
    .safeParse(await request.json());
  if (!parsed.success)
    return fail(
      'Please check the form fields.',
      422,
      'VALIDATION_ERROR',
      parsed.error.flatten().fieldErrors
    );
  const body = (await request.clone().json()) as { name?: string; email: string; password: string };
  const name = body.name?.trim();
  if (!name)
    return fail('Name is required.', 422, 'VALIDATION_ERROR', { name: ['Name is required.'] });
  const email = parsed.data.email.toLowerCase();
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  if (existing.length)
    return fail('Unable to create account with those details.', 409, 'ACCOUNT_EXISTS');
  const now = new Date();
  const user = {
    id: newId(),
    name,
    email,
    passwordHash: await hashPassword(parsed.data.password),
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(schema.users).values(user);
  await createSession(user.id);
  return ok({ id: user.id, name: user.name, email: user.email }, { status: 201 });
}
