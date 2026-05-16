import { PricingService } from './pricing.service';
import type { BoxPricingInput } from './pricing.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeService(): PricingService {
  return new PricingService();
}

/**
 * IST date for a specific known day.
 * 2026-06-01 is a Monday (WEEKDAY).
 * 2026-06-06 is a Saturday (WEEKEND).
 * 2026-06-07 is a Sunday (WEEKEND).
 *
 * istDateToUtcMidnight: UTC midnight = IST date 00:00 - 5h30m offset
 * So 2026-06-01 00:00 IST = 2026-05-31 18:30:00 UTC
 */
function istMidnightUtc(isoDate: string): Date {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - IST_OFFSET_MS);
}

// Monday 2026-06-01
const MONDAY_UTC = istMidnightUtc('2026-06-01');
// Saturday 2026-06-06
const SATURDAY_UTC = istMidnightUtc('2026-06-06');
// Sunday 2026-06-07
const SUNDAY_UTC = istMidnightUtc('2026-06-07');

function makeBox(overrides: Partial<BoxPricingInput> = {}): BoxPricingInput {
  return {
    defaultHourlyPrice: 100000,
    pricingRules: [],
    openingHour: 6,
    closingHour: 22,
    ...overrides,
  };
}

// ── computeSlotPrice ──────────────────────────────────────────────────────────

describe('PricingService.computeSlotPrice', () => {
  let svc: PricingService;

  beforeEach(() => {
    svc = makeService();
  });

  it('returns defaultHourlyPrice as total when no pricing rules match (weekday)', () => {
    const box = makeBox({ defaultHourlyPrice: 100000, pricingRules: [] });

    const result = svc.computeSlotPrice(box, MONDAY_UTC, 10, 30);

    expect(result.total).toBe(100000);
  });

  it('returns defaultHourlyPrice as total when no pricing rules match (weekend)', () => {
    const box = makeBox({ defaultHourlyPrice: 150000, pricingRules: [] });

    const result = svc.computeSlotPrice(box, SATURDAY_UTC, 10, 30);

    expect(result.total).toBe(150000);
  });

  it('uses TIER rule price when a matching WEEKDAY rule exists', () => {
    const box = makeBox({
      defaultHourlyPrice: 100000,
      pricingRules: [{ dayType: 'WEEKDAY', startHour: 9, endHour: 18, price: 80000 }],
    });

    const result = svc.computeSlotPrice(box, MONDAY_UTC, 10, 30);

    expect(result.total).toBe(80000);
    expect(result.breakdown[0].ruleApplied).toBe('TIER');
  });

  it('uses TIER rule price when a matching WEEKEND rule exists', () => {
    const box = makeBox({
      defaultHourlyPrice: 100000,
      pricingRules: [{ dayType: 'WEEKEND', startHour: 9, endHour: 18, price: 120000 }],
    });

    const result = svc.computeSlotPrice(box, SATURDAY_UTC, 10, 30);

    expect(result.total).toBe(120000);
    expect(result.breakdown[0].ruleApplied).toBe('TIER');
  });

  it('applies DEFAULT rule when slot hour is outside pricing rule range', () => {
    const box = makeBox({
      defaultHourlyPrice: 100000,
      pricingRules: [{ dayType: 'WEEKDAY', startHour: 9, endHour: 12, price: 80000 }],
    });

    // hour 14 is outside 9–12
    const result = svc.computeSlotPrice(box, MONDAY_UTC, 14, 30);

    expect(result.breakdown[0].ruleApplied).toBe('DEFAULT');
    expect(result.total).toBe(100000);
  });

  it('returns sum of hourly prices for multi-hour booking', () => {
    const box = makeBox({ defaultHourlyPrice: 100000, pricingRules: [] });

    const result = svc.computeSlotPrice(box, MONDAY_UTC, 10, 30, 3);

    expect(result.total).toBe(300000);
    expect(result.breakdown).toHaveLength(3);
  });

  it('computes advance amount using advancePercent', () => {
    const box = makeBox({ defaultHourlyPrice: 100000 });

    const result = svc.computeSlotPrice(box, MONDAY_UTC, 10, 30);

    // advance = ceil(100000 * 30 / 100) = 30000
    expect(result.advance).toBe(30000);
  });

  it('ceils advance amount (not floors)', () => {
    const box = makeBox({ defaultHourlyPrice: 100001 });

    const result = svc.computeSlotPrice(box, MONDAY_UTC, 10, 33);

    // 100001 * 33 / 100 = 33000.33 => ceil => 33001
    expect(result.advance).toBe(33001);
  });

  it('all prices are in paise (integers)', () => {
    const box = makeBox({ defaultHourlyPrice: 75000 });

    const result = svc.computeSlotPrice(box, MONDAY_UTC, 10, 30, 2);

    expect(Number.isInteger(result.total)).toBe(true);
    expect(Number.isInteger(result.advance)).toBe(true);
    expect(result.breakdown.every((b) => Number.isInteger(b.price))).toBe(true);
  });

  it('breakdown contains one entry per duration hour', () => {
    const box = makeBox();

    const result = svc.computeSlotPrice(box, MONDAY_UTC, 10, 30, 4);

    expect(result.breakdown).toHaveLength(4);
    expect(result.breakdown.map((b) => b.hour)).toEqual([10, 11, 12, 13]);
  });

  it('correctly identifies WEEKDAY for Monday', () => {
    const box = makeBox({ pricingRules: [] });

    const result = svc.computeSlotPrice(box, MONDAY_UTC, 10, 30);

    expect(result.breakdown[0].dayType).toBe('WEEKDAY');
  });

  it('correctly identifies WEEKEND for Saturday', () => {
    const box = makeBox({ pricingRules: [] });

    const result = svc.computeSlotPrice(box, SATURDAY_UTC, 10, 30);

    expect(result.breakdown[0].dayType).toBe('WEEKEND');
  });

  it('correctly identifies WEEKEND for Sunday', () => {
    const box = makeBox({ pricingRules: [] });

    const result = svc.computeSlotPrice(box, SUNDAY_UTC, 10, 30);

    expect(result.breakdown[0].dayType).toBe('WEEKEND');
  });

  it('does not apply WEEKDAY rule to a WEEKEND slot', () => {
    const box = makeBox({
      defaultHourlyPrice: 100000,
      pricingRules: [{ dayType: 'WEEKDAY', startHour: 9, endHour: 18, price: 80000 }],
    });

    const result = svc.computeSlotPrice(box, SATURDAY_UTC, 10, 30);

    expect(result.breakdown[0].ruleApplied).toBe('DEFAULT');
    expect(result.total).toBe(100000);
  });

  it('does not apply WEEKEND rule to a WEEKDAY slot', () => {
    const box = makeBox({
      defaultHourlyPrice: 100000,
      pricingRules: [{ dayType: 'WEEKEND', startHour: 9, endHour: 18, price: 120000 }],
    });

    const result = svc.computeSlotPrice(box, MONDAY_UTC, 10, 30);

    expect(result.breakdown[0].ruleApplied).toBe('DEFAULT');
    expect(result.total).toBe(100000);
  });

  it('rule endHour is exclusive (hour == endHour does not match)', () => {
    const box = makeBox({
      defaultHourlyPrice: 100000,
      pricingRules: [{ dayType: 'WEEKDAY', startHour: 9, endHour: 12, price: 80000 }],
    });

    // hour 12 is the endHour; should NOT match (exclusive)
    const result = svc.computeSlotPrice(box, MONDAY_UTC, 12, 30);

    expect(result.breakdown[0].ruleApplied).toBe('DEFAULT');
  });

  it('rule startHour is inclusive (hour == startHour matches)', () => {
    const box = makeBox({
      defaultHourlyPrice: 100000,
      pricingRules: [{ dayType: 'WEEKDAY', startHour: 9, endHour: 12, price: 80000 }],
    });

    const result = svc.computeSlotPrice(box, MONDAY_UTC, 9, 30);

    expect(result.breakdown[0].ruleApplied).toBe('TIER');
  });

  it('uses default price (durationHours = 1) when not specified', () => {
    const box = makeBox({ defaultHourlyPrice: 55000 });

    const result = svc.computeSlotPrice(box, MONDAY_UTC, 10, 30);

    expect(result.breakdown).toHaveLength(1);
    expect(result.total).toBe(55000);
  });
});

