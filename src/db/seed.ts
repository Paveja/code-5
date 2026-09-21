import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { hashPassword, newId } from '@/lib/auth';

async function main() {
  const email = 'demo@tasks.local';
  const existing = (
    await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1)
  )[0];
  const user = existing ?? {
    id: newId(),
    name: 'Maya Chen',
    email,
    passwordHash: await hashPassword('password123'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  if (!existing) await db.insert(schema.users).values(user);
  const currentTasks = await db.select().from(schema.tasks).where(eq(schema.tasks.userId, user.id));
  if (currentTasks.length === 0) {
    const now = new Date();
    const samples = [
      [
        'Shape the Q4 product brief',
        'Turn customer notes into a crisp one-page direction for the team.',
        'in_progress',
        'high',
        '2026-10-04',
        'Maya',
      ],
      [
        'Book annual health check',
        'Find a morning appointment before the end of the month.',
        'todo',
        'medium',
        '2026-10-12',
        null,
      ],
      [
        'Review onboarding flow',
        'Walk through the first-run experience and note the moments that feel unclear.',
        'todo',
        'medium',
        '2026-10-08',
        'Maya',
      ],
      [
        'Send project recap',
        'Share the decisions and next steps from Thursday’s workshop.',
        'done',
        'low',
        null,
        null,
      ],
      [
        'Refresh portfolio notes',
        'Capture the outcomes and lessons from the last two launches.',
        'todo',
        'low',
        '2026-10-18',
        null,
      ],
    ] as const;
    for (const [title, description, status, priority, dueDate, assignee] of samples) {
      const id = newId();
      await db.insert(schema.tasks).values({
        id,
        userId: user.id,
        title,
        description,
        status,
        priority,
        dueDate,
        assignee,
        createdAt: now,
        updatedAt: now,
      });
      await db.insert(schema.taskActivity).values({
        id: newId(),
        taskId: id,
        userId: user.id,
        action: 'created',
        summary: 'Created this task',
        createdAt: now,
      });
    }
  }
  console.log(`Seeded ${email} / password123`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
