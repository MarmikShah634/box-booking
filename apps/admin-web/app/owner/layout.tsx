import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { template: '%s | BoxCricket Owner', default: 'Owner Portal | BoxCricket' },
}

export default function OwnerRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
