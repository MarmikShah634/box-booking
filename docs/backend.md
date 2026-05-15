# Backend — Implementation Spec

**App:** `apps/api`
**Framework:** NestJS 10+ (Node 20 LTS)
**Language:** TypeScript (strict)
**DB:** PostgreSQL 16
**ORM:** Prisma 5+
**Queue:** BullMQ on Redis 7
**Logger:** Pino (`nestjs-pino`)
**Validation:** Zod (shared package) wrapped in custom NestJS pipe
**Auth:** JWT (RS256), Argon2id for password + refresh hashing
**Payments:** Razorpay (per-owner keys)
**SMS:** MSG91
**Email:** Resend
**File storage:** Cloudflare R2 (S3-compatible)

This document is the complete spec to build the backend without any further input. Each section is independently executable.

---

## 1. Project layout

```
apps/api/
├── src/
│   ├── main.ts                       # bootstrap, helmet, cors, global pipes, swagger
│   ├── app.module.ts                 # root module wiring all feature modules
│   ├── config/
│   │   ├── configuration.ts          # typed env loader
│   │   ├── env.schema.ts             # Zod schema for env validation
│   │   └── feature-flags.ts          # PLATFORM_FREE_MODE, etc.
│   ├── common/
│   │   ├── guards/                   # JwtAuthGuard, RolesGuard, OwnerOwnsResourceGuard
│   │   ├── decorators/               # @CurrentUser, @CurrentOwner, @Roles, @Public
│   │   ├── interceptors/             # LoggingInterceptor, TimeoutInterceptor
│   │   ├── filters/                  # GlobalExceptionFilter
│   │   ├── pipes/                    # ZodValidationPipe
│   │   ├── middleware/               # RequestIdMiddleware
│   │   └── utils/                    # money.ts (paise helpers), time.ts (IST helpers), id.ts (cuid)
│   ├── auth/
│   │   ├── user-auth.module.ts
│   │   ├── user-auth.controller.ts
│   │   ├── user-auth.service.ts
│   │   ├── owner-auth.module.ts
│   │   ├── owner-auth.controller.ts
│   │   ├── owner-auth.service.ts
│   │   ├── super-admin-auth.module.ts
│   │   ├── super-admin-auth.controller.ts
│   │   ├── super-admin-auth.service.ts
│   │   ├── jwt.strategy.ts           # JwtStrategy with passport-jwt
│   │   ├── google.strategy.ts        # for owner Google OAuth
│   │   └── token.service.ts          # issue/verify/refresh
│   ├── users/                        # player CRUD + profile
│   ├── owners/                       # owner CRUD + KYC + Razorpay key mgmt
│   ├── venues/                       # venue CRUD + listing + moderation
│   ├── boxes/                        # box CRUD + photos
│   ├── pricing/                      # pricing rules CRUD + computeSlotPrice
│   ├── blackouts/                    # blackout CRUD
│   ├── slots/                        # availability query (the booking grid)
│   ├── bookings/                     # hold + initiate + confirm + cancel + list
│   ├── payments/
│   │   ├── razorpay.service.ts       # uses per-owner keys
│   │   └── razorpay.types.ts
│   ├── webhooks/
│   │   ├── razorpay.controller.ts    # signature verification + idempotent processing
│   │   └── webhook-event.service.ts
│   ├── reviews/                      # post-completion review CRUD + owner reply
│   ├── invoices/                     # invoice number sequence + PDF generation + R2 store
│   ├── subscriptions/                # subscription module (gated off in free mode)
│   ├── super-admin/                  # moderation + owner mgmt + settings + audit
│   ├── audit/                        # AuditLog service (used by all modules)
│   ├── platform-settings/            # singleton settings, read-through cache
│   ├── notifications/
│   │   ├── sms.service.ts            # MSG91
│   │   ├── email.service.ts          # Resend
│   │   └── notifications.module.ts
│   ├── storage/
│   │   ├── r2.service.ts             # presigned URLs, deletion
│   │   └── storage.module.ts
│   ├── jobs/
│   │   ├── queues.module.ts          # registers all BullMQ queues
│   │   ├── hold-sweeper.processor.ts
│   │   ├── booking-completer.processor.ts
│   │   ├── refund-processor.processor.ts
│   │   ├── invoice-generator.processor.ts
│   │   ├── notification-dispatcher.processor.ts
│   │   └── audit-archiver.processor.ts
│   ├── crypto/
│   │   ├── encryption.service.ts     # AES-256-GCM for owner secrets
│   │   └── hash.service.ts           # argon2id wrapper
│   ├── health/
│   │   └── health.controller.ts      # GET /health (db, redis, r2 reachability)
│   └── metrics/
│       └── metrics.controller.ts     # GET /metrics (prom-client)
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── Dockerfile
├── package.json
├── tsconfig.json
├── nest-cli.json
└── jest.config.ts
```

---

## 2. Environment variables

All required unless marked optional. Validated at boot via Zod schema in `config/env.schema.ts`. Boot fails on missing / invalid env.

```
# Server
NODE_ENV=development | staging | production
PORT=3001
PUBLIC_API_URL=https://api.example.com
PUBLIC_USER_WEB_URL=https://example.com
PUBLIC_ADMIN_WEB_URL=https://admin.example.com
CORS_ALLOWED_ORIGINS=https://example.com,https://admin.example.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/boxcricket
DATABASE_POOL_MAX=20

# Redis (BullMQ + rate limit)
REDIS_URL=rediss://default:pass@host:6379

# Crypto
JWT_PRIVATE_KEY_BASE64=...           # RSA private key, base64 encoded
JWT_PUBLIC_KEY_BASE64=...            # RSA public key, base64 encoded
JWT_ACCESS_TTL_SECONDS=900           # 15 min
JWT_REFRESH_TTL_SECONDS=2592000      # 30 days
ENCRYPTION_KEY_HEX=...               # 64 hex chars (32 bytes), for AES-256-GCM
ARGON2_MEMORY_KB=65536
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=1

# MSG91
MSG91_AUTH_KEY=...
MSG91_SENDER_ID=BOXCRK
MSG91_OTP_TEMPLATE_ID=...            # DLT template
MSG91_BOOKING_CONFIRM_TEMPLATE_ID=...
MSG91_REFUND_TEMPLATE_ID=...

# Resend
RESEND_API_KEY=...
RESEND_FROM=no-reply@example.com
RESEND_REPLY_TO=support@example.com  # optional

# Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=boxcricket-prod
R2_PUBLIC_BASE_URL=https://cdn.example.com   # via R2 custom domain
R2_PRESIGN_TTL_SECONDS=3600

# Razorpay (platform-level, only used for super-admin's subscription PG when enabled)
RAZORPAY_PLATFORM_KEY_ID=...
RAZORPAY_PLATFORM_KEY_SECRET=...
RAZORPAY_PLATFORM_WEBHOOK_SECRET=...

# Free mode (subscription bypass)
PLATFORM_FREE_MODE=true              # global kill switch
PLATFORM_FREE_MODE_REASON=Pre-launch # surfaced in admin UI when active

# Super-admin seed
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD_HASH=...        # argon2id hash, generate via CLI script
SUPER_ADMIN_NAME=Platform Admin

# Owner OAuth
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_CALLBACK_URL=https://admin.example.com/auth/google/callback

# Booking config (defaults; can be overridden in PlatformSettings DB row)
SLOT_HOLD_TTL_MINUTES=8
ADVANCE_PERCENT=50
CANCEL_FULL_REFUND_HOURS=24
CANCEL_HALF_REFUND_HOURS=6

# Observability
LOG_LEVEL=info
LOKI_PUSH_URL=http://loki:3100/loki/api/v1/push  # optional, ship via Promtail instead in prod
PROMETHEUS_METRICS_ENABLED=true

# Rate limiting
RATE_LIMIT_OTP_PER_PHONE_PER_15MIN=3
RATE_LIMIT_OTP_PER_IP_PER_HOUR=10
RATE_LIMIT_API_PER_USER_PER_MIN=120
RATE_LIMIT_API_PER_IP_PER_MIN=300
```

