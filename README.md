# BoxCricket

A full-stack SaaS platform for discovering and booking box cricket venues across India.

---

## About

BoxCricket connects players with box cricket venue owners. Players browse verified venues, check real-time slot availability, and pay a 50% advance online. Owners manage their venues, pricing, and bookings through a dedicated dashboard.

**Key capabilities:**

- Real-time slot availability (30-second cache invalidation)
- 8-minute slot hold during payment
- 50% advance via Razorpay (per-owner keys, money goes directly to owner)
- GST-compliant PDF invoice generation
- Flexible cancellation: 100% refund >24h, 50% >6h, 0% <6h
- Owner KYC + Razorpay key management with step-up OTP verification
- Super-admin moderation panel (venue approval, owner management, audit log)
- Free-mode gate for pre-launch (no subscription required)

---

## Architecture

```
boxcricket/
├── backend/          # NestJS 10 API (Node 20, TypeScript strict)
├── apps/
│   ├── user-web/     # Next.js 14 player-facing app (port 3000)
│   ├── admin-web/    # Next.js 14 owner + super-admin app (port 3002)
│   └── landing/      # Next.js 14 marketing landing page (port 3003)
└── packages/
    └── shared/       # Shared types, schemas, pricing engine, utilities
```

**Backend stack:** NestJS, Prisma 5, PostgreSQL 16, Redis 7, BullMQ, JWT RS256, Argon2id, AES-256-GCM, Razorpay, MSG91, Resend, Cloudflare R2

**Frontend stack:** Next.js 14 App Router, Tailwind CSS, shadcn/ui, React Hook Form, Zod, Zustand

---

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local Postgres + Redis)
- A Razorpay test account (for owner keys)

---

## Setup

### 1. Clone & install dependencies

```bash
git clone <repo-url>
cd box-booking
pnpm install
```

### 2. Start infrastructure (Postgres + Redis)

```bash
cd backend
docker-compose up -d
```

This starts:
- PostgreSQL 16 on port 5433
- Redis 7 on port 6379

### 3. Configure environment

```bash
cd backend
cp .env.example .env
```

**Required env changes:**

```env
# Generate RSA key pair:
# openssl genrsa 2048 > private.pem
# openssl rsa -pubout < private.pem > public.pem
# base64 -w0 private.pem   → JWT_PRIVATE_KEY_BASE64
# base64 -w0 public.pem    → JWT_PUBLIC_KEY_BASE64
JWT_PRIVATE_KEY_BASE64=<base64-encoded-pem>
JWT_PUBLIC_KEY_BASE64=<base64-encoded-pem>

# Generate 32-byte hex key:
# openssl rand -hex 32
ENCRYPTION_KEY_HEX=<64-hex-chars>

# Super-admin password hash (generate once):
# npx ts-node -e "require('argon2').hash('YourPassword123!').then(console.log)"
SUPER_ADMIN_PASSWORD_HASH=<argon2id-hash>
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_NAME=Platform Admin
```

For development, set `PLATFORM_FREE_MODE=true` (default). This bypasses subscription checks.

Optional services (stubs used if not configured):
- `MSG91_AUTH_KEY` — SMS OTPs (dev: OTP logged to console)
- `RESEND_API_KEY` — Email notifications
- `R2_*` — File storage (presigned URLs fallback to local stub)

### 4. Run database migrations + seed

```bash
cd backend
pnpm prisma:migrate:dev
pnpm prisma:seed
```

The seed creates:
- 1 super-admin account (from env)
- Subscription plans (BASIC, PRO)
- Platform settings singleton
- Demo owner, 2 venues, 5 boxes, pricing rules, 1 demo user (dev only)

### 5. Start development servers

```bash
# Terminal 1: Backend API
cd backend
pnpm start:dev

# Terminal 2: User-facing app
cd apps/user-web
pnpm dev

# Terminal 3: Admin + super-admin app
cd apps/admin-web
pnpm dev

# Terminal 4: Landing page
cd apps/landing
pnpm dev
```

