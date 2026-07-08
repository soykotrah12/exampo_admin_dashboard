import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    role?: string;
    _id?: string;
    user: DefaultSession['user'] & {
      _id?: string;
      role?: string;
      avatarUrl?: string;
    };
  }

  interface User {
    accessToken?: string;
    refreshToken?: string;
    role?: string;
    _id?: string;
    avatarUrl?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    role?: string;
    _id?: string;
    avatarUrl?: string;
  }
}
