import { Injectable } from '@nestjs/common';

export type DayType = 'WEEKDAY' | 'WEEKEND';

export interface PricingRuleInput {
  dayType: DayType;
  startHour: number;
  endHour: number;
  price: number;
}

export interface BoxPricingInput {
  defaultHourlyPrice: number;
  pricingRules: PricingRuleInput[];
  openingHour: number;
  closingHour: number;
}

export interface SlotBreakdown {
  hour: number;
  dayType: DayType;
  ruleApplied: 'TIER' | 'DEFAULT';
  price: number;
}

export interface PricingResult {
  total: number;
  advance: number;
  breakdown: SlotBreakdown[];
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getDayTypeForIstDate(slotDate: Date, slotHour: number): DayType {
  // Compute IST datetime for the slot
  const istMs = slotDate.getTime() + IST_OFFSET_MS + slotHour * 60 * 60 * 1000;
  const d = new Date(istMs);
  const day = d.getUTCDay(); // 0=Sun, 6=Sat
  return day === 0 || day === 6 ? 'WEEKEND' : 'WEEKDAY';
}

@Injectable()
export class PricingService {
  computeSlotPrice(
    box: BoxPricingInput,
    slotDate: Date,
    slotHour: number,
    advancePercent: number,
    durationHours = 1,
  ): PricingResult {
    const breakdown: SlotBreakdown[] = [];

    for (let h = slotHour; h < slotHour + durationHours; h++) {
      const dayType = getDayTypeForIstDate(slotDate, h);

      // Find matching pricing rule
      const rule = box.pricingRules.find(
        (r) => r.dayType === dayType && r.startHour <= h && h < r.endHour,
      );

      breakdown.push({
        hour: h,
        dayType,
        ruleApplied: rule ? 'TIER' : 'DEFAULT',
        price: rule ? rule.price : box.defaultHourlyPrice,
      });
    }

    const total = breakdown.reduce((sum, s) => sum + s.price, 0);
    const advance = Math.ceil((total * advancePercent) / 100);

    return { total, advance, breakdown };
  }

  /**
   * Validate that pricing rules provide full coverage for all hours
   * [openingHour, closingHour) for both WEEKDAY and WEEKEND.
   */
  validateFullCoverage(
    rules: PricingRuleInput[],
    openingHour: number,
    closingHour: number,
  ): { valid: boolean; missingHours: Array<{ hour: number; dayType: DayType }> } {
    const dayTypes: DayType[] = ['WEEKDAY', 'WEEKEND'];
    const missingHours: Array<{ hour: number; dayType: DayType }> = [];

    for (const dayType of dayTypes) {
      for (let h = openingHour; h < closingHour; h++) {
        const covered = rules.some(
          (r) => r.dayType === dayType && r.startHour <= h && h < r.endHour,
        );
        if (!covered) {
          missingHours.push({ hour: h, dayType });
        }
      }
    }

    return { valid: missingHours.length === 0, missingHours };
  }
}
