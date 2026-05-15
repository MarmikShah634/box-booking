'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SuperAdmin } from '@/types'

interface SuperAdminAuthState {
  admin: SuperAdmin | null
  setAdmin: (admin: SuperAdmin | null) => void
  logout: () => void
}

export const useSuperAdminAuthStore = create<SuperAdminAuthState>()(
  persist(
    (set) => ({
      admin: null,
      setAdmin: (admin) => set({ admin }),
      logout: () => set({ admin: null }),
    }),
    {
      name: 'super-admin-auth',
      partialize: (state) => ({ admin: state.admin }),
    },
  ),
)
