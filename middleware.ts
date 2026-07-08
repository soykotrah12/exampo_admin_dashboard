import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    if (role !== 'super_admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
  },
);

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
