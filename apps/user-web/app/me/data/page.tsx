'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function DataPage() {
  const [exportDone, setExportDone] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleExport() {
    await api.post('/users/me/data-export', {});
    setExportDone(true);
  }

  async function handleDelete() {
    setDeleteLoading(true);
    await api.post('/users/me/delete', { confirmation: 'DELETE' });
    setDeleteLoading(false);
    window.location.href = '/auth/login';
  }

  return (
    <div className="max-w-sm space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1">Data & privacy</h1>
        <p className="text-zinc-500 text-sm">Your data rights under DPDP Act 2023.</p>
      </div>

      <section className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
        <h2 className="font-semibold text-zinc-900 dark:text-white mb-2">Export my data</h2>
        <p className="text-zinc-500 text-sm mb-4">We'll email you a ZIP with all your data within a few minutes.</p>
        {exportDone ? (
          <p className="text-emerald-600 text-sm font-medium">Export requested — check your email.</p>
        ) : (
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium"
          >
            Request data export
          </button>
        )}
      </section>

      <section className="border border-red-200 dark:border-red-900 rounded-xl p-5">
        <h2 className="font-semibold text-red-700 dark:text-red-400 mb-2">Delete account</h2>
        <p className="text-zinc-500 text-sm mb-4">
          This will scrub your personal data 30 days after deletion. Booking history retained for compliance.
        </p>
        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Delete my account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-600 font-medium">Are you absolutely sure?</p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 border border-zinc-200 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
