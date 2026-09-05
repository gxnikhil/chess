import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ChessMaster — Play Chess Online | Free Multiplayer Chess',
  description: 'Play chess online against players worldwide or challenge professional bots. Track your rating, analyze games, and improve your skills on ChessMaster.',
  keywords: 'chess, online chess, play chess, chess game, multiplayer chess, chess rating, chess analysis',
  openGraph: {
    title: 'ChessMaster — Play Chess Online',
    description: 'Play chess online against players worldwide. Free multiplayer chess with ratings, analysis, and professional bots.',
    type: 'website',
    siteName: 'ChessMaster',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className={inter.variable}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
