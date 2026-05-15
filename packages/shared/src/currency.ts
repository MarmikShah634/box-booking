export function paiseToRupees(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function halfRoundedUp(paise: number): number {
  return Math.ceil(paise / 2);
}

export function advanceAmount(total: number, advancePercent: number): number {
  return Math.ceil((total * advancePercent) / 100);
}
