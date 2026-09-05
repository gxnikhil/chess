'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/toast';

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [tab, setTab] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        addToast({ type: 'error', message: 'Invalid email or password' });
      } else {
        addToast({ type: 'success', message: 'Welcome back!' });
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      addToast({ type: 'error', message: 'Something went wrong' });
    }
    setLoading(false);
  }

  async function handlePhoneLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!otpSent) {
      setOtpSent(true);
      addToast({ type: 'info', message: 'OTP sent to your phone (use 123456 for demo)' });
      return;
    }

    setLoading(true);
    try {
      const result = await signIn('phone-otp', {
        phone,
        otp,
        redirect: false,
      });

      if (result?.error) {
        addToast({ type: 'error', message: 'Invalid OTP' });
      } else {
        addToast({ type: 'success', message: 'Welcome!' });
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      addToast({ type: 'error', message: 'Something went wrong' });
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    await signIn('google', { callbackUrl: '/dashboard' });
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <Link href="/" className="auth-logo">♔</Link>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to continue playing</p>
        </div>

        {/* Google Sign In */}
        <button className="btn btn-secondary btn-lg auth-google-btn" onClick={handleGoogleLogin}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <div className="divider-text">or</div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'email' ? 'auth-tab-active' : ''}`}
            onClick={() => setTab('email')}
          >
            ✉️ Email
          </button>
          <button
            className={`auth-tab ${tab === 'phone' ? 'auth-tab-active' : ''}`}
            onClick={() => setTab('phone')}
          >
            📱 Phone
          </button>
        </div>

        {tab === 'email' ? (
          <form onSubmit={handleEmailLogin} className="auth-form">
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
              <div className="flex justify-between items-center">
                <label className="input-label" htmlFor="password">Password</label>
                <Link href="#" className="auth-forgot-link">Forgot?</Link>
              </div>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={`btn btn-primary btn-lg auth-submit ${loading ? 'btn-loading' : ''}`} disabled={loading}>
              <span className="btn-text">Sign In</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handlePhoneLogin} className="auth-form">
            <div className="input-group">
              <label className="input-label" htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                className="input"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                disabled={otpSent}
              />
            </div>
            {otpSent && (
              <div className="input-group">
                <label className="input-label" htmlFor="otp">Verification Code</label>
                <input
                  id="otp"
                  type="text"
                  className="input"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  maxLength={6}
                  required
                  autoFocus
                />
                <p className="input-hint">Demo: use code 123456</p>
              </div>
            )}
            <button type="submit" className={`btn btn-primary btn-lg auth-submit ${loading ? 'btn-loading' : ''}`} disabled={loading}>
              <span className="btn-text">{otpSent ? 'Verify & Sign In' : 'Send Code'}</span>
            </button>
          </form>
        )}

        <p className="auth-footer-text">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="auth-link">Create one</Link>
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

        .auth-tabs {
          display: flex;
          gap: var(--sp-2);
          margin-bottom: var(--sp-4);
        }

        .auth-tab {
          flex: 1;
          padding: var(--sp-2) var(--sp-3);
          font-size: var(--fs-sm);
          font-weight: var(--fw-medium);
          color: var(--text-secondary);
          background: none;
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .auth-tab:hover {
          background: var(--bg-hover);
        }

        .auth-tab-active {
          background: var(--accent-muted);
          color: var(--accent-text);
          border-color: var(--accent);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: var(--sp-4);
        }

        .auth-forgot-link {
          font-size: var(--fs-xs);
          color: var(--accent-text);
          text-decoration: none;
        }

        .auth-forgot-link:hover {
          text-decoration: underline;
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
