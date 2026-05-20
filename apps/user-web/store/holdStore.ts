import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Hold {
  id: string
  boxId: string
  boxName: string
  venueName: string
  venueAddress: string
  date: string
  startTime: string
  endTime: string
  slotLabel: string
  amountPaise: number
  advancePaise: number
  expiresAt: string // ISO string
}

interface HoldState {
  hold: Hold | null
  setHold: (hold: Hold) => void
  clearHold: () => void
  isExpired: () => boolean
  secondsRemaining: () => number
}

export const useHoldStore = create<HoldState>()(
  persist(
    (set, get) => ({
      hold: null,
      setHold: (hold) => set({ hold }),
      clearHold: () => set({ hold: null }),
      isExpired: () => {
        const { hold } = get()
        if (!hold) return true
        return new Date(hold.expiresAt).getTime() <= Date.now()
      },
      secondsRemaining: () => {
        const { hold } = get()
        if (!hold) return 0
        const diff = Math.floor((new Date(hold.expiresAt).getTime() - Date.now()) / 1000)
        return Math.max(0, diff)
      },
    }),
    {
      name: 'box-hold',
    },
  ),
)
