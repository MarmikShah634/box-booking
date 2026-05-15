export function paiseToRupees(paise: number): string {
  return '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
