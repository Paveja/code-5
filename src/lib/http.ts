export function jsonData<T>(data: T, init?: ResponseInit) {
  return Response.json({ data }, init);
}

export function jsonError(
  code: string,
  message: string,
  status: number,
  fieldErrors?: Record<string, string[]>
) {
  return Response.json(
    { error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } },
    { status }
  );
}

export function getErrorFields(error: unknown) {
  if (typeof error !== 'object' || error === null || !('flatten' in error)) return undefined;
  const flattened = (
    error as { flatten: () => { fieldErrors: Record<string, string[]> } }
  ).flatten();
  return flattened.fieldErrors;
}
