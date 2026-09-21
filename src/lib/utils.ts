import { randomUUID } from 'node:crypto';

export const newId = () => randomUUID();

export function formatDate(value: string | Date | null) {
  if (!value) return 'No due date';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(value)
  );
}

export function statusLabel(status: string) {
  return { todo: 'To do', in_progress: 'In progress', done: 'Done' }[status] ?? status;
}

export function priorityLabel(priority: string) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}
