import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get('task_session')?.value);
  const isProtected =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/tasks');
  if (isProtected && !hasSession) return NextResponse.redirect(new URL('/login', request.url));
  if (hasSession && ['/login', '/register'].includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*', '/tasks/:path*', '/login', '/register'] };
