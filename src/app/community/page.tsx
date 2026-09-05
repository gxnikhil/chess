'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { 
  Users, Search, UserPlus, Swords, CheckCircle2, Globe, Shield, Trophy
} from 'lucide-react';

export default function CommunityPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/community?q=${encodeURIComponent(searchQuery)}`)
        .then((res) => res.json())
        .then((data) => {
          setUsers(data.users || []);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-emerald-400" />
            Chess Community
          </h1>
          <p className="text-zinc-400 mt-2 text-sm sm:text-base">
            Find online opponents, connect with friends, challenge players to live matches, and explore profiles.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-8">
        <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by username or display name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-white text-base focus:outline-none focus:border-emerald-500/50 shadow-inner"
        />
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 text-sm mt-3">Searching players...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="py-16 text-center bg-zinc-900 border border-zinc-800 rounded-2xl">
          <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">No players found matching &quot;{searchQuery}&quot;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {users.map((u) => {
            const isSelf = session?.user?.id === u.id;
            const blitzRating = Math.round(
              u.ratings?.find((r: any) => r.format === 'blitz')?.rating || 1500
            );

            return (
              <div
                key={u.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-zinc-800 flex items-center justify-center font-extrabold text-white shadow text-xl border border-emerald-500/20">
                      {u.displayName?.[0]?.toUpperCase() || u.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                          {u.displayName || u.username}
                        </span>
                        {u.title && (
                          <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 rounded">
                            {u.title}
                          </span>
                        )}
                        {u.isVerified && (
                          <CheckCircle2 className="w-4 h-4 text-blue-400 fill-current" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 font-mono">@{u.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-400 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 mb-4">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-emerald-400" /> Blitz Rating
                    </span>
                    <span className="font-bold text-emerald-400 font-mono">{blitzRating}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Link
                    href={`/user/${u.username}`}
                    className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs text-center border border-zinc-700 transition-colors"
                  >
                    Profile
                  </Link>

                  {!isSelf && session && (
                    <Link
                      href={`/play?challenge=${u.id}`}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-md shadow-emerald-600/20 transition-all"
                      title="Challenge to live match"
                    >
                      <Swords className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
