'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Chess } from 'chess.js';
import Chessboard from '@/components/ChessBoard';

// Auto-playing demo board for the hero section
function HeroBoard() {
  const [game, setGame] = useState(new Chess());
  const [boardWidth, setBoardWidth] = useState(400);

  useEffect(() => {
    const updateWidth = () => {
      const w = Math.min(window.innerWidth * 0.38, 440);
      setBoardWidth(Math.max(280, w));
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setGame(prev => {
        const g = new Chess(prev.fen());
        if (g.isGameOver()) {
          return new Chess();
        }
        const moves = g.moves();
        if (moves.length > 0) {
          g.move(moves[Math.floor(Math.random() * moves.length)]);
        }
        return g;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hero-board-wrapper">
      <div className="hero-board-glow" />
      <Chessboard
        id="hero-board"
        position={game.fen()}
        boardWidth={boardWidth}
        arePiecesDraggable={false}
        animationDuration={300}
        customBoardStyle={{
          borderRadius: '12px',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)',
        }}
        customDarkSquareStyle={{ backgroundColor: '#5b6c99' }}
        customLightSquareStyle={{ backgroundColor: '#b7c0d8' }}
      />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{description}</p>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat-item">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-container">
          <div className="hero-content">
            <div className="hero-badge">♔ Free Online Chess Platform</div>
            <h1 className="hero-title">
              Play. Improve.<br />
              <span className="hero-title-accent">Master.</span>
            </h1>
            <p className="hero-subtitle">
              Challenge players worldwide, face professional chess bots, 
              track your rating, and analyze every game. Your journey to 
              chess mastery starts here.
            </p>
            <div className="hero-actions">
              <Link href="/play" className="btn btn-primary btn-xl hero-btn-primary">
                ♟ Play Online
              </Link>
              <Link href="/play/bot" className="btn btn-secondary btn-xl hero-btn-secondary">
                🤖 Play vs Bot
              </Link>
            </div>
            <div className="hero-stats">
              <StatItem value="50K+" label="Players" />
              <StatItem value="1M+" label="Games Played" />
              <StatItem value="6" label="Bot Levels" />
              <StatItem value="24/7" label="Online" />
            </div>
          </div>
          <div className="hero-visual">
            {mounted && <HeroBoard />}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Everything You Need</h2>
            <p className="section-subtitle">
              A complete chess experience — from casual games to serious competitive play
            </p>
          </div>
          <div className="features-grid">
            <FeatureCard
              icon="⚔️"
              title="Play Online"
              description="Real-time multiplayer chess with players matched by skill level. Bullet, Blitz, Rapid, and Classical time controls."
            />
            <FeatureCard
              icon="👥"
              title="Challenge Friends"
              description="Send challenges to friends, customize time controls, and play rated or casual games with anyone on the platform."
            />
            <FeatureCard
              icon="🤖"
              title="Professional Bots"
              description="Face Stockfish-powered bots from Beginner (600) to Grandmaster (2500+), each with unique playing personalities."
            />
            <FeatureCard
              icon="📊"
              title="Detailed Statistics"
              description="Track your performance with accuracy scores, opening statistics, win rates by color, and detailed game analytics."
            />
            <FeatureCard
              icon="📈"
              title="Rating System"
              description="Separate Glicko-2 ratings for each time control. Track your progress with rating graphs and peak ratings."
            />
            <FeatureCard
              icon="🔍"
              title="Game Analysis"
              description="Engine-powered post-game analysis with move classifications, evaluation graphs, and opening identification."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Start Playing in Seconds</h2>
            <p className="section-subtitle">No downloads required. Just sign up and play.</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Create Account</h3>
              <p className="step-desc">Sign up with Google, email, or phone in under 30 seconds</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Choose Your Game</h3>
              <p className="step-desc">Pick your time control and match type — online or vs bot</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">Play & Improve</h3>
              <p className="step-desc">Analyze games, track ratings, and climb the leaderboard</p>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="leaderboard-preview">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Global Leaderboard</h2>
            <p className="section-subtitle">Compete for the top spot among thousands of players</p>
          </div>
          <div className="leaderboard-card card">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Rating</th>
                  <th className="hide-mobile">Games</th>
                  <th className="hide-mobile">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { rank: 1, name: 'GrandMasterX', rating: 2841, games: 1247, winRate: 78 },
                  { rank: 2, name: 'ChessKing', rating: 2798, games: 986, winRate: 74 },
                  { rank: 3, name: 'KnightStorm', rating: 2764, games: 1532, winRate: 71 },
                  { rank: 4, name: 'QueenGambit', rating: 2721, games: 842, winRate: 69 },
                  { rank: 5, name: 'BishopSlayer', rating: 2695, games: 1108, winRate: 67 },
                ].map(player => (
                  <tr key={player.rank}>
                    <td>
                      <span className={`rank-badge rank-${player.rank}`}>
                        {player.rank <= 3 ? ['🥇', '🥈', '🥉'][player.rank - 1] : player.rank}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="avatar avatar-sm">{player.name[0]}</div>
                        <span className="fw-medium">{player.name}</span>
                      </div>
                    </td>
                    <td><span className="rating-value">{player.rating}</span></td>
                    <td className="hide-mobile">{player.games.toLocaleString()}</td>
                    <td className="hide-mobile">{player.winRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-center" style={{ marginTop: 'var(--sp-6)' }}>
            <Link href="/leaderboard" className="btn btn-secondary btn-lg">
              View Full Leaderboard →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <h2 className="cta-title">Ready to Play?</h2>
            <p className="cta-subtitle">
              Join thousands of players and start your chess journey today. It&apos;s completely free.
            </p>
            <div className="cta-actions">
              <Link href="/register" className="btn btn-primary btn-xl">
                Create Free Account
              </Link>
              <Link href="/play/bot" className="btn btn-secondary btn-xl">
                Try a Bot Game First
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <span className="footer-logo-icon">♔</span>
                <span className="footer-logo-text">ChessMaster</span>
              </div>
              <p className="footer-brand-desc">
                The modern platform for competitive online chess. Play, improve, and master your game.
              </p>
            </div>
            <div className="footer-links-group">
              <h4 className="footer-links-title">Platform</h4>
              <Link href="/play" className="footer-link">Play Online</Link>
              <Link href="/play/bot" className="footer-link">Play vs Bot</Link>
              <Link href="/leaderboard" className="footer-link">Leaderboard</Link>
              <Link href="/players" className="footer-link">Players</Link>
            </div>
            <div className="footer-links-group">
              <h4 className="footer-links-title">Account</h4>
              <Link href="/register" className="footer-link">Create Account</Link>
              <Link href="/login" className="footer-link">Sign In</Link>
              <Link href="/settings" className="footer-link">Settings</Link>
            </div>
            <div className="footer-links-group">
              <h4 className="footer-links-title">Legal</h4>
              <Link href="#" className="footer-link">About</Link>
              <Link href="#" className="footer-link">Privacy Policy</Link>
              <Link href="#" className="footer-link">Terms of Service</Link>
              <Link href="#" className="footer-link">Fair Play</Link>
              <Link href="#" className="footer-link">Community Guidelines</Link>
              <Link href="#" className="footer-link">Help Center</Link>
              <Link href="#" className="footer-link">Contact</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} ChessMaster. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .landing {
          overflow-x: hidden;
        }

        /* ---- Hero ---- */
        .hero {
          position: relative;
          min-height: calc(100vh - var(--navbar-height));
          display: flex;
          align-items: center;
          padding: var(--sp-12) 0;
          overflow: hidden;
        }

        .hero-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 30% 20%, var(--accent-muted), transparent 60%),
                      radial-gradient(ellipse at 80% 80%, rgba(99, 102, 241, 0.06), transparent 50%);
          pointer-events: none;
        }

        .hero-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--sp-12);
          position: relative;
          z-index: 1;
        }

        .hero-content {
          flex: 1;
          max-width: 580px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--sp-2);
          padding: var(--sp-1) var(--sp-3);
          background: var(--accent-muted);
          color: var(--accent-text);
          border-radius: var(--radius-full);
          font-size: var(--fs-sm);
          font-weight: var(--fw-medium);
          margin-bottom: var(--sp-6);
          animation: fadeIn 0.6s ease;
        }

        .hero-title {
          font-size: var(--fs-hero);
          font-weight: var(--fw-extrabold);
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin-bottom: var(--sp-6);
          animation: slideUp 0.6s ease;
        }

        .hero-title-accent {
          background: linear-gradient(135deg, var(--accent), #6ee7b7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: var(--fs-lg);
          color: var(--text-secondary);
          line-height: 1.7;
          margin-bottom: var(--sp-8);
          max-width: 480px;
          animation: slideUp 0.6s ease 0.1s both;
        }

        .hero-actions {
          display: flex;
          gap: var(--sp-4);
          margin-bottom: var(--sp-10);
          animation: slideUp 0.6s ease 0.2s both;
        }

        .hero-btn-primary {
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
        }

        .hero-btn-primary:hover {
          box-shadow: 0 6px 28px rgba(16, 185, 129, 0.4);
          transform: translateY(-1px);
        }

        .hero-stats {
          display: flex;
          gap: var(--sp-8);
          animation: fadeIn 0.6s ease 0.4s both;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-size: var(--fs-2xl);
          font-weight: var(--fw-bold);
          color: var(--text-primary);
        }

        .stat-label {
          font-size: var(--fs-xs);
          color: var(--text-tertiary);
          margin-top: var(--sp-1);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .hero-visual {
          flex-shrink: 0;
          animation: fadeIn 0.8s ease 0.3s both;
        }

        .hero-board-wrapper {
          position: relative;
        }

        .hero-board-glow {
          position: absolute;
          inset: -40px;
          background: radial-gradient(circle, var(--accent-muted), transparent 70%);
          border-radius: 50%;
          filter: blur(40px);
          pointer-events: none;
        }

        /* ---- Sections ---- */
        .section-header {
          text-align: center;
          margin-bottom: var(--sp-12);
        }

        .section-title {
          font-size: var(--fs-3xl);
          font-weight: var(--fw-bold);
          margin-bottom: var(--sp-3);
          letter-spacing: -0.02em;
        }

        .section-subtitle {
          font-size: var(--fs-md);
          color: var(--text-secondary);
          max-width: 500px;
          margin: 0 auto;
        }

        /* ---- Features ---- */
        .features-section {
          padding: var(--sp-20) 0;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--sp-6);
        }

        .feature-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          padding: var(--sp-8);
          transition: all var(--transition-base);
        }

        .feature-card:hover {
          border-color: var(--accent);
          box-shadow: var(--shadow-glow);
          transform: translateY(-2px);
        }

        .feature-icon {
          font-size: var(--fs-3xl);
          margin-bottom: var(--sp-4);
        }

        .feature-title {
          font-size: var(--fs-lg);
          font-weight: var(--fw-semibold);
          margin-bottom: var(--sp-2);
        }

        .feature-desc {
          font-size: var(--fs-sm);
          color: var(--text-secondary);
          line-height: 1.6;
        }

        /* ---- How It Works ---- */
        .how-section {
          padding: var(--sp-20) 0;
          background: var(--bg-secondary);
        }

        .steps-grid {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--sp-6);
        }

        .step-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          padding: var(--sp-8);
          text-align: center;
          max-width: 280px;
          flex: 1;
        }

        .step-number {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent);
          color: white;
          font-weight: var(--fw-bold);
          font-size: var(--fs-xl);
          border-radius: var(--radius-full);
          margin: 0 auto var(--sp-4);
        }

        .step-title {
          font-size: var(--fs-md);
          font-weight: var(--fw-semibold);
          margin-bottom: var(--sp-2);
        }

        .step-desc {
          font-size: var(--fs-sm);
          color: var(--text-secondary);
        }

        .step-arrow {
          font-size: var(--fs-2xl);
          color: var(--text-tertiary);
        }

        /* ---- Leaderboard Preview ---- */
        .leaderboard-preview {
          padding: var(--sp-20) 0;
        }

        .leaderboard-card {
          max-width: 720px;
          margin: 0 auto;
          padding: 0;
          overflow: hidden;
        }

        .rank-badge {
          font-size: var(--fs-md);
        }

        .rating-value {
          font-weight: var(--fw-bold);
          color: var(--accent-text);
        }

        .fw-medium {
          font-weight: var(--fw-medium);
        }

        /* ---- CTA ---- */
        .cta-section {
          padding: var(--sp-20) 0;
        }

        .cta-card {
          text-align: center;
          background: var(--bg-elevated);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-2xl);
          padding: var(--sp-16) var(--sp-8);
          position: relative;
          overflow: hidden;
        }

        .cta-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, var(--accent-muted), transparent 70%);
          pointer-events: none;
        }

        .cta-title {
          font-size: var(--fs-3xl);
          font-weight: var(--fw-bold);
          margin-bottom: var(--sp-4);
          position: relative;
        }

        .cta-subtitle {
          font-size: var(--fs-md);
          color: var(--text-secondary);
          max-width: 480px;
          margin: 0 auto var(--sp-8);
          position: relative;
        }

        .cta-actions {
          display: flex;
          gap: var(--sp-4);
          justify-content: center;
          position: relative;
        }

        /* ---- Footer ---- */
        .footer {
          border-top: 1px solid var(--border-primary);
          padding: var(--sp-16) 0 var(--sp-8);
          background: var(--bg-secondary);
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: var(--sp-8);
          margin-bottom: var(--sp-12);
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
          font-weight: var(--fw-bold);
          font-size: var(--fs-lg);
          margin-bottom: var(--sp-3);
        }

        .footer-logo-icon {
          font-size: var(--fs-2xl);
        }

        .footer-logo-text {
          background: linear-gradient(135deg, var(--accent), var(--accent-text));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .footer-brand-desc {
          font-size: var(--fs-sm);
          color: var(--text-secondary);
          line-height: 1.6;
          max-width: 300px;
        }

        .footer-links-group {
          display: flex;
          flex-direction: column;
          gap: var(--sp-2);
        }

        .footer-links-title {
          font-size: var(--fs-sm);
          font-weight: var(--fw-semibold);
          color: var(--text-primary);
          margin-bottom: var(--sp-2);
        }

        .footer-link {
          font-size: var(--fs-sm);
          color: var(--text-secondary);
          text-decoration: none;
          transition: color var(--transition-fast);
        }

        .footer-link:hover {
          color: var(--accent-text);
        }

        .footer-bottom {
          border-top: 1px solid var(--border-primary);
          padding-top: var(--sp-6);
          text-align: center;
          font-size: var(--fs-xs);
          color: var(--text-tertiary);
        }

        /* ---- Responsive ---- */
        @media (max-width: 1024px) {
          .hero-container {
            flex-direction: column;
            text-align: center;
            gap: var(--sp-8);
          }

          .hero-content {
            max-width: 100%;
          }

          .hero-subtitle {
            max-width: 100%;
            margin-left: auto;
            margin-right: auto;
          }

          .hero-actions {
            justify-content: center;
          }

          .hero-stats {
            justify-content: center;
          }

          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: var(--fs-4xl);
          }

          .hero-subtitle {
            font-size: var(--fs-base);
          }

          .hero-actions {
            flex-direction: column;
            align-items: center;
          }

          .hero-stats {
            gap: var(--sp-4);
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .steps-grid {
            flex-direction: column;
          }

          .step-arrow {
            transform: rotate(90deg);
          }

          .step-card {
            max-width: 100%;
          }

          .cta-actions {
            flex-direction: column;
            align-items: center;
          }

          .footer-grid {
            grid-template-columns: 1fr;
            gap: var(--sp-6);
          }
        }
      `}</style>
    </div>
  );
}
