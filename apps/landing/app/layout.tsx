import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BoxCricket — Book a cricket box in your city',
  description:
    'Find and book box cricket venues near you. Instant confirmation, transparent pricing, easy cancellation.',
  keywords: ['box cricket', 'cricket booking', 'turf booking', 'sports venue'],
  openGraph: {
    title: 'BoxCricket — Book a cricket box in your city',
    description: 'Find and book box cricket venues near you.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