---

## 3. Database schema (Prisma)

File: `packages/db/prisma/schema.prisma`. All FK constraints are explicit. All money fields are `Int` (paise). All timestamps are `DateTime` UTC.

```prisma
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js"; previewFeatures = ["fullTextSearchPostgres"] }

// ============ User (player) ============
model User {
  id           String   @id @default(cuid())
  phone        String   @unique          // E.164, e.g. +919999999999
  name         String?
  email        String?
  isBlocked    Boolean  @default(false)
  blockReason  String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  bookings     Booking[]
  reviews      Review[]
  refreshTokens UserRefreshToken[]
  @@index([phone])
}

model UserRefreshToken {
  id        String   @id @default(cuid())
  userId    String
  tokenHash String   @unique           // argon2id hash
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}

// ============ Owner ============
enum KycStatus { PENDING SUBMITTED VERIFIED REJECTED }
enum SubscriptionStatus { ACTIVE PAST_DUE CANCELLED FREE_OVERRIDE }

model Owner {
  id                          String   @id @default(cuid())
  email                       String   @unique
  passwordHash                String?                       // null if Google-only
  googleSub                   String?  @unique              // null if not linked
  name                        String
  phone                       String
  emailVerifiedAt             DateTime?
  kycStatus                   KycStatus @default(PENDING)
  gstin                       String?
  pan                         String?
  bankAccountHolderName       String?
  bankAccountNumberEnc        String?                       // AES-256-GCM
  bankIfsc                    String?
  razorpayKeyId               String?
  razorpayKeySecretEnc        String?                       // AES-256-GCM
  razorpayWebhookSecretEnc    String?                       // AES-256-GCM
  subscriptionStatus          SubscriptionStatus @default(ACTIVE)
  subscriptionOverrideUntil   DateTime?                     // super-admin grant
  lastInvoiceSeq              Int     @default(0)           // monotonic per owner
  isSuspended                 Boolean @default(false)
  suspendReason               String?
  createdAt                   DateTime @default(now())
  updatedAt                   DateTime @updatedAt
  venues                      Venue[]
  bookings                    Booking[]
  refreshTokens               OwnerRefreshToken[]
  subscriptions               Subscription[]
  @@index([email])
}

model OwnerRefreshToken {
  id        String   @id @default(cuid())
  ownerId   String
  tokenHash String   @unique
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())
  owner     Owner    @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  @@index([ownerId])
}

// ============ Super-admin ============
model SuperAdmin {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  totpSecret   String?                  // future 2FA
  lastLoginAt  DateTime?
  createdAt    DateTime @default(now())
  refreshTokens SuperAdminRefreshToken[]
}

model SuperAdminRefreshToken {
  id        String   @id @default(cuid())
  adminId   String
  tokenHash String   @unique
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())
  admin     SuperAdmin @relation(fields: [adminId], references: [id], onDelete: Cascade)
}

// ============ Venue ============
enum VenueStatus { DRAFT PENDING APPROVED REJECTED SUSPENDED }

model Venue {
  id            String   @id @default(cuid())
  ownerId       String
  slug          String   @unique         // generated from name + city + short hash
  name          String
  description   String?
  address       String
  city          String                   // canonical city name (lowercase)
  state         String
  pincode       String
  geoLat        Float?
  geoLng        Float?
  amenities     String[]                 // e.g. ["parking","washroom","floodlight","cafeteria"]
  photos        String[]                 // R2 object keys
  status        VenueStatus @default(DRAFT)
  rejectionReason String?
  suspendReason String?
  approvedAt    DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  owner         Owner    @relation(fields: [ownerId], references: [id], onDelete: Restrict)
  boxes         Box[]
  reviews       Review[]
  @@index([city, status])
  @@index([ownerId])
}

// ============ Box ============
enum SurfaceType { TURF MAT CONCRETE OTHER }

model Box {
  id                  String   @id @default(cuid())
  venueId             String
  name                String                   // e.g. "Box A"
  surfaceType         SurfaceType @default(TURF)
  photos              String[]
  defaultHourlyPrice  Int                       // paise
  openingHour         Int                       // 0-23, e.g. 6
  closingHour         Int                       // 0-24, e.g. 24 (midnight)
  isActive            Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  venue               Venue    @relation(fields: [venueId], references: [id], onDelete: Cascade)
  pricingRules        PricingRule[]
  blackouts           Blackout[]
  bookings            Booking[]
  slotHolds           SlotHold[]
  @@index([venueId, isActive])
}

// ============ Pricing rules ============
enum DayType { WEEKDAY WEEKEND }

model PricingRule {
  id        String  @id @default(cuid())
  boxId     String
  dayType   DayType
  startHour Int                              // inclusive, 0-23
  endHour   Int                              // exclusive, 1-24
  price     Int                              // paise per hour
  box       Box     @relation(fields: [boxId], references: [id], onDelete: Cascade)
  @@index([boxId, dayType])
}

// ============ Blackouts ============
enum BlackoutType { ONE_OFF RECURRING_WEEKLY }

model Blackout {
  id       String       @id @default(cuid())
  boxId    String
  type     BlackoutType
  date     DateTime?                          // for ONE_OFF, midnight IST
  weekday  Int?                               // 0=Sun ... 6=Sat for RECURRING_WEEKLY
  reason   String?
  createdAt DateTime    @default(now())
  box      Box          @relation(fields: [boxId], references: [id], onDelete: Cascade)
  @@index([boxId, type])
}

// ============ Slot holds ============
model SlotHold {
  id        String   @id @default(cuid())
  boxId     String
  slotDate  DateTime                          // date-only, midnight IST stored as UTC
  slotHour  Int                               // 0-23
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  box       Box      @relation(fields: [boxId], references: [id], onDelete: Cascade)
  @@unique([boxId, slotDate, slotHour])      // one active hold per slot enforced via cleanup
  @@index([expiresAt])
}

// ============ Bookings ============
enum BookingStatus {
  PENDING_PAYMENT
  CONFIRMED
  COMPLETED
  CANCELLED
  REFUNDED
  NO_SHOW
  PAYMENT_FAILED
}

model Booking {
  id                          String   @id @default(cuid())
  boxId                       String
  venueId                     String
  ownerId                     String
  userId                      String
  slotDate                    DateTime                       // date-only
  slotHour                    Int
  durationHours               Int      @default(1)
  slotStartAt                 DateTime                       // computed UTC instant of slot start
  totalAmount                 Int                            // paise, snapshot at booking time
  advanceAmount               Int                            // paise, = ceil(totalAmount * advancePct)
  balanceAmount               Int                            // paise, = totalAmount - advanceAmount
  currency                    String   @default("INR")
  status                      BookingStatus @default(PENDING_PAYMENT)
  razorpayOrderId             String?  @unique
  razorpayPaymentId           String?  @unique
  razorpayRefundId            String?  @unique
  refundAmount                Int?
  refundProcessedAt           DateTime?
  cancellationPolicySnapshot  Json                          // {fullRefundHours, halfRefundHours}
  pricingSnapshot             Json                          // {breakdown: [...rules used], dayType}
  notes                       String?                       // owner-set notes (e.g. NO_SHOW reason)
  cancelledBy                 String?                       // 'USER' | 'OWNER' | 'SYSTEM' | 'SUPER_ADMIN'
  cancelledAt                 DateTime?
  createdAt                   DateTime @default(now())
  updatedAt                   DateTime @updatedAt
  box                         Box      @relation(fields: [boxId], references: [id], onDelete: Restrict)
  venue                       Venue    @relation(fields: [venueId], references: [id], onDelete: Restrict)
  owner                       Owner    @relation(fields: [ownerId], references: [id], onDelete: Restrict)
  user                        User     @relation(fields: [userId], references: [id], onDelete: Restrict)
  review                      Review?
  invoice                     Invoice?
  @@index([userId, status])
  @@index([ownerId, status, slotStartAt])
  @@index([slotStartAt])
}

// Partial unique index added via raw SQL migration (Prisma does not support partial unique on multi-col cleanly):
//   CREATE UNIQUE INDEX booking_active_slot_idx
//     ON "Booking" ("boxId","slotDate","slotHour")
//     WHERE status IN ('CONFIRMED','COMPLETED');

// ============ Reviews ============
model Review {
  id          String   @id @default(cuid())
  bookingId   String   @unique
  venueId     String
  userId      String
  rating      Int                              // 1-5
  text        String?
  ownerReply  String?
  ownerRepliedAt DateTime?
  createdAt   DateTime @default(now())
  booking     Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  venue       Venue    @relation(fields: [venueId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([venueId, createdAt])
}

// ============ Invoices ============
model Invoice {
  id              String   @id @default(cuid())
  bookingId       String   @unique
  ownerId         String
  invoiceNumber   String                                    // formatted: "INV-{ownerSlug}-{seq}"
  pdfR2Key        String
  cgst            Int
  sgst            Int
  taxableAmount   Int
  totalAmount     Int                                       // taxableAmount + cgst + sgst
  issuedAt        DateTime @default(now())
  emailedAt       DateTime?
  booking         Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  @@unique([ownerId, invoiceNumber])
}

// ============ Subscriptions ============
enum SubscriptionPlanCode { BASIC PRO }

model SubscriptionPlan {
  code        SubscriptionPlanCode @id
  name        String
  priceMonthly Int                                          // paise
  maxVenues   Int                                          // -1 for unlimited
  maxBoxesPerVenue Int
  features    String[]
}

model Subscription {
  id              String   @id @default(cuid())
  ownerId         String
  planCode        SubscriptionPlanCode
  periodStart     DateTime
  periodEnd       DateTime
  status          String                                   // 'ACTIVE','PAST_DUE','CANCELLED'
  lastPaymentId   String?
  createdAt       DateTime @default(now())
  owner           Owner    @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  @@index([ownerId])
}

// ============ Webhooks (idempotency) ============
model WebhookEvent {
  id          String   @id @default(cuid())
  provider    String                                       // 'razorpay'
  eventId     String                                       // razorpay event id
  eventType   String
  payloadHash String
  receivedAt  DateTime @default(now())
  processedAt DateTime?
  status      String                                       // 'RECEIVED','PROCESSED','FAILED'
  error       String?
  @@unique([provider, eventId])
}

// ============ Audit log ============
enum ActorType { USER OWNER SUPER_ADMIN SYSTEM }

model AuditLog {
  id         String    @id @default(cuid())
  actorType  ActorType
  actorId    String?
  action     String                                        // e.g. 'venue.approve'
  targetType String?
  targetId   String?
  metadata   Json?
  ip         String?
  userAgent  String?
  createdAt  DateTime  @default(now())
  @@index([createdAt])
  @@index([actorType, actorId])
  @@index([targetType, targetId])
}

// ============ Platform settings (singleton) ============
model PlatformSettings {
  id                       String @id @default("singleton")
  slotHoldTtlMinutes       Int    @default(8)
  advancePercent           Int    @default(50)
  cancelFullRefundHours    Int    @default(24)
  cancelHalfRefundHours    Int    @default(6)
  freeModeDbOverride       Boolean @default(false)        // env var still takes precedence
  freeModeReason           String?
  updatedAt                DateTime @updatedAt
  updatedBy                String?
}
```

