'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/lib/socket/client';
import { TIME_CONTROLS, FORMAT_ICONS, cn } from '@/lib/utils';
import { useToast } from '@/lib/toast';
import Link from 'next/link';

export default function PlayPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { addToast } = useToast();
  const { socket, connected } = useSocket();
  const userId = (session?.user as any)?.id;

  const [selectedFormat, setSelectedFormat] = useState('rapid');
  const [selectedTC, setSelectedTC] = useState<(typeof TIME_CONTROLS)[number]>(TIME_CONTROLS[6]); // 10+0
  const [rated, setRated] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);

  useEffect(() => {
    if (connected && userId) {
      socket.emit('register', userId);
    }
  }, [connected, userId, socket]);

  useEffect(() => {
    if (!connected) return;

    function onGameMatched(data: any) {
      setSearching(false);
      addToast({ type: 'success', message: 'Opponent found!' });
      setTimeout(() => {
        router.push(`/game/${data.gameId}`);
      }, 500);
    }

    function onSearching() {
      setSearching(true);
    }

    function onSearchCancelled() {
      setSearching(false);
      setSearchTime(0);
    }

    socket.on('game-matched', onGameMatched);
    socket.on('searching', onSearching);
    socket.on('search-cancelled', onSearchCancelled);

    return () => {
      socket.off('game-matched', onGameMatched);
      socket.off('searching', onSearching);
      socket.off('search-cancelled', onSearchCancelled);
    };
  }, [connected, socket, router, addToast]);

  // Search timer
  useEffect(() => {
    if (!searching) return;
    const interval = setInterval(() => {
      setSearchTime(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [searching]);

  function startSearch() {
    if (!userId) {
      router.push('/login');
      return;
    }
    socket.emit('find-game', {
      userId,
      timeControl: selectedTC.baseTime,
      increment: selectedTC.increment,
      rated,
      rating: 1500, // Default - will be fetched from DB in production
    });
    setSearching(true);
    setSearchTime(0);
  }

  function cancelSearch() {
    socket.emit('cancel-search', userId);
    setSearching(false);
    setSearchTime(0);
  }

  const formats = [
    { key: 'bullet', label: 'Bullet', icon: '⚡' },
    { key: 'blitz', label: 'Blitz', icon: '🔥' },
    { key: 'rapid', label: 'Rapid', icon: '⏱️' },
    { key: 'classical', label: 'Classical', icon: '🏛️' },
  ];

  const filteredTCs = TIME_CONTROLS.filter(tc => tc.format === selectedFormat);

  return (
    <div className="play-page">
      <div className="container-narrow">
        <div className="play-header">
          <h1 className="play-title">Play Online</h1>
          <p className="play-subtitle">Find an opponent and start playing</p>
        </div>

        {searching ? (
          <div className="searching-card card">
            <div className="searching-animation">
              <div className="searching-spinner" />
              <div className="searching-piece">♟</div>
            </div>
            <h2 className="searching-title">Searching for opponent...</h2>
            <p className="searching-info">
              {selectedTC.label} • {rated ? 'Rated' : 'Casual'}
            </p>
            <p className="searching-time">{searchTime}s</p>
            <button className="btn btn-secondary btn-lg" onClick={cancelSearch}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="play-content">
            {/* Format Tabs */}
            <div className="play-formats">
              {formats.map(f => (
                <button
                  key={f.key}
                  className={cn('play-format-btn', selectedFormat === f.key && 'play-format-active')}
                  onClick={() => {
                    setSelectedFormat(f.key);
                    const tcs = TIME_CONTROLS.filter(tc => tc.format === f.key);
                    if (tcs.length > 0) setSelectedTC(tcs[0]);
                  }}
                >
                  <span className="play-format-icon">{f.icon}</span>
                  <span>{f.label}</span>
                </button>
              ))}
            </div>

            {/* Time Controls */}
            <div className="play-section">
              <h3 className="play-section-title">Time Control</h3>
              <div className="tc-grid">
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

            {/* Rated Toggle */}
            <div className="play-section">
              <div className="play-toggle-row">
                <div>
                  <span className="play-toggle-label">Rated Game</span>
                  <span className="play-toggle-hint">Affects your rating</span>
                </div>
                <button
                  className={cn('toggle', rated && 'toggle-active')}
                  onClick={() => setRated(!rated)}
                  role="switch"
                  aria-checked={rated}
                />
              </div>
            </div>

            {/* Start Button */}
            <button className="btn btn-primary btn-xl play-start-btn" onClick={startSearch}>
              {FORMAT_ICONS[selectedFormat]} Find Opponent
            </button>

            {/* Divider */}
            <div className="divider-text">or</div>

            {/* Other Options */}
            <div className="play-other-options">
              <Link href="/play/bot" className="play-option-card card card-hover">
                <span className="play-option-icon">🤖</span>
                <div>
                  <div className="play-option-title">Play vs Bot</div>
                  <div className="play-option-desc">Challenge a chess engine at your level</div>
                </div>
              </Link>
              <Link href="/challenge" className="play-option-card card card-hover">
                <span className="play-option-icon">👤</span>
                <div>
                  <div className="play-option-title">Challenge a Friend</div>
                  <div className="play-option-desc">Send a challenge to a specific player</div>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .play-page {
          padding: var(--sp-8) 0;
        }

        .play-header {
          text-align: center;
          margin-bottom: var(--sp-8);
        }

        .play-title {
          font-size: var(--fs-3xl);
          font-weight: var(--fw-bold);
          margin-bottom: var(--sp-2);
        }

        .play-subtitle {
          color: var(--text-secondary);
          font-size: var(--fs-md);
        }

        .play-content {
          max-width: 520px;
          margin: 0 auto;
        }

        .play-formats {
          display: flex;
          gap: var(--sp-2);
          margin-bottom: var(--sp-6);
        }

        .play-format-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--sp-1);
          padding: var(--sp-3) var(--sp-2);
          background: var(--bg-elevated);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: var(--fs-sm);
          font-weight: var(--fw-medium);
          color: var(--text-secondary);
        }

        .play-format-btn:hover {
          border-color: var(--border-hover);
          background: var(--bg-hover);
        }

        .play-format-active {
          border-color: var(--accent);
          background: var(--accent-muted);
          color: var(--accent-text);
        }

        .play-format-icon {
          font-size: var(--fs-2xl);
        }

        .play-section {
          margin-bottom: var(--sp-6);
        }

        .play-section-title {
          font-size: var(--fs-sm);
          font-weight: var(--fw-semibold);
          color: var(--text-secondary);
          margin-bottom: var(--sp-3);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .tc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
          gap: var(--sp-2);
        }

        .tc-btn {
          padding: var(--sp-3) var(--sp-2);
          background: var(--bg-elevated);
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
          font-size: var(--fs-md);
          font-family: var(--font-mono);
        }

        .play-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--sp-3) var(--sp-4);
          background: var(--bg-elevated);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
        }

        .play-toggle-label {
          font-weight: var(--fw-medium);
          font-size: var(--fs-sm);
          display: block;
        }

        .play-toggle-hint {
          font-size: var(--fs-xs);
          color: var(--text-tertiary);
        }

        .play-start-btn {
          width: 100%;
          margin-bottom: var(--sp-6);
          font-size: var(--fs-lg);
        }

        .play-other-options {
          display: flex;
          flex-direction: column;
          gap: var(--sp-3);
        }

        .play-option-card {
          display: flex;
          align-items: center;
          gap: var(--sp-4);
          padding: var(--sp-4);
          text-decoration: none;
          cursor: pointer;
        }

        .play-option-icon {
          font-size: var(--fs-3xl);
          flex-shrink: 0;
        }

        .play-option-title {
          font-weight: var(--fw-semibold);
          font-size: var(--fs-sm);
          margin-bottom: 2px;
        }

        .play-option-desc {
          font-size: var(--fs-xs);
          color: var(--text-secondary);
        }

        /* Searching State */
        .searching-card {
          max-width: 420px;
          margin: 0 auto;
          text-align: center;
          padding: var(--sp-10);
        }

        .searching-animation {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto var(--sp-6);
        }

        .searching-spinner {
          width: 80px;
          height: 80px;
          border: 3px solid var(--border-primary);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .searching-piece {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--fs-3xl);
        }

        .searching-title {
          font-size: var(--fs-xl);
          font-weight: var(--fw-semibold);
          margin-bottom: var(--sp-2);
        }

        .searching-info {
          font-size: var(--fs-sm);
          color: var(--text-secondary);
          margin-bottom: var(--sp-1);
        }

        .searching-time {
          font-size: var(--fs-2xl);
          font-weight: var(--fw-bold);
          color: var(--accent-text);
          font-family: var(--font-mono);
          margin-bottom: var(--sp-6);
        }
      `}</style>
    </div>
  );
}
