'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { 
  Trophy, Zap, Clock, ShieldAlert, Bot, User, UserPlus, 
  Swords, Calendar, Globe, Crown, CheckCircle2, XCircle, MinusCircle, ArrowUpRight
} from 'lucide-react';

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { data: session } = useSession();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted'>('none');

  useEffect(() => {
    fetch(`/api/users/${username}`)
      .then((res) => {
        if (!res.ok) throw new Error('User not found');
        return res.json();
      })
      .then((data) => {
        setProfileData(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center text-center px-4">
        <User className="w-16 h-16 text-zinc-600 mb-4" />
        <h1 className="text-2xl font-extrabold text-white">Player Not Found</h1>
        <p className="text-zinc-400 mt-2 max-w-sm">No chess player exists with username &quot;@{username}&quot;.</p>
        <Link href="/" className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all">
          Back to Home
        </Link>
      </div>
    );
  }

  const { user, ratings, stats, recentGames } = profileData;
  const isOwnProfile = session?.user?.id === user.id;

  const ratingMap: Record<string, number> = {};
  ratings?.forEach((r: any) => {
    ratingMap[r.format] = r.rating;
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Profile Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-4xl font-extrabold text-white shadow-xl border-2 border-emerald-400/30">
                {user.displayName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}
              </div>
              {user.title && (
                <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-xs font-black px-2 py-0.5 rounded shadow">
                  {user.title}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {user.displayName || user.username}
                </h1>
                <span className="text-sm font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 rounded-full">
                  @{user.username}
                </span>
                {user.isVerified && (
                  <CheckCircle2 className="w-5 h-5 text-blue-400 fill-current" />
                )}
              </div>

              {user.bio && (
                <p className="text-sm text-zinc-300 mt-2 max-w-xl">{user.bio}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-zinc-400 mt-3 flex-wrap">
                {user.country && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-zinc-500" />
                    {user.country}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {!isOwnProfile && session && (
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setFriendStatus(friendStatus === 'none' ? 'pending' : 'none')}
                className="flex-1 md:flex-none px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl border border-zinc-700 flex items-center justify-center gap-2 transition-all"
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
                {friendStatus === 'pending' ? 'Request Sent' : 'Add Friend'}
              </button>
              <Link
                href={`/play?challenge=${user.id}`}
                className="flex-1 md:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <Swords className="w-4 h-4" />
                Challenge
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Format Ratings Grid */}
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-emerald-400" />
        Chess Ratings
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Bullet', key: 'bullet', icon: Zap, color: 'text-amber-400' },
          { label: 'Blitz', key: 'blitz', icon: Clock, color: 'text-emerald-400' },
          { label: 'Rapid', key: 'rapid', icon: Trophy, color: 'text-blue-400' },
          { label: 'Classical', key: 'classical', icon: ShieldAlert, color: 'text-purple-400' },
          { label: 'Vs Bots', key: 'bot', icon: Bot, color: 'text-pink-400' },
        ].map((item) => {
          const Icon = item.icon;
          const val = Math.round(ratingMap[item.key] || 1500);
          return (
            <div key={item.key} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">{item.label}</span>
                <Icon className={cn('w-4 h-4', item.color)} />
              </div>
              <div className="text-2xl font-black text-white">{val}</div>
              <div className="text-[11px] text-zinc-500 mt-1">Glicko-2 Rating</div>
            </div>
          );
        })}
      </div>

      {/* Stats and Recent Games */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center justify-between">
              <span>Game History ({recentGames?.length || 0})</span>
            </h3>

            {!recentGames || recentGames.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
                <Trophy className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 font-medium">No recorded public games</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentGames.map((game: any) => {
                  const isWhite = game.whiteId === user.id;
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
                            {game.terminationReason || 'Completed'} • {new Date(game.createdAt).toLocaleDateString()}
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

        {/* Sidebar stats */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-bold text-white mb-4">Overall Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="text-sm text-zinc-400">Total Games</span>
                <span className="font-bold text-white">{stats.totalGames}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="text-sm text-emerald-400 font-medium">Victories</span>
                <span className="font-bold text-emerald-400">{stats.wins}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="text-sm text-red-400 font-medium">Defeats</span>
                <span className="font-bold text-red-400">{stats.losses}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Draws</span>
                <span className="font-bold text-zinc-300">{stats.draws}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