### Raw SQL migration (after `prisma migrate dev`)

`packages/db/prisma/migrations/_partial_indexes/migration.sql`:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS booking_active_slot_idx
  ON "Booking" ("boxId","slotDate","slotHour")
  WHERE status IN ('CONFIRMED','COMPLETED');

CREATE INDEX IF NOT EXISTS booking_owner_created_idx
  ON "Booking" ("ownerId","createdAt" DESC);

CREATE INDEX IF NOT EXISTS slot_hold_active_idx
  ON "SlotHold" ("boxId","slotDate","slotHour")
  WHERE "expiresAt" > now();
```

### Seed script (`packages/db/prisma/seed.ts`)

Seeds:
- One `SuperAdmin` from env (`SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD_HASH`)
- `SubscriptionPlan` rows: BASIC (₹1499/mo, 1 venue, 4 boxes/venue), PRO (₹3999/mo, unlimited)
- `PlatformSettings` singleton with defaults
- In `NODE_ENV !== 'production'`: 1 demo Owner (verified), 2 Venues (APPROVED), 5 Boxes total, pricing rules, 1 demo User

---

## 4. Money & time conventions

- All money: integer paise. Helpers in `common/utils/money.ts`:
  - `paiseToRupees(p): string` → "₹1,200.50"
  - `rupeesToPaise(r): number`
  - `halfRoundedUp(p): number` → `Math.ceil(p/2)`
- All timestamps stored UTC. UI renders IST (`Asia/Kolkata`).
- `slotDate` is the IST calendar date stored as UTC midnight IST (i.e. previous day 18:30 UTC). Always use the `time.ts` helpers `istDateToUtcMidnight(date)` and `utcToIstDate(date)` — never raw `new Date()`.
- `slotStartAt` is the precise UTC instant the slot begins, used for indexing and tier-policy comparisons.

---

## 5. Auth subsystem

### 5.1 Token strategy

- **Access token:** JWT RS256, TTL 15 min. Claims: `sub`, `typ` ('user'|'owner'|'super_admin'), `jti`, `iat`, `exp`. Sent as `Authorization: Bearer <token>`.
- **Refresh token:** opaque random 256-bit, stored hashed (argon2id) in `*RefreshToken` table, TTL 30 days. Sent as httpOnly `Secure SameSite=Lax` cookie scoped to API origin.
- **Rotation:** on every refresh, old token is marked revoked and a new one issued. Reuse detection: if a revoked token is presented, revoke all tokens for that subject (theft response).
- **Logout:** revoke current refresh token; access tokens remain valid until expiry (acceptable given 15 min).

### 5.2 User auth (player)

| Endpoint | Method | Body | Response | Notes |
|---|---|---|---|---|
| `/auth/user/send-otp` | POST | `{ phone }` | 204 | Rate limit per phone (3 / 15min) and IP (10 / hour). OTP = 6 digits, TTL 5 min, stored in Redis `otp:user:<phone>` with attempt counter. |
| `/auth/user/verify-otp` | POST | `{ phone, otp }` | 200 `{ user, accessToken }` + refresh cookie | On success: upsert User by phone, issue tokens. Max 5 attempts per OTP. |
| `/auth/user/refresh` | POST | (cookie) | 200 `{ accessToken }` + new refresh cookie | Rotation + theft detection. |
| `/auth/user/logout` | POST | (cookie) | 204 | Revoke refresh. |
| `/auth/user/me` | GET | — | 200 `{ id, phone, name, email }` | Auth required. |

**Phone normalization:** strip non-digits, ensure starts with country code +91 (default for India numbers without one). Reject otherwise.

### 5.3 Owner auth

| Endpoint | Method | Body | Response |
|---|---|---|---|
| `/auth/owner/register` | POST | `{ email, password, name, phone }` | 201 `{ ownerId }` + sends email verification mail |
| `/auth/owner/verify-email` | POST | `{ token }` | 204 |
| `/auth/owner/login` | POST | `{ email, password }` | 200 `{ owner, accessToken }` + refresh cookie |
| `/auth/owner/google` | GET | — | redirects to Google |
| `/auth/owner/google/callback` | GET | (code) | redirects to admin-web with cookie set |
| `/auth/owner/refresh` | POST | (cookie) | 200 |
| `/auth/owner/logout` | POST | (cookie) | 204 |
| `/auth/owner/forgot-password` | POST | `{ email }` | 204 | Always 204 (do not leak existence). Sends Resend email with token. |
| `/auth/owner/reset-password` | POST | `{ token, password }` | 204 |
| `/auth/owner/request-step-up` | POST | (auth) `{ action }` | 204 | Sends OTP to verified email. Action ∈ {`razorpay_key_rotate`,`bank_change`,`transfer_ownership`}. |
| `/auth/owner/verify-step-up` | POST | (auth) `{ action, otp }` | 200 `{ stepUpToken }` | stepUpToken valid 10 min, single-use, scoped to action. |
| `/auth/owner/me` | GET | — | 200 owner profile (sensitive fields redacted) |

**Password policy:** min 10 chars, ≥1 upper, ≥1 lower, ≥1 digit. Validated in shared Zod schema.

**Google linking:** if Google sub matches no Owner, create new Owner with `emailVerifiedAt = now()`, `passwordHash = null`. If email already exists with passwordHash, link Google sub (require login first — return error code `GOOGLE_LINK_REQUIRES_LOGIN`).

### 5.4 Super-admin auth

Single seeded account. No registration endpoint.

| Endpoint | Method | Body | Response |
|---|---|---|---|
| `/auth/super-admin/login` | POST | `{ email, password }` | 200 `{ admin, accessToken }` + refresh cookie |
| `/auth/super-admin/refresh` | POST | (cookie) | 200 |
| `/auth/super-admin/logout` | POST | (cookie) | 204 |
| `/auth/super-admin/me` | GET | — | 200 |

Super-admin login attempts logged to `AuditLog` regardless of success/failure. After 5 failed attempts within 15 min, account locked 30 min.

### 5.5 Guards & decorators

- `JwtAuthGuard` (default global; bypassed by `@Public()`)
- `RolesGuard` reads `@Roles('user'|'owner'|'super_admin')`
- `OwnerOwnsVenueGuard` — checks `params.venueId` belongs to `req.owner.id`
- `OwnerOwnsBoxGuard` — same for boxes
- `OwnerOwnsBookingGuard` — same for bookings
- `StepUpRequiredGuard` — verifies `X-Step-Up-Token` header matches action
- `@CurrentUser()`, `@CurrentOwner()`, `@CurrentAdmin()` decorators

---

## 6. Module specs

### 6.1 Users module

| Endpoint | Method | Auth | Body | Response |
|---|---|---|---|---|
| `/users/me` | GET | user | — | profile |
| `/users/me` | PATCH | user | `{ name?, email? }` | updated profile |
| `/users/me/bookings` | GET | user | `?status=&page=&pageSize=` | paginated bookings |
| `/users/me/data-export` | POST | user | — | 202; enqueues job; emails ZIP via Resend |
| `/users/me/delete` | POST | user | `{ confirmation }` | 202; enqueues account deletion (soft delete + scrub PII after 30 days) |

### 6.2 Owners module

| Endpoint | Method | Auth | Body | Response |
|---|---|---|---|---|
| `/owners/me` | GET | owner | — | profile (secrets redacted) |
| `/owners/me` | PATCH | owner | `{ name?, phone? }` | updated |
| `/owners/me/kyc` | PUT | owner | `{ gstin?, pan?, bankAccountHolderName, bankAccountNumber, bankIfsc }` | 200; sets `kycStatus = SUBMITTED` |
| `/owners/me/razorpay-keys` | PUT | owner + step-up | `{ keyId, keySecret, webhookSecret }` | 204; validates by calling Razorpay test endpoint before saving |
| `/owners/me/razorpay-keys/status` | GET | owner | — | `{ configured: boolean, keyIdMasked: string?, lastVerifiedAt }` |
| `/owners/me/dashboard` | GET | owner | `?from=&to=` | `{ todayBookings, weekRevenue, occupancyPct, recentBookings }` |

KYC validation:
- GSTIN: regex `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$`
- PAN: regex `^[A-Z]{5}[0-9]{4}[A-Z]$`
- IFSC: regex `^[A-Z]{4}0[A-Z0-9]{6}$`

Bank number stored encrypted; only last 4 returned in responses.

### 6.3 Venues module

| Endpoint | Method | Auth | Body | Response |
|---|---|---|---|---|
| `/venues` | POST | owner | `CreateVenueDto` | 201 venue (status DRAFT) |
| `/venues/mine` | GET | owner | `?status=` | owner's venues |
| `/venues/:id` | GET | owner+owns OR public if APPROVED | — | venue |
| `/venues/:id` | PATCH | owner+owns | partial update | 200; if APPROVED and material change, status → PENDING |
| `/venues/:id` | DELETE | owner+owns | — | 204 (soft delete unless no bookings) |
| `/venues/:id/photos` | POST | owner+owns | `{ keys: string[] }` | replaces photo list (already uploaded via presigned URLs) |
| `/venues/:id/submit` | POST | owner+owns | — | 200; DRAFT → PENDING. Requires: KYC verified, Razorpay configured, ≥1 box, ≥1 pricing rule per box. |
| `/venues/public` | GET | public | `?city=&minPrice=&maxPrice=&amenities=&date=&hour=&sort=&page=&pageSize=` | paginated approved venues with cards |
| `/venues/public/:slug` | GET | public | — | full venue page data including boxes, pricing tiers, reviews summary, photos |

`CreateVenueDto` (Zod):
```ts
{
  name: string (3-100),
  description?: string (max 2000),
  address: string (10-300),
  city: string (lowercase canonical),
  state: string,
  pincode: string (^\d{6}$),
  geoLat?: number, geoLng?: number,
  amenities: string[] (whitelist enum: parking|washroom|floodlight|cafeteria|equipment|seating|drinking_water|first_aid)
}
```

City list maintained as constant in `packages/shared/cities.ts` (initially: bangalore, mumbai, pune, delhi, hyderabad, chennai, ahmedabad). New cities added by super-admin only.

### 6.4 Boxes module

| Endpoint | Method | Auth | Body | Response |
|---|---|---|---|---|
| `/venues/:venueId/boxes` | POST | owner+owns | `CreateBoxDto` | 201 |
| `/venues/:venueId/boxes` | GET | owner+owns | — | list |
| `/boxes/:id` | GET | public if venue APPROVED + owner+owns | — | box detail |
| `/boxes/:id` | PATCH | owner+owns | partial | 200 |
| `/boxes/:id` | DELETE | owner+owns | — | 204 (refuse if active future bookings) |
| `/boxes/:id/pricing-rules` | PUT | owner+owns | `PricingRule[]` (replaces all) | 200; validated to cover full opening hours with no gaps/overlaps |
| `/boxes/:id/blackouts` | GET | owner+owns | `?from=&to=` | list |
| `/boxes/:id/blackouts` | POST | owner+owns | `CreateBlackoutDto` | 201; refuses if confirmed bookings overlap (returns 409 with list) |
| `/blackouts/:id` | DELETE | owner+owns | — | 204 |

`CreateBoxDto`:
```ts
{
  name: string (1-50),
  surfaceType: 'TURF'|'MAT'|'CONCRETE'|'OTHER',
  defaultHourlyPrice: number (paise, min 10000 = ₹100),
  openingHour: number (0-23),
  closingHour: number (1-24, > openingHour),
  photos?: string[]
}
```

Pricing rule validation:
- All rules collectively must cover `[openingHour, closingHour)` for both `WEEKDAY` and `WEEKEND`
- No overlapping ranges within same dayType
- Price ≥ ₹100

### 6.5 Slots module — availability

| Endpoint | Method | Auth | Query | Response |
|---|---|---|---|---|
| `/slots/availability` | GET | optional | `?boxId&date` | array `[{hour, status, priceInPaise}]` |

Status enum: `AVAILABLE`, `HELD`, `BOOKED`, `BLACKOUT`, `PAST`, `CLOSED` (outside opening hours).

Algorithm:
1. Load box, verify venue APPROVED and box active.
2. For each hour ∈ [openingHour, closingHour):
   - If hour < `now()` for today's date in IST → `PAST`.
   - If matches a Blackout (one-off date or recurring weekday) → `BLACKOUT`.
   - If any `Booking` with status IN ('CONFIRMED','COMPLETED') matches → `BOOKED`.
   - If any `SlotHold` with `expiresAt > now()` not held by current user → `HELD`.
   - Else `AVAILABLE`, attach computed price.

Cache: response cached in Redis for 30 seconds per (boxId, date) when no user-specific filter; invalidated on booking/hold mutation via Redis pub/sub.

### 6.6 Bookings module

#### 6.6.1 Create hold

`POST /bookings/holds`, auth: user

Body:
```ts
{ boxId: string, slotDate: string (YYYY-MM-DD IST), slotHour: number }
```

Logic:
1. Validate slot is `AVAILABLE` (run availability check).
2. Compute price via `pricingService.computeSlotPrice(box, slotDate, slotHour)`.
3. In a transaction: delete any expired holds for this slot, insert new `SlotHold` with `expiresAt = now() + holdTtl`. If insert fails on unique constraint → 409 `SLOT_NOT_AVAILABLE`.
4. Return `{ holdId, expiresAt, total, advance, breakdown }`.

#### 6.6.2 Release hold

`DELETE /bookings/holds/:id`, auth: user — only if owned by user.

#### 6.6.3 Initiate booking (create Razorpay order)

`POST /bookings/initiate`, auth: user

Body:
```ts
{ holdId: string }
```

Logic:
1. Load hold, ensure owned by user and not expired.
2. Load box → venue → owner. Ensure owner has Razorpay configured.
3. Recompute price (must match hold). Snapshot pricing + cancellation policy on booking.
4. Create `Booking` with `status = PENDING_PAYMENT`, derive `slotStartAt`.
5. Call Razorpay Orders API using owner's keys: `amount = advanceAmount`, `currency = INR`, `receipt = booking.id`, `notes = { bookingId, venueId, ownerId }`.
6. Save `razorpayOrderId` on booking.
7. Return `{ booking, razorpay: { keyId, orderId, amount, currency, prefill: { contact: user.phone, name: user.name, email: user.email } } }`.

Frontend uses returned data to open Razorpay Checkout. Note: `keyId` returned is owner's, never key secret.

#### 6.6.4 Webhook handles confirmation

(See § 7.)

#### 6.6.5 Get / list bookings

| Endpoint | Method | Auth | Notes |
|---|---|---|---|
| `/bookings/:id` | GET | user (own) OR owner (owns venue) OR super-admin | full detail |
| `/bookings/mine` | GET | user | filters by status, paginated |
| `/owners/me/bookings` | GET | owner | `?venueId&boxId&status&from&to`, paginated |

#### 6.6.6 Cancel booking

`POST /bookings/:id/cancel`, auth: user (own) OR owner (owns)

Logic:
1. Load booking. Reject if not in CONFIRMED.
2. Compute hours-until-slot from `now()` and `slotStartAt`.
3. Look up tier from `cancellationPolicySnapshot` (stored on booking):
   - hours > full → refund = advance
   - hours > half → refund = advance/2
   - else → refund = 0
4. If refund > 0: enqueue `refund-processor` job with `{ bookingId, amount }`. Set status = CANCELLED, refundAmount.
5. If refund = 0: set status = CANCELLED, refundAmount = 0.
6. Notify user (SMS + email).
7. Record `AuditLog` with `cancelledBy`.

Refund processor calls Razorpay refund API with owner's keys. On success, updates booking with `razorpayRefundId`, `refundProcessedAt`, status → REFUNDED.

#### 6.6.7 Mark NO_SHOW

`POST /bookings/:id/no-show`, auth: owner (owns)

Allowed only after `slotStartAt + 30 min`. Sets status NO_SHOW, persists `notes`. Refund cannot be requested afterward.

### 6.7 Reviews module

| Endpoint | Method | Auth | Body | Response |
|---|---|---|---|---|
| `/bookings/:id/review` | POST | user (own) | `{ rating, text? }` | 201; allowed only if booking status = COMPLETED and no existing review and within 30 days of slot |
| `/reviews/:id/reply` | POST | owner (owns venue) | `{ ownerReply }` | 200 |
| `/venues/:slug/reviews` | GET | public | `?page=&pageSize=` | paginated |

Rating: integer 1–5. Text: max 1000 chars. Owner reply: max 500 chars, single edit allowed within 7 days.

### 6.8 Invoices module

`/invoices/:id` GET — auth: user (own booking) OR owner (own) — returns invoice metadata + signed R2 URL (1h TTL).

Invoice generation triggered as job after booking CONFIRMED. PDF via `@react-pdf/renderer` server-side, template in `apps/api/src/invoices/template.tsx`. Fields:
- Owner name, GSTIN, address
- Invoice number, date
- Booking ref, venue, box, slot date/time
- User name (or "Walk-in Player"), phone
- Description: "Box cricket booking — advance"
- Taxable amount, CGST 9%, SGST 9%, total (matches `advanceAmount`)
- Footer: "Balance ₹X payable at venue" + cancellation policy line

Invoice number: per-owner atomic increment in transaction, formatted `INV-{ownerSlug}-{YYYY}-{seq:6}`.

### 6.9 Subscriptions module

Module is **fully implemented but gated by `FreeModeService.isFreeModeActive()`**.

`FreeModeService`:
```
isFreeModeActive(ownerId?): boolean
  if env.PLATFORM_FREE_MODE === 'true' → true
  if platformSettings.freeModeDbOverride === true → true
  if ownerId and owner.subscriptionOverrideUntil > now() → true
  else → false
