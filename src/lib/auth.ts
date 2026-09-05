import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import prisma from './db';

export const { handlers, signIn, signOut, auth } = NextAuth({
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
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.passwordHash) return null;
          if (user.isBanned) return null;

          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.displayName || user.username,
            image: user.avatar,
            username: user.username,
            isAdmin: user.isAdmin,
          } as any;
        } catch {
          return null;
        }
      },
    }),
    Credentials({
      id: 'phone-otp',
      name: 'Phone OTP',
      credentials: {
        phone: { label: 'Phone', type: 'tel' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) return null;

        const phone = credentials.phone as string;
        const otp = credentials.otp as string;

        // Mock OTP verification — in production, verify against Twilio/etc.
        if (otp !== '123456') return null;

        try {
          let user = await prisma.user.findUnique({
            where: { phone },
          });

          if (!user) {
            // Create new user for phone registration
            user = await prisma.user.create({
              data: {
                phone,
              },
            });
            // Initialize ratings for new user
            await initializeRatings(user.id);
          }

          if (user.isBanned) return null;

          return {
            id: user.id,
            name: user.displayName || user.username || 'Player',
            image: user.avatar,
            username: user.username,
            isAdmin: user.isAdmin,
          } as any;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (!existingUser) {
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                displayName: user.name,
                avatar: user.image,
                emailVerified: new Date(),
              },
            });
            await initializeRatings(newUser.id);
            (user as any).id = newUser.id;
            (user as any).username = null;
            (user as any).isAdmin = false;
          } else {
            (user as any).id = existingUser.id;
            (user as any).username = existingUser.username;
            (user as any).isAdmin = existingUser.isAdmin;
          }

          // Save OAuth account link
          const existingAccount = await prisma.account.findFirst({
            where: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          });

          if (!existingAccount) {
            await prisma.account.create({
              data: {
                userId: (user as any).id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            });
          }
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = (user as any).id;
        token.username = (user as any).username;
        token.isAdmin = (user as any).isAdmin;
      }
      if (trigger === 'update' && session) {
        token.username = session.username;
        if (session.name) token.name = session.name;
        if (session.image) token.picture = session.image;
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
  secret: process.env.NEXTAUTH_SECRET,
});

async function initializeRatings(userId: string) {
  const formats = ['bullet', 'blitz', 'rapid', 'classical', 'chess960', 'bot'];
  await prisma.rating.createMany({
    data: formats.map(format => ({
      userId,
      format,
      rating: 1500,
      rd: 350,
      vol: 0.06,
      peakRating: 1500,
    })),
  });
}

export { initializeRatings };
