'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function OwnerShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </div>
  )
}