```

When inactive (paid mode):
- Owners cannot submit venues without active subscription.
- Daily cron checks for `periodEnd < now()`, sets status PAST_DUE, suspends new venue submissions after 7 days grace.

Endpoints:

| Endpoint | Method | Auth | Body | Response |
|---|---|---|---|---|
| `/subscriptions/plans` | GET | public | — | list plans |
| `/subscriptions/me` | GET | owner | — | current subscription + free-mode banner info |
| `/subscriptions/me/subscribe` | POST | owner | `{ planCode }` | creates Razorpay order on platform's Razorpay (not owner's) |
| `/subscriptions/me/cancel` | POST | owner | — | sets autorenew off |
| `/webhooks/razorpay/platform` | POST | (signed) | — | subscription payment webhook |

### 6.10 Super-admin module

| Endpoint | Method | Auth | Body | Response |
|---|---|---|---|---|
| `/super-admin/venues` | GET | super-admin | `?status=PENDING&search=&page=` | paginated |
| `/super-admin/venues/:id` | GET | super-admin | — | full venue detail + owner KYC summary |
| `/super-admin/venues/:id/approve` | POST | super-admin | — | 200; status → APPROVED, audit log, email owner |
| `/super-admin/venues/:id/reject` | POST | super-admin | `{ reason }` | 200; status → REJECTED, email owner |
| `/super-admin/venues/:id/suspend` | POST | super-admin | `{ reason }` | 200; status → SUSPENDED; future bookings cancelled with full refund queued |
| `/super-admin/venues/:id/reinstate` | POST | super-admin | — | 200; SUSPENDED → APPROVED |
| `/super-admin/owners` | GET | super-admin | `?search=&suspended=&page=` | paginated |
| `/super-admin/owners/:id` | GET | super-admin | — | full owner profile |
| `/super-admin/owners/:id/suspend` | POST | super-admin | `{ reason }` | 200 |
| `/super-admin/owners/:id/grant-free` | POST | super-admin | `{ until: date }` | 200; sets `subscriptionOverrideUntil` |
| `/super-admin/owners/:id/revoke-free` | POST | super-admin | — | 200; clears override |
| `/super-admin/owners/:id/reset-password` | POST | super-admin | — | 200; generates one-time link, emails owner |
| `/super-admin/users` | GET | super-admin | `?search=&blocked=&page=` | paginated |
| `/super-admin/users/:id/block` | POST | super-admin | `{ reason }` | 200; invalidates all refresh tokens |
| `/super-admin/users/:id/unblock` | POST | super-admin | — | 200 |
| `/super-admin/bookings` | GET | super-admin | `?status=&from=&to=&ownerId=&page=` | paginated |
| `/super-admin/payments/failed` | GET | super-admin | — | recent failed payments / webhook errors |
| `/super-admin/refunds/pending` | GET | super-admin | — | stuck refunds for manual nudge |
| `/super-admin/refunds/:bookingId/retry` | POST | super-admin | — | re-enqueues refund job |
| `/super-admin/settings` | GET | super-admin | — | PlatformSettings |
| `/super-admin/settings` | PATCH | super-admin | partial PlatformSettings | 200; cannot disable freeMode if env true (returns warning) |
| `/super-admin/audit-log` | GET | super-admin | filters + pagination | list |
| `/super-admin/audit-log/export` | GET | super-admin | `?from=&to=` | streams CSV |
| `/super-admin/cities` | GET | super-admin | — | list |
| `/super-admin/cities` | POST | super-admin | `{ name }` | adds city (lowercase normalized) |

Every super-admin write operation writes an `AuditLog` row with action, target, before/after metadata, IP, UA.

### 6.11 Storage module

`/storage/presign-upload` POST, auth: owner

Body: `{ purpose: 'venue-photo'|'box-photo', filename, contentType, sizeBytes }`

Validation:
- contentType ∈ { image/jpeg, image/png, image/webp }
- sizeBytes ≤ 8 MB
- filename sanitized

Returns: `{ url, key, headers, expiresIn }` — presigned PUT URL valid 1h. Frontend uploads directly to R2. Key format: `venues/{ownerId}/{cuid}.{ext}`.

`/storage/sign-download` GET, auth: varies — returns signed GET URL valid 1h for protected assets (invoices). Public assets served via R2 custom domain CDN.

### 6.12 Notifications module

Internal service; not directly exposed. Used by other modules.

```ts
class NotificationService {
  sendSms(input: { templateId: string, to: string, vars: Record<string,string> }): Promise<void>
  sendEmail(input: { to: string, subject: string, htmlTemplate: string, vars: object, attachments?: Attachment[] }): Promise<void>
}
```

Both methods enqueue a BullMQ job (`notification-dispatcher`) — never sent synchronously inside request handlers. Failure retries with exponential backoff (3 attempts), then dead-letter logged + super-admin alert metric.

SMS provider: MSG91, using DLT-approved templates referenced by ID. Email provider: Resend. Both wrapped behind interfaces (`SmsProvider`, `EmailProvider`) so they're swappable in tests.

---

## 7. Webhooks — Razorpay

`POST /webhooks/razorpay/:ownerId` (per-owner webhook URL configured in owner's Razorpay dashboard)

Steps (all inside a single SERIALIZABLE transaction except where noted):

1. Read raw body (Express `rawBody` middleware).
2. Verify `X-Razorpay-Signature` HMAC-SHA256 against owner's webhook secret (decrypted). Reject with 401 on mismatch.
3. Parse JSON, extract `event` and `payload`.
4. **Idempotency:** insert `WebhookEvent` with unique `(provider, eventId)`. If duplicate, return 200 immediately (already processed).
5. Switch on event:
   - `payment.captured`:
     - Find Booking by `razorpay_order_id` in payload.
     - Verify amount matches `advanceAmount`.
     - If status = PENDING_PAYMENT: update to CONFIRMED, set `razorpayPaymentId`, delete corresponding SlotHold.
     - Partial unique index catches double-booking → rollback and enqueue auto-refund job for losing payment.
     - Enqueue: `invoice-generator`, `notification-dispatcher` (SMS+email).
   - `payment.failed`: Booking → PAYMENT_FAILED. Release hold. Notify user.
   - `refund.processed`: Booking → REFUNDED. Set `razorpayRefundId`, `refundProcessedAt`.
   - `refund.failed`: log + super-admin alert + retry queue.
6. Mark WebhookEvent processed.
7. Return 200.

Failure modes:
- Verification failed → 401, log to audit.
- Booking not found → 200 + log (avoid Razorpay retries flooding).
- Internal error → 500, Razorpay will retry.

---

## 8. Jobs (BullMQ)

Queue list, with concurrency and retry policy:

| Queue | Concurrency | Retries | Backoff | Purpose |
|---|---|---|---|---|
| `hold-sweeper` | 1 (scheduler) | n/a | n/a | Repeatable every 60s; deletes `SlotHold` where `expiresAt < now() - 30s` |
| `booking-completer` | 1 (scheduler) | n/a | n/a | Every 5 min; sets bookings to COMPLETED for CONFIRMED bookings where `slotStartAt + 1h < now()` |
| `refund-processor` | 2 | 5 | exponential 30s..30min | Calls Razorpay refund API |
| `invoice-generator` | 4 | 3 | exponential 1m..15m | Renders PDF, uploads R2, links to booking, emails |
| `notification-dispatcher` | 8 | 3 | exponential 30s..5m | Sends SMS / email |
| `data-export` | 1 | 2 | linear 5m | Builds user data ZIP and emails link |
| `account-deletion` | 1 (scheduler) | 1 | — | Daily; scrubs PII for users marked deleted >30d ago |
| `subscription-reaper` | 1 (scheduler) | n/a | n/a | Daily; sets PAST_DUE for expired subs |

BullMQ board: optional `@bull-board/express` UI mounted at `/admin/queues`, protected by super-admin JWT.

---

## 9. Pricing engine (shared package)

`packages/shared/src/pricing.ts`

```ts
type PricingRuleSlim = { dayType: 'WEEKDAY'|'WEEKEND'; startHour: number; endHour: number; price: number };
type BoxSlim = { defaultHourlyPrice: number; pricingRules: PricingRuleSlim[]; openingHour: number; closingHour: number };
type Input = { box: BoxSlim; slotDate: Date; slotHour: number; durationHours?: number };

