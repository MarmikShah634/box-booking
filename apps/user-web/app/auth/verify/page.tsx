'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OtpInput } from '@/components/auth/OtpInput';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errorMessages';

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const phone = params.get('phone') ?? '';
  const next = params.get('next') ?? '/me';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  async function handleSubmit() {
    if (otp.length !== 6) return;
    setLoading(true);
    setError('');
    const res = await api.post<{ accessToken: string; user: { name: string | null } }>(
      '/auth/user/verify-otp',
      { phone, otp },
    );
    setLoading(false);
    if (!res.ok) {
      setError(getErrorMessage(res.error.error));
      return;
    }
    if (!res.data.user.name) {
      router.replace('/me/profile?onboarding=1');
    } else {
      router.replace(next);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    await api.post('/auth/user/send-otp', { phone });
    setResendCooldown(30);
    const timer = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
            Enter OTP
          </h1>
          <p className="text-zinc-500 text-sm">
            Sent to <span className="font-medium text-zinc-700 dark:text-zinc-300">{phone}</span>
          </p>
        </div>

        <OtpInput value={otp} onChange={setOtp} />

        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={otp.length !== 6 || loading}
          className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
        >
          {loading ? 'Verifying…' : 'Verify OTP'}
        </button>

        <button
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="mt-4 w-full py-2 text-sm text-zinc-500 hover:text-zinc-700 disabled:opacity-50 transition-colors"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
        </button>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
