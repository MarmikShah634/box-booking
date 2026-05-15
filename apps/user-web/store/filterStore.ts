import { create } from 'zustand'

export type SortOption = 'recommended' | 'price_asc' | 'price_desc' | 'rating_desc'
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

interface FilterState {
  minPrice: number
  maxPrice: number
  date: string
  timeOfDay: TimeOfDay[]
  amenities: string[]
  sort: SortOption
  page: number

  setMinPrice: (v: number) => void
  setMaxPrice: (v: number) => void
  setDate: (v: string) => void
  toggleTimeOfDay: (v: TimeOfDay) => void
  toggleAmenity: (v: string) => void
  setSort: (v: SortOption) => void
  setPage: (v: number) => void
  reset: () => void
}

const DEFAULT_STATE = {
  minPrice: 0,
  maxPrice: 10000,
  date: '',
  timeOfDay: [] as TimeOfDay[],
  amenities: [] as string[],
  sort: 'recommended' as SortOption,
  page: 1,
}

export const useFilterStore = create<FilterState>()((set) => ({
  ...DEFAULT_STATE,

  setMinPrice: (v) => set({ minPrice: v, page: 1 }),
  setMaxPrice: (v) => set({ maxPrice: v, page: 1 }),
  setDate: (v) => set({ date: v, page: 1 }),
  toggleTimeOfDay: (v) =>
    set((s) => ({
      timeOfDay: s.timeOfDay.includes(v)
        ? s.timeOfDay.filter((t) => t !== v)
        : [...s.timeOfDay, v],
      page: 1,
    })),
  toggleAmenity: (v) =>
    set((s) => ({
      amenities: s.amenities.includes(v)
        ? s.amenities.filter((a) => a !== v)
        : [...s.amenities, v],
      page: 1,
    })),
  setSort: (v) => set({ sort: v, page: 1 }),
  setPage: (v) => set({ page: v }),
  reset: () => set(DEFAULT_STATE),
}))
