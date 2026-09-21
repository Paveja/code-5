# do. — Task Management Dashboard

A focused, full-stack task workspace for managing personal work with clear progress signals and durable history.

## Architecture

The application is a Next.js 16 App Router service. Server-rendered routes provide the authenticated shell and task detail pages. Interactive dashboard and forms are client components that call REST route handlers under `src/app/api`.

The API validates all request bodies and query parameters with Zod, derives ownership from the HTTP-only session cookie, and uses Drizzle ORM for parameterized SQLite access. Passwords are hashed with bcryptjs. Task mutations insert a corresponding activity record in the same database transaction.

## Setup

```bash
npm ci
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:4173`. The preview contract in `.revolte/preview.json` uses the same port and binds to `0.0.0.0`.

Demo credentials: `demo@tasks.local` / `password123`.

## Environment variables

| Variable       | Purpose                    | Example              |
| -------------- | -------------------------- | -------------------- |
| `DATABASE_URL` | SQLite/libSQL database URL | `file:./dev.db`      |
| `AUTH_SECRET`  | Reserved deployment secret | random 32-byte value |

`.env` and local SQLite files are ignored by git.

## API documentation

All successful responses use `{ "data": ... }`. Errors use `{ "error": { "code": string, "message": string, "fieldErrors"?: object } }`.

| Method   | Endpoint                  | Description                                                                                  |
| -------- | ------------------------- | -------------------------------------------------------------------------------------------- |
| `POST`   | `/api/auth/register`      | Create an account and start a session                                                        |
| `POST`   | `/api/auth/login`         | Sign in with email/password                                                                  |
| `POST`   | `/api/auth/logout`        | Clear the current session                                                                    |
| `GET`    | `/api/auth/me`            | Return the current user                                                                      |
| `GET`    | `/api/tasks`              | List tasks; supports `search`, `status`, `priority`, `sort`, `direction`, `page`, `pageSize` |
| `POST`   | `/api/tasks`              | Create a task                                                                                |
| `GET`    | `/api/tasks/:id`          | Read an owned task                                                                           |
| `PATCH`  | `/api/tasks/:id`          | Update an owned task                                                                         |
| `DELETE` | `/api/tasks/:id`          | Delete an owned task and its history                                                         |
| `GET`    | `/api/tasks/:id/activity` | Read task history                                                                            |

Task status values are `todo`, `in_progress`, and `done`. Priority values are `low`, `medium`, and `high`. Protected routes return `401` without a valid session and `404` for tasks outside the signed-in account.

## Database schema

- `users`: account identity and bcrypt password hash.
- `sessions`: hashed session tokens, ownership, and expiry.
- `tasks`: task content, status, priority, due date, optional assignee, timestamps, and owner.
- `task_activity`: task history events with actor, action, summary, and timestamp.

Foreign keys cascade sessions/tasks from users and activity from tasks. Indexes support owner/status, owner/priority, owner/due date, and task activity chronology.

## Testing and checks

```bash
npm run format:check
npm run lint
npm run type-check
npm test
npm run build
npm audit
```

Run `npm run db:seed` again safely; it only inserts sample tasks when the demo account has no tasks.

## Project routes

- `/login` and `/register` — account access
- `/dashboard` — metrics, search, filters, sorting, and pagination
- `/tasks/new` — task creation
- `/tasks/:id` — task details and history
- `/tasks/:id/edit` — task editing
