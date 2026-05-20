import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Convert paise to rupees string */
export function formatRupees(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(paise / 100)
}

/** Format a number as rupees from paise */
export function paiseToRupees(paise: number): number {
  return paise / 100
}

/** Convert rupees to paise */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}
