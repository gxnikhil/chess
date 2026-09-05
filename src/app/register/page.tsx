'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/toast';

export default function RegisterPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      addToast({ type: 'error', message: 'Passwords do not match' });
      return;
    }

    if (password.length < 8) {
      addToast({ type: 'error', message: 'Password must be at least 8 characters' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        addToast({ type: 'error', message: data.error || 'Registration failed' });
        setLoading(false);
        return;
      }

      // Auto sign in after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        addToast({ type: 'error', message: 'Account created but sign-in failed. Please try logging in.' });
        router.push('/login');
      } else {
        addToast({ type: 'success', message: 'Account created!' });
        router.push('/username');
        router.refresh();
      }
    } catch {
      addToast({ type: 'error', message: 'Something went wrong' });
    }
    setLoading(false);
  }

  async function handleGoogleSignUp() {
    await signIn('google', { callbackUrl: '/username' });
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <Link href="/" className="auth-logo">♔</Link>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Start your chess journey</p>
        </div>

        <button className="btn btn-secondary btn-lg auth-google-btn" onClick={handleGoogleSignUp}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <div className="divider-text">or register with email</div>

        <form onSubmit={handleRegister} className="auth-form">
          <div className="input-group">
            <label className="input-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="At least 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="confirm">Confirm Password</label>
            <input
              id="confirm"
              type="password"
              className="input"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={`btn btn-primary btn-lg auth-submit ${loading ? 'btn-loading' : ''}`} disabled={loading}>
            <span className="btn-text">Create Account</span>
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{' '}
          <Link href="/login" className="auth-link">Sign in</Link>
        </p>
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
          display: block;
          margin-bottom: var(--sp-4);
          text-decoration: none;
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

        .auth-google-btn {
          width: 100%;
          gap: var(--sp-3);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: var(--sp-4);
        }

        .auth-submit {
          width: 100%;
          margin-top: var(--sp-2);
        }

        .auth-footer-text {
          text-align: center;
          font-size: var(--fs-sm);
          color: var(--text-secondary);
          margin-top: var(--sp-6);
        }

        .auth-link {
          color: var(--accent-text);
          text-decoration: none;
          font-weight: var(--fw-medium);
        }

        .auth-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
