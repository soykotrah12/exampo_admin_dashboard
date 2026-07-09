import { NextRequest, NextResponse } from 'next/server';

const sessionCookieNames = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
];

export function proxy(req: NextRequest) {
  const hasSessionToken = sessionCookieNames.some((name) =>
    Boolean(req.cookies.get(name)?.value),
  );
  if (hasSessionToken) return NextResponse.next();

  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set(
    'callbackUrl',
    `${req.nextUrl.pathname}${req.nextUrl.search}`,
  );
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/organizations/:path*',
    '/users/:path*',
    '/teachers/:path*',
    '/students/:path*',
    '/services/:path*',
    '/batches/:path*',
    '/exams/:path*',
    '/submissions/:path*',
    '/plans/:path*',
    '/subscriptions/:path*',
    '/payments/:path*',
    '/verification/:path*',
    '/rankings/:path*',
    '/reports/:path*',
    '/settings/:path*',
  ],
};