// ── validateFullCoverage ──────────────────────────────────────────────────────

describe('PricingService.validateFullCoverage', () => {
  let svc: PricingService;

  beforeEach(() => {
    svc = makeService();
  });

  it('returns valid=true when all hours are covered for both day types', () => {
    const rules = [
      { dayType: 'WEEKDAY' as const, startHour: 6, endHour: 22, price: 100000 },
      { dayType: 'WEEKEND' as const, startHour: 6, endHour: 22, price: 120000 },
    ];

    const result = svc.validateFullCoverage(rules, 6, 22);

    expect(result.valid).toBe(true);
    expect(result.missingHours).toHaveLength(0);
  });

  it('returns valid=false and lists missing hours when coverage is incomplete', () => {
    const rules = [
      { dayType: 'WEEKDAY' as const, startHour: 9, endHour: 22, price: 100000 },
      // WEEKEND not covered at all, WEEKDAY missing 6-8
    ];

    const result = svc.validateFullCoverage(rules, 6, 22);

    expect(result.valid).toBe(false);
    const missingWeekday = result.missingHours.filter((m) => m.dayType === 'WEEKDAY');
    expect(missingWeekday.map((m) => m.hour)).toEqual([6, 7, 8]);
  });

  it('returns valid=false and reports all hours as missing when no rules provided', () => {
    const result = svc.validateFullCoverage([], 6, 10);

    expect(result.valid).toBe(false);
    expect(result.missingHours).toHaveLength(8); // 4 hours x 2 day types
  });

  it('returns valid=true for empty range (openingHour === closingHour)', () => {
    const result = svc.validateFullCoverage([], 10, 10);

    expect(result.valid).toBe(true);
    expect(result.missingHours).toHaveLength(0);
  });
});
