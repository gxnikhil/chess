'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Settings, User, Palette, Volume2, ShieldCheck, Check, Save, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [boardTheme, setBoardTheme] = useState('wood');
  const [pieceTheme, setPieceTheme] = useState('standard');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user) {
      setDisplayName(session.user.name || '');
    }
  }, [status, session, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, bio, country }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-8 h-8 text-emerald-400" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Account Settings</h1>
          <p className="text-sm text-zinc-400">Manage your profile, board aesthetics, and game preferences.</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Profile Info */}
        <form onSubmit={handleSave} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-4">
            <User className="w-5 h-5 text-emerald-400" />
            Public Profile Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Country / Location</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. United States, Norway, India"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell other chess players about your favorite openings, goals, or style..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedSuccess ? (
              <span className="text-sm text-emerald-400 font-bold flex items-center gap-1.5 animate-bounce">
                <Check className="w-4 h-4" /> Settings updated successfully!
              </span>
            ) : (
              <span />
            )}

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>

        {/* Board Customization */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-4">
            <Palette className="w-5 h-5 text-emerald-400" />
            Board & Piece Customization
          </h2>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Board Theme</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'wood', label: 'Classic Wood', color: 'from-amber-800 to-amber-950' },
                { id: 'slate', label: 'Dark Slate', color: 'from-zinc-700 to-zinc-900' },
                { id: 'emerald', label: 'Emerald Mint', color: 'from-emerald-700 to-emerald-950' },
                { id: 'glass', label: 'Neon Cyber', color: 'from-indigo-800 to-purple-950' },
              ].map((theme) => (
                <div
                  key={theme.id}
                  onClick={() => setBoardTheme(theme.id)}
                  className={cn(
                    'p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2',
                    boardTheme === theme.id ? 'border-emerald-500 bg-zinc-800 shadow-lg' : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'
                  )}
                >
                  <div className={cn('w-12 h-12 rounded-lg bg-gradient-to-br border border-white/10 shadow-inner', theme.color)} />
                  <span className="text-xs font-bold text-white">{theme.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audio Preferences */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-4">
            <Volume2 className="w-5 h-5 text-emerald-400" />
            Sound & Audio
          </h2>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-bold text-white text-sm">Move Sound Effects</p>
              <p className="text-xs text-zinc-400">Play audio cues on move, capture, check, and game over.</p>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={cn(
                'w-12 h-6 rounded-full transition-colors relative',
                soundEnabled ? 'bg-emerald-600' : 'bg-zinc-700'
              )}
            >
              <div
                className={cn(
                  'w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow',
                  soundEnabled && 'translate-x-6'
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
