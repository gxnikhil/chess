'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Trophy, Zap, Clock, ShieldAlert, Bot, Play, Search, 
  BarChart3, User, Settings, ArrowUpRight, CheckCircle2, XCircle, MinusCircle, Crown
} from 'lucide-react';

interface FormatRating {
  rating: number;
  games: number;
}

interface RecentGame {
  id: string;
  format: string;
  timeControl: number;
  increment: number;
  result: string;
  terminationReason: string;
  createdAt: string;
  whiteId: string;
  blackId: string;
  whitePlayer: { id: string; username: string; displayName: string; avatar: string };
  blackPlayer: { id: string; username: string; displayName: string; avatar: string };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [ratings, setRatings] = useState({
    bullet: 1500,
    blitz: 1500,
    rapid: 1500,
    classical: 1500,
    bot: 1500,
  });
  const [stats, setStats] = useState({
    wins: 0,
    losses: 0,
    draws: 0,
    totalGames: 0,
    winRate: 0,
  });
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetch('/api/dashboard')
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUserData(data.user);
            setRatings(data.ratings);
            setStats(data.stats);
            setRecentGames(data.recentGames || []);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 font-medium animate-pulse">Loading Grandmaster Dashboard...</p>
        </div>
      </div>
    );
  }

  const user = userData || session?.user;
  const currentUserId = session?.user?.id;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Crown className="w-80 h-80 text-emerald-500" />
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-3xl font-extrabold text-white shadow-lg border-2 border-emerald-400/30">
                {user?.displayName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'P'}
              </div>
              {user?.title && (
                <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-xs font-black px-2 py-0.5 rounded shadow">
                  {user.title}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {user?.displayName || user?.username || 'Chess Master'}
                </h1>
                <span className="text-sm font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  @{user?.username || 'player'}
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-1 flex items-center gap-2">
                <span>Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2026'}</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">Online</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Link
              href="/play"
              className="flex-1 md:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <Play className="w-5 h-5 fill-current" />
              Play Online
            </Link>
            <Link
              href="/play/bot"
              className="flex-1 md:flex-none px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl border border-zinc-700 flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <Bot className="w-5 h-5 text-emerald-400" />
              Practice Bots
            </Link>
          </div>
        </div>
      </div>

      {/* Ratings Cards Grid */}
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-emerald-400" />
        Format Ratings
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Bullet', rating: ratings.bullet, icon: Zap, color: 'from-amber-500/20 to-amber-600/5 text-amber-400' },
          { label: 'Blitz', rating: ratings.blitz, icon: Clock, color: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400' },
          { label: 'Rapid', rating: ratings.rapid, icon: Trophy, color: 'from-blue-500/20 to-blue-600/5 text-blue-400' },
          { label: 'Classical', rating: ratings.classical, icon: ShieldAlert, color: 'from-purple-500/20 to-purple-600/5 text-purple-400' },
          { label: 'Vs Bots', rating: ratings.bot, icon: Bot, color: 'from-pink-500/20 to-pink-600/5 text-pink-400' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={cn(
                'bg-gradient-to-br bg-zinc-900 border border-zinc-800 rounded-xl p-4 transition-all hover:border-zinc-700 hover:scale-[1.02]',
                item.color
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">{item.label}</span>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-white">{Math.round(item.rating)}</div>
              <div className="text-[11px] text-zinc-500 mt-1">Glicko-2 Rated</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Stats & Recent Games */}
        <div className="lg:col-span-2 space-y-8">
          {/* Performance Overview */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                Performance Breakdown
              </span>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                {stats.winRate}% Win Rate
              </span>
            </h3>

            <div className="grid grid-cols-4 gap-4 text-center mb-6">
              <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-800">
                <p className="text-xs text-zinc-400 font-semibold mb-1">Played</p>
                <p className="text-2xl font-black text-white">{stats.totalGames}</p>
              </div>
              <div className="bg-emerald-950/30 p-4 rounded-xl border border-emerald-900/30">
                <p className="text-xs text-emerald-400 font-semibold mb-1">Won</p>
                <p className="text-2xl font-black text-emerald-400">{stats.wins}</p>
              </div>
              <div className="bg-red-950/30 p-4 rounded-xl border border-red-900/30">
                <p className="text-xs text-red-400 font-semibold mb-1">Lost</p>
                <p className="text-2xl font-black text-red-400">{stats.losses}</p>
              </div>
              <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-800">
                <p className="text-xs text-zinc-400 font-semibold mb-1">Drawn</p>
                <p className="text-2xl font-black text-zinc-300">{stats.draws}</p>
              </div>
            </div>

            {/* Ratio Progress Bar */}
            {stats.totalGames > 0 && (
              <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${(stats.wins / stats.totalGames) * 100}%` }}
                />
                <div 
                  className="bg-zinc-500 h-full transition-all duration-500" 
                  style={{ width: `${(stats.draws / stats.totalGames) * 100}%` }}
                />
                <div 
                  className="bg-red-500 h-full transition-all duration-500" 
                  style={{ width: `${(stats.losses / stats.totalGames) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Recent Games */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                Recent Games
              </h3>
              <Link href="/analysis" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1">
                Analysis Board <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentGames.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
                <Trophy className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 font-medium">No games played yet</p>
                <p className="text-xs text-zinc-500 mt-1">Jump into a game to start tracking your performance!</p>
                <Link
                  href="/play"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-500 transition-colors"
                >
                  Find a Game Now
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentGames.map((game) => {
                  const isWhite = game.whiteId === currentUserId;
                  const opponent = isWhite ? game.blackPlayer : game.whitePlayer;

                  let outcome: 'win' | 'loss' | 'draw' = 'draw';
                  if (game.result === 'draw') outcome = 'draw';
                  else if ((game.result === 'white' && isWhite) || (game.result === 'black' && !isWhite)) outcome = 'win';
                  else outcome = 'loss';

                  return (
                    <div
                      key={game.id}
                      className="flex items-center justify-between p-4 bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-800/80 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {/* Result Badge */}
                        <div
                          className={cn(
                            'w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs',
                            outcome === 'win' && 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
                            outcome === 'loss' && 'bg-red-500/10 text-red-400 border border-red-500/30',
                            outcome === 'draw' && 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/30'
                          )}
                        >
                          {outcome === 'win' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                          {outcome === 'loss' && <XCircle className="w-5 h-5 text-red-400" />}
                          {outcome === 'draw' && <MinusCircle className="w-5 h-5 text-zinc-400" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">vs {opponent?.displayName || opponent?.username || 'Opponent'}</span>
                            <span className="text-xs uppercase px-2 py-0.5 bg-zinc-700/50 text-zinc-300 rounded font-semibold">
                              {game.format}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {game.terminationReason || 'Game finished'} • {new Date(game.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/game/${game.id}`}
                        className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-xs font-bold border border-zinc-700 transition-colors"
                      >
                        Review
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Quick Actions & Navigation */}
        <div className="space-y-6">
          {/* Quick Play Menu */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-bold text-white mb-4">Quick Play</h3>
            <div className="space-y-3">
              <Link
                href="/play?format=blitz"
                className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-950/40 to-zinc-900 border border-emerald-800/40 hover:border-emerald-500/50 rounded-xl group transition-all"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-bold text-white text-sm">3|2 Blitz</p>
                    <p className="text-xs text-zinc-400">Fast & Competitive</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>

              <Link
                href="/play?format=rapid"
                className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-950/40 to-zinc-900 border border-blue-800/40 hover:border-blue-500/50 rounded-xl group transition-all"
              >
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-bold text-white text-sm">10|0 Rapid</p>
                    <p className="text-xs text-zinc-400">Standard Match</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>

              <Link
                href="/play/bot"
                className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-950/40 to-zinc-900 border border-pink-800/40 hover:border-pink-500/50 rounded-xl group transition-all"
              >
                <div className="flex items-center gap-3">
                  <Bot className="w-5 h-5 text-pink-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-bold text-white text-sm">Bot Training</p>
                    <p className="text-xs text-zinc-400">Stockfish AI Engine</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-pink-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Navigation Shortcuts */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md space-y-3">
            <h3 className="text-lg font-bold text-white mb-2">Shortcuts</h3>
            <Link
              href="/leaderboard"
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/40 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-sm font-semibold"
            >
              <span className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                Global Leaderboards
              </span>
              <ArrowUpRight className="w-4 h-4 text-zinc-500" />
            </Link>
            <Link
              href="/community"
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/40 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-sm font-semibold"
            >
              <span className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                Community & Friends
              </span>
              <ArrowUpRight className="w-4 h-4 text-zinc-500" />
            </Link>
            <Link
              href="/settings"
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/40 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-sm font-semibold"
            >
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-zinc-400" />
                Account Settings
              </span>
              <ArrowUpRight className="w-4 h-4 text-zinc-500" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
