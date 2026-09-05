'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, Users, Swords, AlertTriangle, Crown, CheckCircle2, XCircle, Search, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetch('/api/admin')
        .then((res) => {
          if (!res.ok) throw new Error('Forbidden or Unauthorized');
          return res.json();
        })
        .then((data) => setAdminData(data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !adminData) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center text-center px-4">
        <Lock className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-extrabold text-white">Access Restricted</h1>
        <p className="text-zinc-400 mt-2 max-w-sm">Administrator privileges are required to access this console.</p>
      </div>
    );
  }

  const { stats, recentUsers, reports } = adminData;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="w-8 h-8 text-amber-500" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Admin Operations Center</h1>
          <p className="text-sm text-zinc-400">Platform overview, user moderation, and report management.</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
          <p className="text-xs text-zinc-400 font-semibold mb-1">Total Platform Users</p>
          <p className="text-3xl font-black text-white">{stats.totalUsers}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
          <p className="text-xs text-emerald-400 font-semibold mb-1">Active Live Games</p>
          <p className="text-3xl font-black text-emerald-400">{stats.activeGames}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
          <p className="text-xs text-blue-400 font-semibold mb-1">Total Played Games</p>
          <p className="text-3xl font-black text-blue-400">{stats.totalGames}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
          <p className="text-xs text-amber-400 font-semibold mb-1">Pending Reports</p>
          <p className="text-3xl font-black text-amber-400">{stats.pendingReports}</p>
        </div>
      </div>

      {/* Users Moderation */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" />
          Recent User Registrations
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase font-bold">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-sm">
              {recentUsers.map((u: any) => (
                <tr key={u.id} className="hover:bg-zinc-800/40">
                  <td className="py-3.5 px-4 font-bold text-white">
                    @{u.username || 'unnamed'}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400">{u.email || 'N/A'}</td>
                  <td className="py-3.5 px-4">
                    {u.title ? (
                      <span className="bg-amber-500 text-black text-xs font-black px-1.5 py-0.5 rounded">
                        {u.title}
                      </span>
                    ) : (
                      <span className="text-zinc-600 text-xs">Standard</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {u.isBanned ? (
                      <span className="text-xs bg-red-500/10 text-red-400 font-bold px-2 py-0.5 rounded border border-red-500/20">
                        Banned
                      </span>
                    ) : (
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right text-xs text-zinc-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
