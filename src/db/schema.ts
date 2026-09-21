import { integer, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
};

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  ...timestamps,
});

export const sessions = sqliteTable(
  'sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => ({ userIndex: index('sessions_user_idx').on(table.userId) })
);

export const tasks = sqliteTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    status: text('status', { enum: ['todo', 'in_progress', 'done'] })
      .notNull()
      .default('todo'),
    priority: text('priority', { enum: ['low', 'medium', 'high'] })
      .notNull()
      .default('medium'),
    dueDate: text('due_date'),
    assignee: text('assignee'),
    ...timestamps,
  },
  (table) => ({
    ownerStatusIndex: index('tasks_owner_status_idx').on(table.userId, table.status),
    ownerDueIndex: index('tasks_owner_due_idx').on(table.userId, table.dueDate),
  })
);

export const taskActivity = sqliteTable(
  'task_activity',
  {
    id: text('id').primaryKey(),
    taskId: text('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    action: text('action').notNull(),
    summary: text('summary').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => ({ taskTimeIndex: index('activity_task_time_idx').on(table.taskId, table.createdAt) })
);
