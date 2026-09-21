import { getCurrentUser } from '@/lib/auth';
import { fail, ok } from '@/lib/api';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail('Authentication required.', 401, 'UNAUTHORIZED');
  return ok({ id: user.id, name: user.name, email: user.email });
}
