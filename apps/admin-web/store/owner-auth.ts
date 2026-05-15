'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Owner } from '@/types'

interface OwnerAuthState {
  owner: Owner | null
  stepUpToken: string | null
  setOwner: (owner: Owner | null) => void
  setStepUpToken: (token: string | null) => void
  logout: () => void
}

export const useOwnerAuthStore = create<OwnerAuthState>()(
  persist(
    (set) => ({
      owner: null,
      stepUpToken: null,
      setOwner: (owner) => set({ owner }),
      setStepUpToken: (stepUpToken) => set({ stepUpToken }),
      logout: () => set({ owner: null, stepUpToken: null }),
    }),
    {
      name: 'owner-auth',
      partialize: (state) => ({ owner: state.owner }),
    },
  ),
)
