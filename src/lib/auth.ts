import axios from 'axios';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Super Admin Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!baseURL) throw new Error('NEXT_PUBLIC_BASE_URL is not configured');
        const response = await axios.post(`${baseURL.replace(/\/$/, '')}/auth/login`, {
          email: credentials?.email,
          password: credentials?.password,
        });
        const payload = response.data?.data ?? response.data;
        const user = payload.user;
        const accessToken = payload.accessToken ?? payload.token ?? payload.access_token;
        const refreshToken = payload.refreshToken ?? payload.refresh_token;
        if (!user || !accessToken) throw new Error('Invalid login response');
        if (user.role !== 'super_admin') throw new Error('Only super admins can access this dashboard');
        return {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          accessToken,
          refreshToken,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url === baseUrl || url === `${baseUrl}/`) return `${baseUrl}/dashboard`;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/dashboard`;
    },
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.role = user.role;
        token._id = user._id;
        token.avatarUrl = user.avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.role = token.role;
      session._id = token._id;
      session.user._id = token._id;
      session.user.role = token.role;
      session.user.avatarUrl = token.avatarUrl;
      return session;
    },
  },
};
