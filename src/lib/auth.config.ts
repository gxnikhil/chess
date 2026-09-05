import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    newUser: '/username',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // This will be implemented in the main auth.ts
        return null;
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtectedRoute = [
        '/dashboard',
        '/settings',
        '/play',
        '/challenge',
        '/admin',
      ].some(path => nextUrl.pathname.startsWith(path));

      if (isProtectedRoute && !isLoggedIn) {
        return Response.redirect(new URL('/login', nextUrl));
      }
      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.isAdmin = (user as any).isAdmin;
      }
      if (trigger === 'update' && session) {
        token.username = session.username;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).username = token.username as string;
        (session.user as any).isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
};