Or use the root concurrently command:
```bash
pnpm dev
```

### 6. Access the apps

| App | URL | Notes |
|-----|-----|-------|
| API | http://localhost:3001 | `/api/v1/*` prefix |
| API Health | http://localhost:3001/health | |
| User web | http://localhost:3000 | Player booking |
| Owner portal | http://localhost:3002/owner | Venue management |
| Super-admin | http://localhost:3002/super-admin | Platform ops |
| Landing page | http://localhost:3003 | Marketing |

### Default credentials (dev)

**Super-admin:** `admin@boxcricket.dev` + whatever password you hashed

**Demo owner:** `demo-owner@boxcricket.dev` + `password` (dev seed only, NOT a real argon2id hash — cannot login in this form)

**Demo player:** Phone `+919000000001` → OTP logged to console in dev mode

---

## Environment Variables Reference

See `backend/.env.example` for the full list with descriptions.

---

## Running Tests

```bash
# Backend unit + integration tests
cd backend
pnpm test

# With coverage
pnpm test:cov

# Watch mode
pnpm test:watch
```

---

## Building for Production

```bash
# Build all
pnpm build

# Build individual apps
cd backend && pnpm build
cd apps/user-web && pnpm build
cd apps/admin-web && pnpm build
cd apps/landing && pnpm build
```

---

## Git Hooks (Husky)

Pre-commit: lint-staged (TypeScript check on staged files)
Pre-push: TypeScript check + Next.js build + ESLint on all apps

To skip hooks (emergency only):
```bash
git push --no-verify
```

---

## Deployment

### Railway / Render

1. Create a new service pointing to the `backend/` directory
2. Build command: `pnpm build`
3. Start command: `node dist/main.js`
4. Add Postgres + Redis add-ons
5. Set all env vars from `.env.example`
6. Pre-deploy command: `pnpm prisma:migrate:deploy && pnpm prisma:seed`

For frontends, deploy each `apps/*` directory as a separate static/SSR service.

### Docker (Backend)

```bash
cd backend
docker build -t boxcricket-api .
docker run -p 3001:3001 --env-file .env boxcricket-api
```

---

## Key API Endpoints

### User (Player)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/user/send-otp` | Send OTP to phone |
| POST | `/api/v1/auth/user/verify-otp` | Verify OTP, get token |
| GET | `/api/v1/venues/public?city=bangalore` | Browse venues |
| GET | `/api/v1/venues/public/:slug` | Venue detail |
| GET | `/api/v1/slots/availability?boxId=&date=` | Slot grid |
| POST | `/api/v1/bookings/holds` | Hold a slot (8 min) |
| POST | `/api/v1/bookings/initiate` | Create Razorpay order |
| GET | `/api/v1/bookings/mine` | My bookings |
| POST | `/api/v1/bookings/:id/cancel` | Cancel booking |

### Owner
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/owner/register` | Register as owner |
| POST | `/api/v1/auth/owner/login` | Login |
| GET | `/api/v1/owners/me/dashboard` | Dashboard stats |
| POST | `/api/v1/venues` | Create venue |
| PUT | `/api/v1/boxes/:id/pricing-rules` | Set pricing |
| GET | `/api/v1/owners/me/bookings` | All bookings |

### Super-Admin
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/super-admin/login` | Admin login |
| GET | `/api/v1/super-admin/venues?status=PENDING` | Moderation queue |
| POST | `/api/v1/super-admin/venues/:id/approve` | Approve venue |
| PATCH | `/api/v1/super-admin/settings` | Platform settings |
| GET | `/api/v1/super-admin/audit-log` | Audit log |

---

## Money Convention

All monetary values are stored and transmitted in **paise** (1 rupee = 100 paise). Formatting to rupees happens only at the UI layer.

```typescript
// Backend → Frontend: 80000 (paise)
// Frontend display: "₹800"
```

---

## Contributing

1. Create a feature branch from `main`
2. Make changes
3. Husky will run checks on commit and push
4. Open a PR

---

## License

MIT
