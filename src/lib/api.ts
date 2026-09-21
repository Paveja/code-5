import { NextResponse } from 'next/server';

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}
export function fail(
  message: string,
  status = 400,
  code = 'BAD_REQUEST',
  fieldErrors?: Record<string, string[]>
) {
  return NextResponse.json({ error: { code, message, fieldErrors } }, { status });
}
export function parseBodyError(error: unknown) {
  return error instanceof Error ? error.message : 'Invalid request.';
}