export function computeSlotPrice(input: Input): {
  total: number;             // paise
  advance: number;           // paise, ceil(total/2)
  breakdown: Array<{ hour: number; dayType: 'WEEKDAY'|'WEEKEND'; ruleApplied: 'TIER'|'DEFAULT'; price: number }>;
}
```

Day-type derivation: IST weekday (Sat/Sun = WEEKEND, else WEEKDAY). India holidays not handled v1 (deferred).

Validation: throws if `slotHour < box.openingHour` or `slotHour + durationHours > box.closingHour`.

`advance` percent from `PlatformSettings.advancePercent` (passed in as second arg to keep function pure).

Unit-tested with table of cases (peak/off-peak combinations, fallback to default, midnight wrap).

---

## 10. Validation

All DTOs defined as Zod schemas in `packages/shared/src/schemas/`. Custom NestJS pipe `ZodValidationPipe` runs them at controller boundaries. Validation errors return:

```json
{
  "statusCode": 400,
  "error": "ValidationError",
  "message": "Invalid request",
  "issues": [{ "path": "body.phone", "message": "Invalid phone format" }]
}
```

---

## 11. Error handling

Global exception filter returns shape:
```json
{ "statusCode": 4xx|5xx, "error": "<ErrorCode>", "message": "<human>", "requestId": "<uuid>" }
```

Error codes (subset):
- `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`
- `SLOT_NOT_AVAILABLE`, `HOLD_EXPIRED`, `HOLD_NOT_OWNED`
- `RAZORPAY_NOT_CONFIGURED`, `RAZORPAY_ORDER_CREATE_FAILED`, `RAZORPAY_AMOUNT_MISMATCH`
- `KYC_INCOMPLETE`, `SUBSCRIPTION_REQUIRED`, `STEP_UP_REQUIRED`
- `VENUE_NOT_APPROVED`, `BOOKING_NOT_CANCELLABLE`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

5xx responses are logged with full stack and request context. 4xx are logged at info level without stack.

`requestId` injected via `RequestIdMiddleware`, also set on response header `X-Request-Id` and on every log line.

---

## 12. Security

- `helmet()` middleware with CSP defaults.
- CORS allowlist from env.
- All cookies: `httpOnly`, `Secure` (in prod), `SameSite=Lax`.
- HSTS in production.
- All passwords: argon2id (memory 64 MB, time 3, parallelism 1).
- All owner secrets at rest: AES-256-GCM with random per-record IV; ciphertext stored base64 with format `<iv>:<ciphertext>:<tag>`.
- Rate limits via `nestjs-throttler` backed by Redis store.
- Webhook signature verification before any side effect; reject with timing-safe compare.
- No card data ever stored or logged. Razorpay payment IDs and order IDs are not PII.
- Phone numbers hashed (SHA-256 with server pepper from env) in `AuditLog.metadata` when full PII not needed.
- DPDP Act: data export and account deletion implemented.

---

## 13. Observability

### Logging
`nestjs-pino` produces JSON logs to stdout. Each log line includes: `level`, `time`, `requestId`, `actorType`, `actorId?`, `path`, `method`, `statusCode`, `latencyMs`, `msg`. PII fields redacted via Pino redact paths.

In production, container stdout is collected by Promtail and shipped to Loki.

### Metrics
Library `prom-client`. Endpoint `GET /metrics` (separate port if needed). Metrics:
- `http_requests_total{method,route,status}`
- `http_request_duration_seconds{method,route}` (histogram)
- `booking_created_total{result}` (`hold`, `initiate`, `confirmed`, `failed`, `cancelled`)
- `slot_lock_conflict_total`
- `hold_expired_total`
- `payment_failed_total`
- `refund_processed_total{result}`
- `webhook_received_total{event,result}`
- `queue_job_duration_seconds{queue,result}`
- `queue_size{queue}` (gauge)
- `subscription_state{state}` (gauge)

Prometheus scrapes `/metrics`. Grafana dashboards in `infra/grafana/dashboards/`:
- `api-overview.json` (RED + saturation)
- `bookings.json` (funnel: hold → initiate → confirmed)
- `payments.json`
- `queues.json`

Alert rules (Loki/Prom):
- `rate(payment_failed_total[5m]) > 0.05` (>5% failure)
- `histogram_quantile(0.95, http_request_duration_seconds) > 1` for 10m
- `queue_size{queue="refund-processor"} > 10` for 30m
- `up{job="api"} == 0` for 1m

---

## 14. Testing

Three tiers, all run in CI (`pnpm test` from monorepo root via Turbo).

**Unit (Jest):** pure functions — pricing engine, money helpers, time helpers, cancellation tier calc, validation schemas.

**Integration (Jest + Testcontainers):** module-level tests spinning up real Postgres + Redis. Cover: auth flows, booking lifecycle, webhook idempotency, refund flow with mocked Razorpay HTTP, encryption/decryption roundtrip.

**E2E (Playwright in user-web/admin-web repos, but trigger backend through real HTTP):** documented in user-frontend doc.

Coverage threshold: 80% lines for `apps/api/src/{bookings,payments,webhooks,pricing,auth}`.

---

## 15. Deployment

### Docker

`apps/api/Dockerfile` — multi-stage Node 20 alpine, prune dev deps, run as non-root. Health check hits `/health`.

### Railway / Render

Single service `api`. Add Postgres + Redis add-ons. Set all env vars. Provide build command `pnpm -F api build`, start command `node apps/api/dist/main.js`. Persistent volume not needed (R2 is external).

### Migrations

`pnpm prisma migrate deploy` runs as part of release step (Railway pre-deploy or Render build).

### Cutover checklist (pre-prod)

- DNS for `api.example.com` → Railway
- TLS cert auto by Railway
- Backups: `pg_dump` daily via cron job within Railway, archived to R2 (separate bucket, 90-day retention)
- Redis persistence: Upstash with backups enabled
- Razorpay live webhook URL: `https://api.example.com/webhooks/razorpay/{ownerId}` (provided per-owner during onboarding)
- MSG91 sender ID + DLT templates approved
- Resend domain DKIM/SPF/DMARC verified

