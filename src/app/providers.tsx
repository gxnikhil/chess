'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/lib/theme';
import { ToastProvider } from '@/lib/toast';
import Navbar from '@/components/Navbar';
import { useSession } from 'next-auth/react';

function NavbarWrapper() {
  const { data: session } = useSession();
  const user = session?.user ? {
    id: (session.user as any).id || '',
    username: (session.user as any).username,
    displayName: session.user.name || undefined,
    avatar: session.user.image || undefined,
    isAdmin: (session.user as any).isAdmin,
  } : null;

  return <Navbar user={user} />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ToastProvider>
          <NavbarWrapper />
          <main className="page">
            {children}
          </main>
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
