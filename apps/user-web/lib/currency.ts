/**
 * Convert paise (integer) to formatted rupee string.
 * e.g. 150000 → "₹1,500"
 */
export function paiseToRupees(paise: number): string {
  const rupees = paise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees)
}

/**
 * Convert rupees to paise.
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

/**
 * Format a paise value as a short rupee string without symbol.
 * e.g. 150000 → "1,500"
 */
export function paiseToRupeesPlain(paise: number): string {
  const rupees = paise / 100
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(rupees)
}
