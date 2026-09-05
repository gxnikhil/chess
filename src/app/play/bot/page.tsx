'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/lib/socket/client';
import { TIME_CONTROLS, cn } from '@/lib/utils';
import { useToast } from '@/lib/toast';

const BOT_PROFILES = [
  {
    difficulty: 'beginner',
    name: 'Novice Knight',
    rating: 600,
    personality: 'balanced',
    description: 'A friendly beginner bot. Makes many mistakes and plays simple moves.',
    style: 'Beginner-friendly play',
    avatar: '🐣',
  },
  {
    difficulty: 'intermediate',
    name: 'The Rookie',
    rating: 1000,
    personality: 'tactical',
    description: 'An intermediate player. Sees basic tactics but misses complex ones.',
    style: 'Tactical but inconsistent',
    avatar: '🎯',
  },
  {
    difficulty: 'advanced',
    name: 'The Strategist',
    rating: 1400,
    personality: 'strategic',
    description: 'A solid club player. Good positional understanding with occasional errors.',
    style: 'Positional and strategic',
    avatar: '🧠',
  },
  {
    difficulty: 'expert',
    name: 'The Tactical Beast',
    rating: 1800,
    personality: 'attacker',
    description: 'An aggressive expert. Seeks tactical complications and sharp positions.',
    style: 'Aggressive and tactical',
    avatar: '⚔️',
  },
  {
    difficulty: 'master',
    name: 'The Endgame Master',
    rating: 2200,
    personality: 'endgame',
    description: 'A master-level player. Exceptional endgame technique and minimal mistakes.',
    style: 'Strong endgame play',
    avatar: '👑',
  },
  {
    difficulty: 'grandmaster',
    name: 'Grandmaster Engine',
    rating: 2500,
    personality: 'balanced',
    description: 'Near-perfect play. Finds the best moves in almost every position.',
    style: 'Near-perfect engine play',
    avatar: '🏆',
  },
];

