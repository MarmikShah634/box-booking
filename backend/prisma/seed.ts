import { PrismaClient, KycStatus, VenueStatus, SurfaceType, DayType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ── Super-admin ──────────────────────────────────────────────────────────────
  const adminEmail = process.env.SUPER_ADMIN_EMAIL;
  const adminHash = process.env.SUPER_ADMIN_PASSWORD_HASH;
  const adminName = process.env.SUPER_ADMIN_NAME ?? 'Platform Admin';

  if (!adminEmail || !adminHash) {
    throw new Error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD_HASH must be set in env');
  }

  await prisma.superAdmin.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash: adminHash, name: adminName },
  });
  console.log(`✓ SuperAdmin ${adminEmail}`);

  // ── Subscription plans ───────────────────────────────────────────────────────
  await prisma.subscriptionPlan.upsert({
    where: { code: 'BASIC' },
    update: {},
    create: {
      code: 'BASIC',
      name: 'Basic',
      priceMonthly: 149900, // ₹1499 in paise
      maxVenues: 1,
      maxBoxesPerVenue: 4,
      features: ['1 venue', 'Up to 4 boxes', 'SMS notifications', 'Invoice generation'],
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { code: 'PRO' },
    update: {},
    create: {
      code: 'PRO',
      name: 'Pro',
      priceMonthly: 399900, // ₹3999 in paise
      maxVenues: -1,
      maxBoxesPerVenue: -1,
      features: ['Unlimited venues', 'Unlimited boxes', 'Priority support', 'Advanced analytics'],
    },
  });
  console.log('✓ Subscription plans');

  // ── Platform settings singleton ──────────────────────────────────────────────
  await prisma.platformSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      slotHoldTtlMinutes: parseInt(process.env.SLOT_HOLD_TTL_MINUTES ?? '8'),
      advancePercent: parseInt(process.env.ADVANCE_PERCENT ?? '50'),
      cancelFullRefundHours: parseInt(process.env.CANCEL_FULL_REFUND_HOURS ?? '24'),
      cancelHalfRefundHours: parseInt(process.env.CANCEL_HALF_REFUND_HOURS ?? '6'),
    },
  });
  console.log('✓ PlatformSettings');

  // ── Dev fixtures (non-production only) ───────────────────────────────────────
  if (process.env.NODE_ENV === 'production') {
    console.log('✓ Skipped dev fixtures (production)');
    return;
  }

  const demoOwner = await prisma.owner.upsert({
    where: { email: 'demo-owner@boxcricket.dev' },
    update: {},
    create: {
      email: 'demo-owner@boxcricket.dev',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$demo', // placeholder — not a real hash
      name: 'Demo Owner',
      phone: '+919876543210',
      emailVerifiedAt: new Date(),
      kycStatus: KycStatus.VERIFIED,
      gstin: '29AABCU9603R1ZP',
      pan: 'AABCU9603R',
      bankAccountHolderName: 'Demo Owner',
      bankIfsc: 'HDFC0001234',
    },
  });
  console.log(`✓ Demo owner: ${demoOwner.email}`);

  const venue1 = await prisma.venue.upsert({
    where: { slug: 'greenfield-arena-bangalore-001' },
    update: {},
    create: {
      ownerId: demoOwner.id,
      slug: 'greenfield-arena-bangalore-001',
      name: 'Greenfield Arena',
      description: 'Premium box cricket venue with turf pitches',
      address: '123 MG Road, Bangalore',
      city: 'bangalore',
      state: 'Karnataka',
      pincode: '560001',
      geoLat: 12.9716,
      geoLng: 77.5946,
      amenities: ['parking', 'floodlight', 'washroom', 'drinking_water'],
      status: VenueStatus.APPROVED,
      approvedAt: new Date(),
    },
  });

  const venue2 = await prisma.venue.upsert({
    where: { slug: 'cricket-hub-bangalore-002' },
    update: {},
    create: {
      ownerId: demoOwner.id,
      slug: 'cricket-hub-bangalore-002',
      name: 'Cricket Hub',
      description: 'Indoor cricket facility with mat pitches',
      address: '45 Koramangala, Bangalore',
      city: 'bangalore',
      state: 'Karnataka',
      pincode: '560034',
      amenities: ['parking', 'washroom', 'cafeteria'],
      status: VenueStatus.APPROVED,
      approvedAt: new Date(),
    },
  });
  console.log('✓ Demo venues');

  // Boxes for venue1 (3 boxes)
  const boxes: { id: string; openingHour: number; closingHour: number }[] = [];
  for (let i = 1; i <= 3; i++) {
    const box = await prisma.box.upsert({
      where: { id: `demo-box-v1-${i}` },
      update: {},
      create: {
        id: `demo-box-v1-${i}`,
        venueId: venue1.id,
        name: `Box ${String.fromCharCode(64 + i)}`,
        surfaceType: SurfaceType.TURF,
        defaultHourlyPrice: 80000, // ₹800
        openingHour: 6,
        closingHour: 23,
      },
    });
    boxes.push(box);
  }

  // Boxes for venue2 (2 boxes)
  for (let i = 1; i <= 2; i++) {
    const box = await prisma.box.upsert({
      where: { id: `demo-box-v2-${i}` },
      update: {},
      create: {
        id: `demo-box-v2-${i}`,
        venueId: venue2.id,
        name: `Box ${String.fromCharCode(64 + i)}`,
        surfaceType: SurfaceType.MAT,
        defaultHourlyPrice: 60000, // ₹600
        openingHour: 8,
        closingHour: 22,
      },
    });
    boxes.push(box);
  }
  console.log('✓ Demo boxes (5 total)');

  // Pricing rules for each box
  for (const box of boxes) {
    const midHour = Math.floor((box.openingHour + box.closingHour) / 2);
    // Peak: 17:00-23:00 weekday, off-peak rest
    await prisma.pricingRule.deleteMany({ where: { boxId: box.id } });
    await prisma.pricingRule.createMany({
      data: [
        // Weekday: off-peak morning
        { boxId: box.id, dayType: DayType.WEEKDAY, startHour: box.openingHour, endHour: 17, price: 70000 },
        // Weekday: peak evening
        { boxId: box.id, dayType: DayType.WEEKDAY, startHour: 17, endHour: box.closingHour, price: 100000 },
        // Weekend: higher all-day
        { boxId: box.id, dayType: DayType.WEEKEND, startHour: box.openingHour, endHour: box.closingHour, price: 120000 },
      ],
    });
  }
  console.log('✓ Pricing rules');

  // Demo user
  await prisma.user.upsert({
    where: { phone: '+919000000001' },
    update: {},
    create: {
      phone: '+919000000001',
      name: 'Demo Player',
      email: 'demo-player@boxcricket.dev',
    },
  });
  console.log('✓ Demo user');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
