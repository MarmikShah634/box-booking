import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';

export default async function MeLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('refresh_user');
  if (!token) redirect('/auth/login?next=/me');

  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-8">{children}</main>
      <MobileNav />
    </div>
  );
}