export default function BotPlayPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { addToast } = useToast();
  const { socket, connected } = useSocket();
  const userId = (session?.user as any)?.id;

  const [selectedBot, setSelectedBot] = useState(BOT_PROFILES[2]); // Advanced default
  const [selectedTC, setSelectedTC] = useState<(typeof TIME_CONTROLS)[number]>(TIME_CONTROLS[6]); // 10+0
  const [color, setColor] = useState<'random' | 'white' | 'black'>('random');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (connected && userId) {
      socket.emit('register', userId);
    }
  }, [connected, userId, socket]);

  useEffect(() => {
    if (!connected) return;

    function onBotGameCreated(data: any) {
      setLoading(false);
      addToast({ type: 'success', message: 'Game started!' });
      router.push(`/game/${data.gameId}`);
    }

    socket.on('bot-game-created', onBotGameCreated);
    return () => { socket.off('bot-game-created', onBotGameCreated); };
  }, [connected, socket, router, addToast]);

  function startBotGame() {
    if (!userId) {
      router.push('/login');
      return;
    }

    setLoading(true);
    socket.emit('create-bot-game', {
      userId,
      timeControl: selectedTC.baseTime,
      increment: selectedTC.increment,
      botDifficulty: selectedBot.difficulty,
      botPersonality: selectedBot.personality,
      color,
      rating: 1500,
    });
  }

  return (
    <div className="bot-page">
      <div className="container-narrow">
        <div className="bot-header">
          <h1 className="bot-title">Play vs Bot</h1>
          <p className="bot-subtitle">Choose your opponent and start playing</p>
        </div>

        <div className="bot-content">
          {/* Bot Selection */}
          <div className="bot-section">
            <h3 className="bot-section-title">Choose Opponent</h3>
            <div className="bot-grid">
              {BOT_PROFILES.map(bot => (
                <button
                  key={bot.difficulty}
                  className={cn('bot-card', selectedBot.difficulty === bot.difficulty && 'bot-card-active')}
                  onClick={() => setSelectedBot(bot)}
                >
                  <div className="bot-card-avatar">{bot.avatar}</div>
                  <div className="bot-card-info">
                    <div className="bot-card-name">{bot.name}</div>
                    <div className="bot-card-rating">Rating: ~{bot.rating}</div>
                    <div className="bot-card-style">{bot.style}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Bot Details */}
          <div className="bot-selected card">
            <div className="bot-selected-header">
              <span className="bot-selected-avatar">{selectedBot.avatar}</span>
              <div>
                <h3 className="bot-selected-name">{selectedBot.name}</h3>
                <span className="badge badge-accent">{selectedBot.difficulty}</span>
              </div>
              <span className="bot-selected-rating">{selectedBot.rating}</span>
            </div>
            <p className="bot-selected-desc">{selectedBot.description}</p>
          </div>

          {/* Time Control */}
          <div className="bot-section">
            <h3 className="bot-section-title">Time Control</h3>
            <div className="tc-grid">
              {TIME_CONTROLS.map(tc => (
                <button
                  key={tc.label}
                  className={cn('tc-btn', selectedTC.label === tc.label && 'tc-btn-active')}
                  onClick={() => setSelectedTC(tc)}
                >
                  <span className="tc-label">{tc.label}</span>
                  <span className="tc-format">{tc.format}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="bot-section">
            <h3 className="bot-section-title">Play As</h3>
            <div className="color-grid">
              <button className={cn('color-btn', color === 'random' && 'color-btn-active')} onClick={() => setColor('random')}>
                🎲 Random
              </button>
              <button className={cn('color-btn', color === 'white' && 'color-btn-active')} onClick={() => setColor('white')}>
                ⬜ White
              </button>
              <button className={cn('color-btn', color === 'black' && 'color-btn-active')} onClick={() => setColor('black')}>
                ⬛ Black
              </button>
            </div>
          </div>

          {/* Start Button */}
          <button
            className={cn('btn btn-primary btn-xl bot-start-btn', loading && 'btn-loading')}
            onClick={startBotGame}
            disabled={loading}
          >
            <span className="btn-text">⚔️ Start Game</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .bot-page {
          padding: var(--sp-8) 0;
        }

        .bot-header {
          text-align: center;
          margin-bottom: var(--sp-8);
        }

        .bot-title {
          font-size: var(--fs-3xl);
          font-weight: var(--fw-bold);
          margin-bottom: var(--sp-2);
        }

        .bot-subtitle {
          color: var(--text-secondary);
        }

        .bot-content {
          max-width: 640px;
          margin: 0 auto;
        }

        .bot-section {
          margin-bottom: var(--sp-6);
        }

        .bot-section-title {
          font-size: var(--fs-sm);
          font-weight: var(--fw-semibold);
          color: var(--text-secondary);
          margin-bottom: var(--sp-3);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .bot-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--sp-2);
        }

        .bot-card {
          display: flex;
          align-items: center;
          gap: var(--sp-3);
          padding: var(--sp-3);
          background: var(--bg-elevated);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
          color: var(--text-primary);
        }

        .bot-card:hover {
          border-color: var(--border-hover);
        }

        .bot-card-active {
          border-color: var(--accent);
          background: var(--accent-muted);
        }

        .bot-card-avatar {
          font-size: var(--fs-2xl);
          flex-shrink: 0;
        }

        .bot-card-name {
          font-weight: var(--fw-semibold);
          font-size: var(--fs-sm);
        }

        .bot-card-rating {
          font-size: var(--fs-xs);
          color: var(--text-secondary);
        }

        .bot-card-style {
          font-size: var(--fs-xs);
          color: var(--text-tertiary);
        }

        .bot-selected {
          margin-bottom: var(--sp-6);
        }

        .bot-selected-header {
          display: flex;
          align-items: center;
          gap: var(--sp-3);
          margin-bottom: var(--sp-3);
        }

        .bot-selected-avatar {
          font-size: var(--fs-3xl);
        }

        .bot-selected-name {
          font-weight: var(--fw-semibold);
          margin-bottom: var(--sp-1);
        }

        .bot-selected-rating {
          margin-left: auto;
          font-size: var(--fs-2xl);
          font-weight: var(--fw-bold);
          color: var(--accent-text);
        }

        .bot-selected-desc {
          font-size: var(--fs-sm);
          color: var(--text-secondary);
        }

        .tc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: var(--sp-2);
        }

        .tc-btn {
          padding: var(--sp-2);
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
        }

        .tc-label {
          font-weight: var(--fw-semibold);
          font-size: var(--fs-sm);
          display: block;
          font-family: var(--font-mono);
        }

        .tc-format {
          font-size: var(--fs-xs);
          color: var(--text-tertiary);
          display: block;
        }

        .color-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--sp-2);
        }

        .color-btn {
          padding: var(--sp-3);
          background: var(--bg-elevated);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: var(--fs-sm);
          font-weight: var(--fw-medium);
          color: var(--text-primary);
        }

        .color-btn:hover {
          border-color: var(--border-hover);
        }

        .color-btn-active {
          border-color: var(--accent);
          background: var(--accent-muted);
          color: var(--accent-text);
        }

        .bot-start-btn {
          width: 100%;
        }

        @media (max-width: 640px) {
          .bot-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
