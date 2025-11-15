'use client';

import { useState } from 'react';
import { useTranslation } from '@/contexts/I18nContext';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('http://178.255.127.62:8081/api/v1/password/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setEmail('');
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-md w-full space-y-8 bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700">
        <div>
          <h2 className="text-3xl font-bold text-center text-white">
            {t('auth.forgotPassword')}
          </h2>
          <p className="mt-2 text-center text-slate-400">
            {t('auth.forgotPasswordDesc')}
          </p>
        </div>

        {success ? (
          <div className="rounded-lg bg-green-900/20 border border-green-500/50 p-4">
            <p className="text-green-400 text-sm">
              {t('auth.resetEmailSent')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {error && (
              <div className="rounded-lg bg-red-900/20 border border-red-500/50 p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                {t('auth.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('auth.emailPlaceholder')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.loading') : t('auth.sendResetLink')}
            </button>
          </form>
        )}

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-blue-400 hover:text-blue-300 transition"
          >
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}
