import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { Footer } from '@/components/layout/Footer'
import { CookieBanner } from '@/components/layout/CookieBanner'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'BoxCricket – Book Cricket Boxes Near You',
    template: '%s | BoxCricket',
  },
  description: 'Find and book premium box cricket venues across India. Real-time slot availability, instant confirmation, and hassle-free payments.',
  keywords: ['box cricket', 'cricket booking', 'cricket venue', 'book cricket'],
  authors: [{ name: 'BoxCricket' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'BoxCricket',
    title: 'BoxCricket – Book Cricket Boxes Near You',
    description: 'Find and book premium box cricket venues across India.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BoxCricket',
    description: 'Book premium cricket boxes across India.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex flex-col min-h-[100dvh]">
        <Header />
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
        <Footer />
        <MobileNav />
        <CookieBanner />
        <Toaster />
      </body>
    </html>
  )
}
