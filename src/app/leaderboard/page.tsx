'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  Crown, Zap, Clock, Trophy, ShieldAlert, Bot, Medal, Globe, CheckCircle2, Search
} from 'lucide-react';

export default function LeaderboardPage() {
  const [activeFormat, setActiveFormat] = useState<'blitz' | 'bullet' | 'rapid' | 'classical' | 'bot'>('blitz');
  const [loading, setLoading] = useState<boolean>(true);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?format=${activeFormat}`)
      .then((res) => res.json())
      .then((data) => {
        setLeaderboardData(data.leaderboard || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [activeFormat]);

  const filteredData = leaderboardData.filter((item) => {
    const username = item.user?.username || '';
    const displayName = item.user?.displayName || '';
    const query = searchQuery.toLowerCase();
    return username.toLowerCase().includes(query) || displayName.toLowerCase().includes(query);
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
          <Crown className="w-72 h-72 text-amber-400" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
            <Crown className="w-8 h-8 text-amber-400 fill-amber-400/20" />
            Global Leaderboards
          </h1>
          <p className="text-zinc-400 mt-2 text-sm sm:text-base">
            Discover top-ranked grandmasters and top chess players across Bullet, Blitz, Rapid, Classical, and Bot arenas.
          </p>
        </div>
      </div>

      {/* Format Selector Tabs */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex bg-zinc-900 p-1.5 rounded-xl border border-zinc-800 space-x-1 overflow-x-auto max-w-full">
          {[
            { id: 'blitz', label: 'Blitz', icon: Clock },
            { id: 'bullet', label: 'Bullet', icon: Zap },
            { id: 'rapid', label: 'Rapid', icon: Trophy },
            { id: 'classical', label: 'Classical', icon: ShieldAlert },
            { id: 'bot', label: 'Vs Bots', icon: Bot },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeFormat === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFormat(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap',
                  active
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search player..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-zinc-500 text-sm mt-3">Fetching standings...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-16 text-center">
            <Trophy className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-medium">No players found in this format leaderboard</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 text-xs uppercase tracking-wider font-bold">
                  <th className="py-4 px-6">Rank</th>
                  <th className="py-4 px-6">Player</th>
                  <th className="py-4 px-6 text-right">Rating</th>
                  <th className="py-4 px-6 text-right">Win Rate</th>
                  <th className="py-4 px-6 text-right">Games</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-sm">
                {filteredData.map((row, index) => {
                  const rank = index + 1;
                  const totalGames = row.wins + row.losses + row.draws;
                  const winRate = totalGames > 0 ? Math.round((row.wins / totalGames) * 100) : 0;

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-zinc-800/40 transition-colors group"
                    >
                      {/* Rank */}
                      <td className="py-4 px-6 font-black">
                        {rank === 1 && (
                          <span className="flex items-center gap-1.5 text-amber-400">
                            <Crown className="w-5 h-5 fill-amber-400" /> #1
                          </span>
                        )}
                        {rank === 2 && (
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <Medal className="w-5 h-5 fill-slate-300" /> #2
                          </span>
                        )}
                        {rank === 3 && (
                          <span className="flex items-center gap-1.5 text-amber-700">
                            <Medal className="w-5 h-5 fill-amber-700" /> #3
                          </span>
                        )}
                        {rank > 3 && <span className="text-zinc-500">#{rank}</span>}
                      </td>

                      {/* Player Profile */}
                      <td className="py-4 px-6">
                        <Link
                          href={`/user/${row.user?.username}`}
                          className="flex items-center gap-3 group-hover:text-emerald-400 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-zinc-800 flex items-center justify-center font-bold text-white shadow">
                            {row.user?.displayName?.[0]?.toUpperCase() || row.user?.username?.[0]?.toUpperCase() || 'P'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-white group-hover:text-emerald-400">
                                {row.user?.displayName || row.user?.username}
                              </span>
                              {row.user?.title && (
                                <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.2 rounded">
                                  {row.user.title}
                                </span>
                              )}
                              {row.user?.isVerified && (
                                <CheckCircle2 className="w-4 h-4 text-blue-400 fill-current" />
                              )}
                            </div>
                            <span className="text-xs text-zinc-500 font-mono">@{row.user?.username}</span>
                          </div>
                        </Link>
                      </td>

                      {/* Rating */}
                      <td className="py-4 px-6 text-right font-black text-lg text-emerald-400">
                        {Math.round(row.rating)}
                      </td>

                      {/* Win Rate */}
                      <td className="py-4 px-6 text-right font-semibold text-zinc-300">
                        {winRate}%
                      </td>

                      {/* Games Played */}
                      <td className="py-4 px-6 text-right text-zinc-400 font-mono">
                        {totalGames}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
