'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function ProfileForm() {
  const params = useSearchParams();
  const isOnboarding = params.get('onboarding') === '1';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void api.get<{ name: string | null; email: string | null }>('/users/me').then((r) => {
      if (r.ok) {
        setName(r.data.name ?? '');
        setEmail(r.data.email ?? '');
      }
    });
  }, []);

  async function handleSave() {
    setLoading(true);
    await api.patch('/users/me', { name: name || undefined, email: email || undefined });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    if (isOnboarding) window.location.href = '/me';
  }

  return (
    <div className="max-w-sm">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1">
        {isOnboarding ? 'Complete your profile' : 'Profile'}
      </h1>
      {isOnboarding && (
        <p className="text-zinc-500 text-sm mb-6">Add your name so venues know who's booking.</p>
      )}
      <div className="space-y-4 mt-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="w-full px-3 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Email <span className="text-zinc-400 font-normal">(for invoice)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-3 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
        >
          {loading ? 'Saving…' : saved ? 'Saved!' : 'Save profile'}
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return <Suspense><ProfileForm /></Suspense>;
}
