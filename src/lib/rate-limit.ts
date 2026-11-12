const windows = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, durationMs: number) {
  const now = Date.now();
  const current = windows.get(key);
  const window =
    !current || current.resetAt <= now
      ? { count: 0, resetAt: now + durationMs }
      : current;

  window.count += 1;
  windows.set(key, window);

  if (windows.size > 2000) {
    for (const [entryKey, entry] of windows) {
      if (entry.resetAt <= now) windows.delete(entryKey);
    }
  }

  return window.count <= limit;
}

export function clientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
