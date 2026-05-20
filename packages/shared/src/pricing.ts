import { isDayWeekend } from './time';

export type DayType = 'WEEKDAY' | 'WEEKEND';

export interface PricingRuleSlim {
  dayType: DayType;
  startHour: number;
  endHour: number;
  price: number;
}

export interface BoxSlim {
  defaultHourlyPrice: number;
  pricingRules: PricingRuleSlim[];
  openingHour: number;
  closingHour: number;
}

export interface PriceBreakdownItem {
  hour: number;
  dayType: DayType;
  ruleApplied: 'TIER' | 'DEFAULT';
  price: number;
}

export interface SlotPriceResult {
  total: number;
  advance: number;
  breakdown: PriceBreakdownItem[];
}

export function computeSlotPrice(
  box: BoxSlim,
  slotDate: Date,
  slotHour: number,
  advancePercent: number,
  durationHours: number = 1,
): SlotPriceResult {
  if (slotHour < box.openingHour) {
    throw new Error(`Slot hour ${slotHour} is before opening hour ${box.openingHour}`);
  }
  if (slotHour + durationHours > box.closingHour) {
    throw new Error(`Slot ends after closing hour ${box.closingHour}`);
  }

  const dayType: DayType = isDayWeekend(slotDate) ? 'WEEKEND' : 'WEEKDAY';
  const breakdown: PriceBreakdownItem[] = [];
  let total = 0;

  for (let h = slotHour; h < slotHour + durationHours; h++) {
    const rule = box.pricingRules.find(
      (r) => r.dayType === dayType && r.startHour <= h && r.endHour > h,
    );
    const price = rule ? rule.price : box.defaultHourlyPrice;
    breakdown.push({
      hour: h,
      dayType,
      ruleApplied: rule ? 'TIER' : 'DEFAULT',
      price,
    });
    total += price;
  }

  const advance = Math.ceil((total * advancePercent) / 100);

  return { total, advance, breakdown };
}

export function validatePricingRules(
  rules: PricingRuleSlim[],
  openingHour: number,
  closingHour: number,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const dayType of ['WEEKDAY', 'WEEKEND'] as DayType[]) {
    const dayRules = rules
      .filter((r) => r.dayType === dayType)
      .sort((a, b) => a.startHour - b.startHour);

    if (dayRules.length === 0) {
      errors.push(`No pricing rules for ${dayType}`);
      continue;
    }

    // Check coverage
    let cursor = openingHour;
    for (const rule of dayRules) {
      if (rule.startHour > cursor) {
        errors.push(`${dayType}: gap between hour ${cursor} and ${rule.startHour}`);
      }
      if (rule.startHour < cursor) {
        errors.push(`${dayType}: overlap at hour ${rule.startHour}`);
      }
      if (rule.endHour <= rule.startHour) {
        errors.push(`${dayType}: rule end hour must be > start hour`);
      }
      if (rule.price < 10000) {
        errors.push(`${dayType}: price must be at least ₹100 (10000 paise)`);
      }
      cursor = rule.endHour;
    }

    if (cursor < closingHour) {
      errors.push(`${dayType}: rules don't cover until closing hour ${closingHour}`);
    }
    if (cursor > closingHour) {
      errors.push(`${dayType}: rules extend beyond closing hour ${closingHour}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
