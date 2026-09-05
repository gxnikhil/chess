'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme';
import { cn, getUsernameInitial } from '@/lib/utils';

interface NavbarProps {
  user?: {
    id: string;
    username?: string;
    displayName?: string;
    avatar?: string;
    isAdmin?: boolean;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/play', label: 'Play', icon: '♟' },
    { href: '/play/bot', label: 'Bots', icon: '🤖' },
    { href: '/analysis', label: 'Analysis', icon: '📈' },
    { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
    { href: '/community', label: 'Community', icon: '👥' },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Left: Logo + Nav Links */}
        <div className="navbar-left">
          <Link href={user ? '/dashboard' : '/'} className="navbar-logo">
            <span className="navbar-logo-icon">♔</span>
            <span className="navbar-logo-text">ChessMaster</span>
          </Link>

          <div className={cn('navbar-links', mobileMenuOpen && 'navbar-links-open')}>
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn('navbar-link', isActive(link.href) && 'navbar-link-active')}
              >
                <span className="navbar-link-icon hide-desktop">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Search, Theme, Notifications, Profile */}
        <div className="navbar-right">
          {/* Search */}
          <div className="navbar-search-container" ref={searchRef}>
            <button
              className="navbar-icon-btn hide-mobile"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search players"
            >
              🔍
            </button>
            {searchOpen && (
              <div className="navbar-search-dropdown">
                <input
                  type="text"
                  className="input"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      window.location.href = `/players?q=${encodeURIComponent(searchQuery)}`;
                      setSearchOpen(false);
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            className="navbar-icon-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Notifications */}
          {user && (
            <Link href="/dashboard" className="navbar-icon-btn navbar-notif-btn">
              🔔
            </Link>
          )}

          {/* Auth / Profile */}
          {user ? (
            <div className="navbar-profile" ref={profileRef}>
              <button
                className="navbar-profile-btn"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className="avatar avatar-sm">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username || 'Avatar'} />
                  ) : (
                    getUsernameInitial(user.username || user.displayName || 'P')
                  )}
                </div>
                <span className="navbar-username hide-mobile">
                  {user.username || 'Set Username'}
                </span>
              </button>

              {profileOpen && (
                <div className="dropdown-menu navbar-dropdown">
                  <div className="navbar-dropdown-header">
                    <div className="avatar">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" />
                      ) : (
                        getUsernameInitial(user.username || 'P')
                      )}
                    </div>
                    <div>
                      <div className="navbar-dropdown-name">
                        {user.displayName || user.username || 'Player'}
                      </div>
                      {user.username && (
                        <div className="navbar-dropdown-username">@{user.username}</div>
                      )}
                    </div>
                  </div>
                  <div className="dropdown-divider" />
                  <Link href={user.username ? `/user/${user.username}` : '/username'} className="dropdown-item">
                    👤 Profile
                  </Link>
                  <Link href="/dashboard" className="dropdown-item">
                    📊 Dashboard
                  </Link>
                  <Link href="/analysis" className="dropdown-item">
                    📈 Analysis Board
                  </Link>
                  <Link href="/history" className="dropdown-item">
                    📋 Game History
                  </Link>
                  <div className="dropdown-divider" />
                  <Link href="/settings" className="dropdown-item">
                    ⚙️ Settings
                  </Link>
                  {user.isAdmin && (
                    <Link href="/admin" className="dropdown-item">
                      🛡️ Admin Panel
                    </Link>
                  )}
                  <div className="dropdown-divider" />
                  <button
                    className="dropdown-item dropdown-item-danger"
                    onClick={() => {
                      window.location.href = '/api/auth/signout';
                    }}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar-auth">
              <Link href="/login" className="btn btn-ghost btn-sm">
                Sign In
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Play Free
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="navbar-hamburger show-mobile-only"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={cn('hamburger-line', mobileMenuOpen && 'hamburger-open')} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

      <style jsx>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: var(--navbar-height);
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-primary);
          z-index: var(--z-sticky);
          backdrop-filter: blur(12px);
        }

        .navbar-inner {
          max-width: var(--max-width);
          margin: 0 auto;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--sp-4);
          gap: var(--sp-4);
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: var(--sp-6);
        }

        .navbar-logo {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
          font-weight: var(--fw-bold);
          font-size: var(--fs-lg);
          color: var(--text-primary);
          text-decoration: none;
          flex-shrink: 0;
        }

        .navbar-logo-icon {
          font-size: var(--fs-2xl);
          line-height: 1;
        }

        .navbar-logo-text {
          background: linear-gradient(135deg, var(--accent), var(--accent-text));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .navbar-links {
          display: flex;
          align-items: center;
          gap: var(--sp-1);
        }

        .navbar-link {
          padding: var(--sp-2) var(--sp-3);
          font-size: var(--fs-sm);
          font-weight: var(--fw-medium);
          color: var(--text-secondary);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
          text-decoration: none;
        }

        .navbar-link:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }

        .navbar-link-active {
          color: var(--accent-text);
          background: var(--accent-muted);
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
        }

        .navbar-icon-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: var(--fs-md);
          color: var(--text-secondary);
          text-decoration: none;
        }

        .navbar-icon-btn:hover {
          background: var(--bg-hover);
        }

        .navbar-search-container {
          position: relative;
        }

        .navbar-search-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 280px;
          padding: var(--sp-2);
          background: var(--bg-elevated);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          animation: fadeIn 0.15s ease;
        }

        .navbar-profile {
          position: relative;
        }

        .navbar-profile-btn {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
          padding: var(--sp-1) var(--sp-2);
          background: none;
          border: 1px solid transparent;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          color: var(--text-primary);
        }

        .navbar-profile-btn:hover {
          background: var(--bg-hover);
          border-color: var(--border-primary);
        }

        .navbar-username {
          font-size: var(--fs-sm);
          font-weight: var(--fw-medium);
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .navbar-dropdown {
          width: 240px;
          padding: var(--sp-2);
        }

        .navbar-dropdown-header {
          display: flex;
          align-items: center;
          gap: var(--sp-3);
          padding: var(--sp-2) var(--sp-3);
        }

        .navbar-dropdown-name {
          font-weight: var(--fw-semibold);
          font-size: var(--fs-sm);
        }

        .navbar-dropdown-username {
          font-size: var(--fs-xs);
          color: var(--text-tertiary);
        }

        .dropdown-item-danger {
          color: var(--error);
        }

        .navbar-auth {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
        }

        .navbar-hamburger {
          display: none;
          width: 36px;
          height: 36px;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
        }

        .hamburger-line {
          display: block;
          width: 20px;
          height: 2px;
          background: var(--text-primary);
          position: relative;
          transition: all var(--transition-fast);
        }

        .hamburger-line::before,
        .hamburger-line::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 2px;
          background: var(--text-primary);
          left: 0;
          transition: all var(--transition-fast);
        }

        .hamburger-line::before { top: -6px; }
        .hamburger-line::after { top: 6px; }

        .hamburger-open {
          background: transparent;
        }

        .hamburger-open::before {
          top: 0;
          transform: rotate(45deg);
        }

        .hamburger-open::after {
          top: 0;
          transform: rotate(-45deg);
        }

        .navbar-mobile-overlay {
          display: none;
        }

        .hide-desktop { display: none; }
        .show-mobile-only { display: none; }

        @media (max-width: 768px) {
          .navbar-links {
            display: none;
            position: fixed;
            top: var(--navbar-height);
            left: 0;
            right: 0;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border-primary);
            flex-direction: column;
            padding: var(--sp-3);
            gap: var(--sp-1);
            z-index: var(--z-sticky);
            animation: slideDown 0.2s ease;
          }

          .navbar-links-open {
            display: flex;
          }

          .navbar-link {
            width: 100%;
            padding: var(--sp-3) var(--sp-4);
            font-size: var(--fs-base);
          }

          .hide-mobile { display: none !important; }
          .hide-desktop { display: inline; }
          .show-mobile-only { display: flex !important; }

          .navbar-mobile-overlay {
            display: block;
            position: fixed;
            inset: 0;
            top: var(--navbar-height);
            background: rgba(0, 0, 0, 0.4);
            z-index: calc(var(--z-sticky) - 1);
          }

          .navbar-search-dropdown {
            position: fixed;
            top: var(--navbar-height);
            left: 0;
            right: 0;
            width: auto;
            border-radius: 0;
            border-top: none;
          }
        }
      `}</style>
    </nav>
  );
}
