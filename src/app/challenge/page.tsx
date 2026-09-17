'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/lib/socket/client';
import { TIME_CONTROLS, FORMAT_ICONS, cn, formatDateRelative } from '@/lib/utils';
import { useToast } from '@/lib/toast';
import Link from 'next/link';

interface SearchResult {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  title: string | null;
  country: string | null;
  topRating: number;
  topFormat: string;
  isOnline: boolean;
}

interface ChallengeData {
  id: string;
  fromId: string;
  toId: string;
  timeControl: number;
  increment: number;
  rated: boolean;
  color: string;
  status: string;
  gameId: string | null;
  createdAt: string;
  expiresAt: string;
  from?: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    title: string | null;
  };
  to?: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    title: string | null;
  };
}

export default function ChallengePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { addToast } = useToast();
  const { socket, connected } = useSocket();
  const userId = (session?.user as any)?.id;

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Challenge config
  const [selectedFormat, setSelectedFormat] = useState('rapid');
  const [selectedTC, setSelectedTC] = useState<(typeof TIME_CONTROLS)[number]>(TIME_CONTROLS[6]); // 10+0
  const [rated, setRated] = useState(true);
  const [colorPref, setColorPref] = useState<'random' | 'white' | 'black'>('random');
  const [sending, setSending] = useState(false);

  // Pending challenges
  const [sentChallenges, setSentChallenges] = useState<ChallengeData[]>([]);
  const [receivedChallenges, setReceivedChallenges] = useState<ChallengeData[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const formats = [
    { key: 'bullet', label: 'Bullet', icon: '⚡' },
    { key: 'blitz', label: 'Blitz', icon: '🔥' },
    { key: 'rapid', label: 'Rapid', icon: '⏱️' },
    { key: 'classical', label: 'Classical', icon: '🏛️' },
  ];

  const filteredTCs = TIME_CONTROLS.filter(tc => tc.format === selectedFormat);

  // Register socket on connect
  useEffect(() => {
    if (connected && userId) {
      socket.emit('register', userId);
    }
  }, [connected, userId, socket]);

  // Listen for real-time challenge events
  useEffect(() => {
    if (!connected) return;

    function onChallengeReceived(challenge: ChallengeData) {
      setReceivedChallenges(prev => {
        if (prev.some(c => c.id === challenge.id)) return prev;
        return [challenge, ...prev];
      });
      addToast({ type: 'info', message: `${challenge.from?.displayName || challenge.from?.username || 'Someone'} challenged you!` });
    }

    function onChallengeDeclined(data: { challengeId: string }) {
      setSentChallenges(prev => prev.filter(c => c.id !== data.challengeId));
      addToast({ type: 'warning', message: 'Your challenge was declined' });
    }

    function onChallengeCancelled(data: { challengeId: string }) {
      setReceivedChallenges(prev => prev.filter(c => c.id !== data.challengeId));
    }

    function onChallengeGameStart(data: { gameId: string }) {
      addToast({ type: 'success', message: 'Game starting!' });
      setTimeout(() => router.push(`/game/${data.gameId}`), 500);
    }

    socket.on('challenge-received', onChallengeReceived);
    socket.on('challenge-declined', onChallengeDeclined);
    socket.on('challenge-cancelled', onChallengeCancelled);
    socket.on('challenge-game-start', onChallengeGameStart);

    return () => {
      socket.off('challenge-received', onChallengeReceived);
      socket.off('challenge-declined', onChallengeDeclined);
      socket.off('challenge-cancelled', onChallengeCancelled);
      socket.off('challenge-game-start', onChallengeGameStart);
    };
  }, [connected, socket, router, addToast]);

  // Fetch pending challenges
  const fetchChallenges = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch('/api/challenge');
      if (res.ok) {
        const data = await res.json();
        setSentChallenges(data.sent);
        setReceivedChallenges(data.received);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingChallenges(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Close search results on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          // Filter out self
          const filtered = data.users.filter((u: SearchResult) => u.id !== userId);
          setSearchResults(filtered);
          setShowResults(true);
        }
      } catch {
        // silently fail
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, userId]);

  function selectUser(user: SearchResult) {
    setSelectedUser(user);
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
  }

  async function sendChallenge() {
    if (!selectedUser || !userId) return;

    setSending(true);
    try {
      const res = await fetch('/api/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUsername: selectedUser.username,
          timeControl: selectedTC.baseTime,
          increment: selectedTC.increment,
          rated,
          color: colorPref,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        addToast({ type: 'success', message: `Challenge sent to ${selectedUser.displayName || selectedUser.username}!` });
        setSentChallenges(prev => [data.challenge, ...prev]);
        setSelectedUser(null);

        // Notify target via socket
        socket.emit('send-challenge', {
          toUserId: selectedUser.id,
          challenge: data.challenge,
        });
      } else {
        addToast({ type: 'error', message: data.error || 'Failed to send challenge' });
      }
    } catch {
      addToast({ type: 'error', message: 'Failed to send challenge' });
    } finally {
      setSending(false);
    }
  }

  async function handleChallengeAction(challenge: ChallengeData, action: 'accept' | 'decline' | 'cancel') {
    setActioningId(challenge.id);
    try {
      const res = await fetch(`/api/challenge/${challenge.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (res.ok) {
        if (action === 'accept') {
          addToast({ type: 'success', message: 'Challenge accepted! Starting game...' });

          // Create the game via socket
          socket.emit('accept-challenge', {
            challengeId: challenge.id,
            gameId: data.gameId,
            fromUserId: challenge.fromId,
            toUserId: challenge.toId,
            timeControl: challenge.timeControl,
            increment: challenge.increment,
            rated: challenge.rated,
            color: challenge.color,
          });

          setTimeout(() => router.push(`/game/${data.gameId}`), 800);
        } else if (action === 'decline') {
          setReceivedChallenges(prev => prev.filter(c => c.id !== challenge.id));
          addToast({ type: 'info', message: 'Challenge declined' });

          socket.emit('decline-challenge', {
            fromUserId: challenge.fromId,
            challengeId: challenge.id,
          });
        } else if (action === 'cancel') {
          setSentChallenges(prev => prev.filter(c => c.id !== challenge.id));
          addToast({ type: 'info', message: 'Challenge cancelled' });

          socket.emit('cancel-challenge', {
            toUserId: challenge.toId,
            challengeId: challenge.id,
          });
        }
      } else {
        addToast({ type: 'error', message: data.error || 'Action failed' });
      }
    } catch {
      addToast({ type: 'error', message: 'Action failed' });
    } finally {
      setActioningId(null);
    }
  }

  function getTimeLabel(tc: number, inc: number) {
    return `${Math.floor(tc / 60)}+${inc}`;
  }

  if (!session) {
    return (
      <div className="challenge-page">
        <div className="container-narrow">
          <div className="challenge-auth-prompt card">
            <div className="empty-state">
              <div className="empty-state-icon">⚔️</div>
              <h2 className="empty-state-title">Challenge a Friend</h2>
              <p className="empty-state-text">Sign in to challenge players to a game</p>
              <Link href="/login" className="btn btn-primary btn-lg" style={{ marginTop: 'var(--sp-4)' }}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="challenge-page">
      <div className="container-narrow">
        <div className="challenge-header">
          <h1 className="challenge-title">⚔️ Challenge a Friend</h1>
          <p className="challenge-subtitle">Search for a player and send them a game challenge</p>
        </div>

        <div className="challenge-layout">
          {/* Left Column: Create Challenge */}
          <div className="challenge-create">
            {/* Player Search */}
            <div className="challenge-section">
              <h3 className="challenge-section-title">Opponent</h3>

              {selectedUser ? (
                <div className="challenge-selected-user card-compact card">
                  <div className="challenge-user-info">
                    <div className="avatar avatar-md">
                      {selectedUser.avatar ? (
                        <img src={selectedUser.avatar} alt={selectedUser.username} />
                      ) : (
                        selectedUser.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="challenge-user-details">
                      <div className="challenge-user-name">
                        {selectedUser.title && (
                          <span className="badge badge-title">{selectedUser.title}</span>
                        )}
                        {selectedUser.displayName || selectedUser.username}
                      </div>
                      <div className="challenge-user-meta">
                        <span className="challenge-user-rating">
                          {FORMAT_ICONS[selectedUser.topFormat] || '⏱️'} {selectedUser.topRating}
                        </span>
                        {selectedUser.isOnline && (
                          <span className="challenge-user-online">
                            <span className="status-dot status-online" /> Online
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSelectedUser(null)}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="challenge-search" ref={searchRef}>
                  <div className="challenge-search-input-wrap">
                    <span className="challenge-search-icon">🔍</span>
                    <input
                      type="text"
                      className="input challenge-search-input"
                      placeholder="Search by username..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onFocus={() => searchResults.length > 0 && setShowResults(true)}
                    />
                    {searching && <span className="challenge-search-spinner" />}
                  </div>

                  {showResults && (
                    <div className="challenge-search-results">
                      {searchResults.length > 0 ? (
                        searchResults.map(user => (
                          <button
                            key={user.id}
                            className="challenge-search-result"
                            onClick={() => selectUser(user)}
                          >
                            <div className="avatar avatar-sm">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.username} />
                              ) : (
                                user.username.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="challenge-result-info">
                              <div className="challenge-result-name">
                                {user.title && (
                                  <span className="badge badge-title" style={{ fontSize: '9px', padding: '1px 4px', marginRight: '4px' }}>
                                    {user.title}
                                  </span>
                                )}
                                {user.displayName || user.username}
                              </div>
                              <div className="challenge-result-sub">
                                @{user.username} · {user.topRating}
                              </div>
                            </div>
                            {user.isOnline && (
                              <span className="status-dot status-online" />
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="challenge-search-empty">
                          No players found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Format Selection */}
            <div className="challenge-section">
              <h3 className="challenge-section-title">Time Control</h3>
              <div className="challenge-formats">
                {formats.map(f => (
                  <button
                    key={f.key}
                    className={cn('challenge-format-btn', selectedFormat === f.key && 'challenge-format-active')}
                    onClick={() => {
                      setSelectedFormat(f.key);
                      const tcs = TIME_CONTROLS.filter(tc => tc.format === f.key);
                      if (tcs.length > 0) setSelectedTC(tcs[0]);
                    }}
                  >
                    <span className="challenge-format-icon">{f.icon}</span>
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>

              <div className="tc-grid" style={{ marginTop: 'var(--sp-3)' }}>
                {filteredTCs.map(tc => (
                  <button
                    key={tc.label}
                    className={cn('tc-btn', selectedTC.label === tc.label && 'tc-btn-active')}
                    onClick={() => setSelectedTC(tc)}
                  >
                    <span className="tc-label">{tc.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="challenge-section">
              <h3 className="challenge-section-title">Options</h3>

              <div className="challenge-option-row">
                <div>
                  <span className="challenge-option-label">Rated Game</span>
                  <span className="challenge-option-hint">Affects both players' ratings</span>
                </div>
                <button
                  className={cn('toggle', rated && 'toggle-active')}
                  onClick={() => setRated(!rated)}
                  role="switch"
                  aria-checked={rated}
                />
              </div>

              <div className="challenge-color-section">
                <span className="challenge-option-label">Your Color</span>
                <div className="challenge-color-btns">
                  {([
                    { key: 'random', label: 'Random', icon: '🎲' },
                    { key: 'white', label: 'White', icon: '♔' },
                    { key: 'black', label: 'Black', icon: '♚' },
                  ] as const).map(c => (
                    <button
                      key={c.key}
                      className={cn('challenge-color-btn', colorPref === c.key && 'challenge-color-active')}
                      onClick={() => setColorPref(c.key)}
                    >
                      <span>{c.icon}</span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Send Button */}
            <button
              className="btn btn-primary btn-xl challenge-send-btn"
              onClick={sendChallenge}
              disabled={!selectedUser || sending}
            >
              {sending ? (
                <span className="btn-loading"><span className="btn-text">Sending...</span></span>
              ) : (
                <>⚔️ Send Challenge</>
              )}
            </button>
          </div>

          {/* Right Column: Pending Challenges */}
          <div className="challenge-pending">
            {/* Received */}
            <div className="challenge-pending-section">
              <h3 className="challenge-section-title">
                Incoming Challenges
                {receivedChallenges.length > 0 && (
                  <span className="badge badge-accent" style={{ marginLeft: 'var(--sp-2)' }}>
                    {receivedChallenges.length}
                  </span>
                )}
              </h3>

              {loadingChallenges ? (
                <div className="challenge-skeleton-list">
                  {[1, 2].map(i => (
                    <div key={i} className="skeleton skeleton-card" style={{ height: 80 }} />
                  ))}
                </div>
              ) : receivedChallenges.length > 0 ? (
                <div className="challenge-list">
                  {receivedChallenges.map(c => (
                    <div key={c.id} className="challenge-card card card-compact animate-slideUp">
                      <div className="challenge-card-top">
                        <div className="challenge-card-user">
                          <div className="avatar avatar-sm">
                            {c.from?.avatar ? (
                              <img src={c.from.avatar} alt={c.from.username} />
                            ) : (
                              (c.from?.username || '?').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="challenge-card-name">
                              {c.from?.title && (
                                <span className="badge badge-title" style={{ fontSize: '9px', padding: '1px 4px', marginRight: '4px' }}>
                                  {c.from.title}
                                </span>
                              )}
                              {c.from?.displayName || c.from?.username}
                            </div>
                            <div className="challenge-card-meta">
                              {FORMAT_ICONS[getFormatFromTC(c.timeControl, c.increment)] || '⏱️'}{' '}
                              {getTimeLabel(c.timeControl, c.increment)} · {c.rated ? 'Rated' : 'Casual'}
                              {c.color !== 'random' && ` · ${c.color === 'white' ? '♔' : '♚'}`}
                            </div>
                          </div>
                        </div>
                        <div className="challenge-card-time">
                          {formatDateRelative(c.createdAt)}
                        </div>
                      </div>
                      <div className="challenge-card-actions">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleChallengeAction(c, 'accept')}
                          disabled={actioningId === c.id}
                        >
                          ✓ Accept
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleChallengeAction(c, 'decline')}
                          disabled={actioningId === c.id}
                        >
                          ✕ Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="challenge-empty">
                  <span className="challenge-empty-icon">📭</span>
                  <span>No incoming challenges</span>
                </div>
              )}
            </div>

            {/* Sent */}
            <div className="challenge-pending-section">
              <h3 className="challenge-section-title">
                Sent Challenges
                {sentChallenges.length > 0 && (
                  <span className="badge badge-info" style={{ marginLeft: 'var(--sp-2)' }}>
                    {sentChallenges.length}
                  </span>
                )}
              </h3>

              {sentChallenges.length > 0 ? (
                <div className="challenge-list">
                  {sentChallenges.map(c => (
                    <div key={c.id} className="challenge-card card card-compact animate-slideUp">
                      <div className="challenge-card-top">
                        <div className="challenge-card-user">
                          <div className="avatar avatar-sm">
                            {c.to?.avatar ? (
                              <img src={c.to.avatar} alt={c.to.username} />
                            ) : (
                              (c.to?.username || '?').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="challenge-card-name">
                              {c.to?.title && (
                                <span className="badge badge-title" style={{ fontSize: '9px', padding: '1px 4px', marginRight: '4px' }}>
                                  {c.to.title}
                                </span>
                              )}
                              {c.to?.displayName || c.to?.username}
                            </div>
                            <div className="challenge-card-meta">
                              {FORMAT_ICONS[getFormatFromTC(c.timeControl, c.increment)] || '⏱️'}{' '}
                              {getTimeLabel(c.timeControl, c.increment)} · {c.rated ? 'Rated' : 'Casual'}
                            </div>
                          </div>
                        </div>
                        <div className="challenge-card-time">
                          Waiting...
                        </div>
                      </div>
                      <div className="challenge-card-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleChallengeAction(c, 'cancel')}
                          disabled={actioningId === c.id}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="challenge-empty">
                  <span className="challenge-empty-icon">📤</span>
                  <span>No sent challenges</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .challenge-page {
          padding: var(--sp-8) 0;
          min-height: calc(100vh - var(--navbar-height));
        }

        .challenge-header {
          text-align: center;
          margin-bottom: var(--sp-8);
        }

        .challenge-title {
          font-size: var(--fs-3xl);
          font-weight: var(--fw-bold);
          margin-bottom: var(--sp-2);
        }

        .challenge-subtitle {
          color: var(--text-secondary);
          font-size: var(--fs-md);
        }

        .challenge-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: var(--sp-6);
          align-items: start;
        }

        /* --- Create Section --- */
        .challenge-create {
          display: flex;
          flex-direction: column;
          gap: var(--sp-6);
        }

        .challenge-section {
          background: var(--bg-elevated);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: var(--sp-5);
        }

        .challenge-section-title {
          font-size: var(--fs-sm);
          font-weight: var(--fw-semibold);
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: var(--sp-3);
          display: flex;
          align-items: center;
        }

        /* --- Search --- */
        .challenge-search {
          position: relative;
        }

        .challenge-search-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .challenge-search-icon {
          position: absolute;
          left: var(--sp-3);
          font-size: var(--fs-sm);
          pointer-events: none;
          z-index: 1;
        }

        .challenge-search-input {
          padding-left: var(--sp-8) !important;
        }

        .challenge-search-spinner {
          position: absolute;
          right: var(--sp-3);
          width: 16px;
          height: 16px;
          border: 2px solid var(--border-primary);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        .challenge-search-results {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: var(--bg-elevated);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          z-index: var(--z-dropdown);
          max-height: 320px;
          overflow-y: auto;
          animation: fadeIn 0.15s ease;
        }

        .challenge-search-result {
          display: flex;
          align-items: center;
          gap: var(--sp-3);
          width: 100%;
          padding: var(--sp-3) var(--sp-4);
          background: none;
          border: none;
          cursor: pointer;
          transition: background var(--transition-fast);
          text-align: left;
          color: var(--text-primary);
        }

        .challenge-search-result:hover {
          background: var(--bg-hover);
        }

        .challenge-result-info {
          flex: 1;
          min-width: 0;
        }

        .challenge-result-name {
          font-size: var(--fs-sm);
          font-weight: var(--fw-medium);
          display: flex;
          align-items: center;
        }

        .challenge-result-sub {
          font-size: var(--fs-xs);
          color: var(--text-tertiary);
        }

        .challenge-search-empty {
          padding: var(--sp-4);
          text-align: center;
          font-size: var(--fs-sm);
          color: var(--text-tertiary);
        }

        /* --- Selected User --- */
        .challenge-selected-user {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .challenge-user-info {
          display: flex;
          align-items: center;
          gap: var(--sp-3);
        }

        .challenge-user-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .challenge-user-name {
          font-weight: var(--fw-semibold);
          font-size: var(--fs-base);
          display: flex;
          align-items: center;
          gap: var(--sp-2);
        }

        .challenge-user-meta {
          display: flex;
          align-items: center;
          gap: var(--sp-3);
          font-size: var(--fs-xs);
          color: var(--text-secondary);
        }

        .challenge-user-rating {
          font-family: var(--font-mono);
          font-weight: var(--fw-medium);
        }

        .challenge-user-online {
          display: flex;
          align-items: center;
          gap: var(--sp-1);
          color: var(--success);
        }

        /* --- Formats --- */
        .challenge-formats {
          display: flex;
          gap: var(--sp-2);
        }

        .challenge-format-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--sp-1);
          padding: var(--sp-2) var(--sp-2);
          background: var(--bg-hover);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: var(--fs-xs);
          font-weight: var(--fw-medium);
          color: var(--text-secondary);
        }

        .challenge-format-btn:hover {
          border-color: var(--border-hover);
        }

        .challenge-format-active {
          border-color: var(--accent);
          background: var(--accent-muted);
          color: var(--accent-text);
        }

        .challenge-format-icon {
          font-size: var(--fs-lg);
        }

        /* --- Options --- */
        .challenge-option-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--sp-3) 0;
          border-bottom: 1px solid var(--border-secondary);
        }

        .challenge-option-label {
          font-weight: var(--fw-medium);
          font-size: var(--fs-sm);
          display: block;
        }

        .challenge-option-hint {
          font-size: var(--fs-xs);
          color: var(--text-tertiary);
          display: block;
        }

        .challenge-color-section {
          padding-top: var(--sp-3);
        }

        .challenge-color-btns {
          display: flex;
          gap: var(--sp-2);
          margin-top: var(--sp-2);
        }

        .challenge-color-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--sp-1);
          padding: var(--sp-2) var(--sp-3);
          background: var(--bg-hover);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: var(--fs-sm);
          color: var(--text-secondary);
        }

        .challenge-color-btn:hover {
          border-color: var(--border-hover);
        }

        .challenge-color-active {
          border-color: var(--accent);
          background: var(--accent-muted);
          color: var(--accent-text);
        }

        /* --- Send Button --- */
        .challenge-send-btn {
          width: 100%;
          font-size: var(--fs-lg);
        }

        /* --- Pending Challenges Column --- */
        .challenge-pending {
          display: flex;
          flex-direction: column;
          gap: var(--sp-6);
        }

        .challenge-pending-section {
          background: var(--bg-elevated);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: var(--sp-5);
        }

        .challenge-list {
          display: flex;
          flex-direction: column;
          gap: var(--sp-3);
        }

        .challenge-skeleton-list {
          display: flex;
          flex-direction: column;
          gap: var(--sp-3);
        }

        .challenge-card {
          padding: var(--sp-3) !important;
        }

        .challenge-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: var(--sp-3);
        }

        .challenge-card-user {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
        }

        .challenge-card-name {
          font-size: var(--fs-sm);
          font-weight: var(--fw-semibold);
          display: flex;
          align-items: center;
        }

        .challenge-card-meta {
          font-size: var(--fs-xs);
          color: var(--text-tertiary);
          font-family: var(--font-mono);
        }

        .challenge-card-time {
          font-size: var(--fs-xs);
          color: var(--text-tertiary);
          white-space: nowrap;
        }

        .challenge-card-actions {
          display: flex;
          gap: var(--sp-2);
        }

        .challenge-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--sp-2);
          padding: var(--sp-6) var(--sp-4);
          color: var(--text-tertiary);
          font-size: var(--fs-sm);
        }

        .challenge-empty-icon {
          font-size: var(--fs-2xl);
          opacity: 0.5;
        }

        /* --- Auth Prompt --- */
        .challenge-auth-prompt {
          max-width: 420px;
          margin: var(--sp-16) auto;
        }

        /* --- TC Grid (reuse play page) --- */
        .tc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: var(--sp-2);
        }

        .tc-btn {
          padding: var(--sp-2) var(--sp-2);
          background: var(--bg-hover);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: center;
          color: var(--text-primary);
        }

        .tc-btn:hover {
          border-color: var(--border-hover);
        }

        .tc-btn-active {
          border-color: var(--accent);
          background: var(--accent-muted);
          color: var(--accent-text);
        }

        .tc-label {
          font-weight: var(--fw-semibold);
          font-size: var(--fs-sm);
          font-family: var(--font-mono);
        }

        /* --- Responsive --- */
        @media (max-width: 900px) {
          .challenge-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .challenge-formats {
            flex-wrap: wrap;
          }

          .challenge-format-btn {
            flex: 1 1 calc(50% - var(--sp-1));
          }

          .challenge-color-btns {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}

function getFormatFromTC(baseTime: number, increment: number): string {
  const total = baseTime + increment * 40;
  if (total < 180) return 'bullet';
  if (total < 600) return 'blitz';
  if (total < 1800) return 'rapid';
  return 'classical';
}