---

## 16. Build sequence

Execute in order. Each step ends with a runnable checkpoint.

1. **Repo + Prisma + DB.** Init monorepo, write `schema.prisma`, run `prisma migrate dev`. Run partial-index SQL migration. Seed script works.
2. **NestJS skeleton.** App boots, `/health` returns 200 with DB + Redis pings. Pino logging on. Global pipes + filter wired.
3. **Crypto module.** `EncryptionService` + `HashService` with passing unit tests.
4. **Auth (user).** OTP send + verify. Refresh rotation. Rate limits. Integration test logs in a user.
5. **Auth (owner) + Google.** Email/password + Google OAuth. Step-up service.
6. **Auth (super-admin).** Seed + login + audit log.
7. **R2 storage + presigned uploads.**
8. **Owners + KYC.** Profile, KYC, Razorpay keys (validated against Razorpay sandbox).
9. **Venues + Boxes + Pricing + Blackouts.** Full CRUD with guards.
10. **Slots availability.** Endpoint + caching.
11. **Bookings holds + initiate.** Razorpay sandbox orders.
12. **Webhook handler + idempotency.** End-to-end test using ngrok or Razorpay test webhooks.
13. **Cancellation + refund processor.** Test all three tiers.
14. **Invoice generator.** PDF + R2 + email.
15. **Reviews.**
16. **Public listing endpoints.** Filters + sort + pagination.
17. **Super-admin module.** Moderation, owner/user mgmt, settings, audit log, CSV export.
18. **Subscription module (gated).** Free-mode service.
19. **Notifications service.** SMS via MSG91 (real DLT template), email via Resend.
20. **Metrics + Grafana dashboards.**
21. **Rate limiting + security headers + final hardening.**
22. **Load test** with k6 (200 RPS booking flow on staging).
23. **Cutover.**

---

## 17. Acceptance criteria summary

Backend is "done" when all of these pass in staging:

- OTP-login a user → fetch availability → create hold → initiate booking → pay test card → webhook fires → booking CONFIRMED → SMS+email sent → invoice PDF stored.
- Two concurrent `/bookings/initiate` requests for same slot → exactly one CONFIRMED, the other receives 409 or a payment that is auto-refunded.
- Cancel booking at +30h → 100% refund processed within 10 minutes. At +12h → 50%. At +1h → 0%.
- Hold ignored after 9 minutes → slot bookable again by another user.
- Owner submits venue with missing KYC → 422 with `KYC_INCOMPLETE`.
- Super-admin approves venue → public listing endpoint returns it.
- `PLATFORM_FREE_MODE=true` → owners can publish without subscription. Set to false + grant 30-day override → owner publishes. Revoke + remove env → owner is blocked.
- Webhook replay (same event twice) → no duplicate side effects.
- All endpoints respond within p95 200 ms for read ops, 1 s for write ops, at 100 RPS in staging.
