'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/lib/toast';
import { isUsernameValid } from '@/lib/utils';

export default function UsernamePage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const { addToast } = useToast();
  const [username, setUsername] = useState('');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkAvailability = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setAvailable(null);
      return;
    }

    const validation = isUsernameValid(value);
    if (!validation.valid) {
      setError(validation.error || 'Invalid username');
      setAvailable(false);
      return;
    }

    setChecking(true);
    setError('');
    try {
      const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(value)}`);
      const data = await res.json();
      setAvailable(data.available);
      if (!data.available) {
        setError('Username is taken');
      }
    } catch {
      setError('Error checking availability');
      setAvailable(null);
    }
    setChecking(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username.length >= 3) {
        checkAvailability(username);
      } else {
        setAvailable(null);
        setError('');
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [username, checkAvailability]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!available || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/users/set-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (!res.ok) {
        addToast({ type: 'error', message: data.error || 'Failed to set username' });
        setLoading(false);
        return;
      }

      // Update session with new username
      await update({ username });
      addToast({ type: 'success', message: `Welcome, @${username}!` });
      router.push('/dashboard');
      router.refresh();
    } catch {
      addToast({ type: 'error', message: 'Something went wrong' });
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <div className="auth-logo">♔</div>
          <h1 className="auth-title">Choose Your Username</h1>
          <p className="auth-subtitle">This is how other players will know you</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label className="input-label" htmlFor="username">Username</label>
            <div className="username-input-wrapper">
              <span className="username-prefix">@</span>
              <input
                id="username"
                type="text"
                className={`input username-input ${error ? 'input-error' : available ? 'input-success' : ''}`}
                placeholder="KnightRider27"
                value={username}
                onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                maxLength={20}
                autoFocus
                required
              />
              {checking && <span className="username-status">⏳</span>}
              {!checking && available === true && <span className="username-status username-available">✓</span>}
              {!checking && available === false && <span className="username-status username-taken">✕</span>}
            </div>
            {error && <p className="input-error-text">{error}</p>}
            {available && <p className="input-success-text">Username is available!</p>}
            <p className="input-hint">3-20 characters. Letters, numbers, and underscores only.</p>
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-lg auth-submit ${loading ? 'btn-loading' : ''}`}
            disabled={!available || loading}
          >
            <span className="btn-text">Continue</span>
          </button>
        </form>
      </div>

      <style jsx>{`
        .auth-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - var(--navbar-height));
          padding: var(--sp-6);
        }

        .auth-card {
          width: 100%;
          max-width: 420px;
          padding: var(--sp-8);
          animation: slideUp 0.3s ease;
        }

        .auth-header {
          text-align: center;
          margin-bottom: var(--sp-6);
        }

        .auth-logo {
          font-size: var(--fs-4xl);
          margin-bottom: var(--sp-4);
        }

        .auth-title {
          font-size: var(--fs-2xl);
          font-weight: var(--fw-bold);
          margin-bottom: var(--sp-2);
        }

        .auth-subtitle {
          font-size: var(--fs-sm);
          color: var(--text-secondary);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: var(--sp-4);
        }

        .username-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .username-prefix {
          position: absolute;
          left: 12px;
          color: var(--text-tertiary);
          font-weight: var(--fw-medium);
          pointer-events: none;
          z-index: 1;
        }

        .username-input {
          padding-left: 28px;
          padding-right: 36px;
        }

        .input-success {
          border-color: var(--success) !important;
        }

        .input-success:focus {
          box-shadow: 0 0 0 3px var(--success-muted) !important;
        }

        .username-status {
          position: absolute;
          right: 12px;
          font-size: var(--fs-md);
        }

        .username-available {
          color: var(--success);
        }

        .username-taken {
          color: var(--error);
        }

        .auth-submit {
          width: 100%;
          margin-top: var(--sp-2);
        }
      `}</style>
    </div>
  );
}
