# BoxCricket Platform — Setup Requirements

Complete guide for getting the BoxCricket SaaS platform running from zero. Read this entirely before starting.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Environment Variables — Backend](#3-environment-variables--backend)
4. [Environment Variables — Frontend Apps](#4-environment-variables--frontend-apps)
5. [How to Generate Secrets](#5-how-to-generate-secrets)
6. [External Service Setup](#6-external-service-setup)
7. [Database Setup](#7-database-setup)
8. [Super-Admin Initial Setup](#8-super-admin-initial-setup)
9. [Owner Onboarding Flow](#9-owner-onboarding-flow)
10. [Local Development Setup](#10-local-development-setup)
11. [Production Deployment Checklist](#11-production-deployment-checklist)
12. [Domain Structure](#12-domain-structure)
13. [Docker Compose (for local dev)](#13-docker-compose-for-local-dev)
14. [Environment File Templates](#14-environment-file-templates)
15. [Mobile App Configuration](#15-mobile-app-configuration)

---

## 1. Overview

BoxCricket is a multi-tenant SaaS platform that connects box cricket venue owners with players. Owners list their venues; players browse, hold slots, and pay online. The platform takes no cut of payments — venue owners receive money directly via their own Razorpay accounts.

### Architecture

```
box-booking/
├── backend/              # NestJS 10 API — the single backend for all clients
├── apps/
│   ├── user-web/         # Next.js 14 — player-facing booking app (port 3000)
│   ├── admin-web/        # Next.js 14 — owner portal + super-admin dashboard (port 3002)
│   ├── landing/          # Next.js 14 — marketing landing page (port 3003)
│   ├── user-mobile/      # Expo (React Native) — player mobile app
│   ├── owner-mobile/     # Expo (React Native) — owner mobile app
│   └── super-admin-mobile/ # Expo (React Native) — super-admin mobile app
└── packages/
    └── shared/           # Shared types, Zod schemas, pricing engine
```

### Infrastructure services required

| Service | Purpose |
|---------|---------|
| PostgreSQL 16 | Primary database |
| Redis 7 | Session store, BullMQ job queues, slot-hold TTL, rate limiting |
| Cloudflare R2 | Object storage — venue photos, box photos, PDF invoices, KYC docs |
| Razorpay | Payment gateway (each owner uses their own account; platform keys for webhooks) |
| MSG91 | SMS OTP delivery (India) |
| Resend | Transactional email (password reset, step-up OTP) |

---

## 2. Prerequisites

Install the following on your development machine (or CI/CD environment) before continuing.

| Tool | Minimum version | Install |
|------|----------------|---------|
| Node.js | 20+ | https://nodejs.org or `nvm install 20` |
| pnpm | 9+ | `npm install -g pnpm@9` |
| Docker + Docker Compose | any recent | https://docs.docker.com/get-docker/ |
| Git | any | https://git-scm.com |
| openssl | any | pre-installed on macOS/Linux; Windows: use Git Bash |

> Docker is only needed to run PostgreSQL and Redis locally. For production you will use managed services instead.

---

## 3. Environment Variables — Backend

The backend validates every required variable at startup using Zod. If any required variable is missing or malformed the process will exit immediately with a clear error message.

Copy the template: `cp backend/.env.example backend/.env` and fill in the values below.

---

### 3.1 Core / Server

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `NODE_ENV` | Yes | `development` | Runtime environment. Must be one of: `development`, `staging`, `production`. Controls log formatting, dev fixture seeding, and encryption key strictness. | `production` |
| `PORT` | No | `3001` | TCP port the NestJS API listens on. | `3001` |
| `PUBLIC_API_URL` | Yes | — | Publicly reachable base URL of the API (no trailing slash). Used to construct callback URLs and webhook endpoints. | `https://api.yourdomain.com` |
| `PUBLIC_USER_WEB_URL` | Yes | — | Public URL of the user-facing Next.js app. Used in email links. | `https://app.yourdomain.com` |
| `PUBLIC_ADMIN_WEB_URL` | Yes | — | Public URL of the admin/owner Next.js app. Used in Google OAuth callback. | `https://admin.yourdomain.com` |
| `CORS_ALLOWED_ORIGINS` | Yes | — | Comma-separated list of origins allowed to call the API. Must include every frontend domain. | `https://app.yourdomain.com,https://admin.yourdomain.com` |

---

### 3.2 Database

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `DATABASE_URL` | Yes | — | Full PostgreSQL connection string. Format: `postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public` | `postgresql://boxcricket:secret@localhost:5433/boxcricket` |
| `DATABASE_POOL_MAX` | No | `20` | Maximum Prisma connection pool size. Increase for high-concurrency production. | `20` |

Where to get it: create the database yourself (see Section 7) then construct the URL from your credentials.

---

### 3.3 Redis

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `REDIS_URL` | Yes | — | Full Redis connection string including password if set. | `redis://:mypassword@localhost:6379` |

Redis is used for: BullMQ job queues, slot-hold TTL tracking, OTP rate limiting, and general caching.

---

### 3.4 JWT (RS256 asymmetric key pair)

The API signs JWTs with an RSA-2048 private key and verifies them with the corresponding public key. Both are stored base64-encoded in env vars. See Section 5 for how to generate them.

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `JWT_PRIVATE_KEY_BASE64` | Yes | Base64 encoding of the PEM-formatted RSA-2048 private key. Used to sign access and refresh tokens. | `LS0tLS1CRUdJTiBSU0EgUFJJVkFURS...` |
| `JWT_PUBLIC_KEY_BASE64` | Yes | Base64 encoding of the PEM-formatted RSA-2048 public key. Used to verify tokens. | `LS0tLS1CRUdJTiBQVUJMSUMgS0VZ...` |
| `JWT_ACCESS_TTL_SECONDS` | No | `900` | Access token lifetime in seconds (default: 15 minutes). | `900` |
| `JWT_REFRESH_TTL_SECONDS` | No | `2592000` | Refresh token lifetime in seconds (default: 30 days). | `2592000` |

> The public key must be the exact public key derived from the private key. Mismatched keys will cause all token verifications to fail at startup.

---

### 3.5 Encryption

Owner Razorpay API keys and bank account numbers are stored encrypted in the database using AES-256-GCM. The encryption key is a 32-byte secret stored as 64 hex characters.

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `ENCRYPTION_KEY_HEX` | Yes | 64 hex characters representing a 32-byte AES-256 encryption key. In production, the API will refuse to start if this is not exactly 64 hex chars. | `a3f1c2e4b5d6...` (64 chars) |
| `ARGON2_MEMORY_KB` | No | `65536` | Memory cost for Argon2id password hashing (64 MB). Do not lower below 16384 in production. | `65536` |
| `ARGON2_TIME_COST` | No | `3` | Time cost (iterations) for Argon2id. | `3` |
| `ARGON2_PARALLELISM` | No | `1` | Parallelism factor for Argon2id. | `1` |

See Section 5 for the command to generate `ENCRYPTION_KEY_HEX`.

> WARNING: If you lose this key, all stored Razorpay secrets and bank account numbers become permanently unreadable. Back it up securely (e.g. in a secrets manager like AWS Secrets Manager or HashiCorp Vault).

---

### 3.6 Razorpay (platform-level)

The platform needs its own Razorpay account to receive webhooks. Individual venue owners also configure their own Razorpay keys via the owner portal — those are stored encrypted per-owner in the database and are separate from these platform keys.

| Variable | Required | Description | Where to get it |
|----------|----------|-------------|----------------|
| `RAZORPAY_PLATFORM_KEY_ID` | Yes | Platform Razorpay API key ID (starts with `rzp_test_` or `rzp_live_`). | Razorpay Dashboard → Settings → API Keys |
| `RAZORPAY_PLATFORM_KEY_SECRET` | Yes | Platform Razorpay API key secret. | Same as above |
| `RAZORPAY_PLATFORM_WEBHOOK_SECRET` | Yes | Secret used to verify webhook signatures from Razorpay. | Razorpay Dashboard → Settings → Webhooks → your webhook → secret |

See Section 6 for full Razorpay setup instructions.

---

### 3.7 Cloudflare R2 (object storage)

Used to store venue photos, box photos, GST invoices (PDF), and KYC documents. If R2 credentials are not provided, the service runs in stub mode — presigned URLs are returned as fake `stub.r2.dev` URLs, which is fine for local development but nothing will actually be stored.

| Variable | Required | Description | Where to get it |
|----------|----------|-------------|----------------|
| `R2_ACCOUNT_ID` | Yes (prod) | Your Cloudflare account ID (32-char hex). | Cloudflare Dashboard → right sidebar |
| `R2_ACCESS_KEY_ID` | Yes (prod) | R2 API token access key ID. | Cloudflare → R2 → Manage R2 API tokens |
| `R2_SECRET_ACCESS_KEY` | Yes (prod) | R2 API token secret. Only shown once at creation. | Same as above |
| `R2_BUCKET` | Yes (prod) | Name of the R2 bucket to use. | Create it yourself: e.g. `boxcricket-media` |
| `R2_PUBLIC_BASE_URL` | Yes (prod) | Public-facing base URL for the bucket (your CDN or R2 public domain). | e.g. `https://cdn.yourdomain.com` |
| `R2_PRESIGN_TTL_SECONDS` | No | `3600` | How long presigned upload/download URLs are valid. | `3600` |

See Section 6 for full R2 setup instructions.

---

### 3.8 SMS — MSG91

Used to send OTP SMS messages to players during login, and booking/refund notification SMS to players. If `MSG91_AUTH_KEY` is not set, the service runs in stub mode — OTPs are printed to the server console, which is fine for local development.

| Variable | Required | Description | Where to get it |
|----------|----------|-------------|----------------|
| `MSG91_AUTH_KEY` | Yes (prod) | MSG91 API authentication key. | MSG91 Dashboard → API → Auth Key |
| `MSG91_SENDER_ID` | Yes (prod) | 6-character DLT-registered sender ID. | MSG91 Dashboard → Sender IDs (must match DLT registration) |
| `MSG91_OTP_TEMPLATE_ID` | Yes (prod) | MSG91 template ID for OTP messages. | MSG91 Dashboard → SMS → Templates |
| `MSG91_BOOKING_CONFIRM_TEMPLATE_ID` | Yes (prod) | MSG91 template ID for booking confirmation SMS. | Same as above |
| `MSG91_REFUND_TEMPLATE_ID` | Yes (prod) | MSG91 template ID for refund notification SMS. | Same as above |

See Section 6 for SMS and DLT registration details.

---

### 3.9 Email — Resend

Used to send password reset emails and step-up OTP verification emails to venue owners. If `RESEND_API_KEY` is not set, the service stubs — email content is printed to the server console.

| Variable | Required | Description | Where to get it |
|----------|----------|-------------|----------------|
| `RESEND_API_KEY` | Yes (prod) | Resend API key. | https://resend.com → API Keys |
| `RESEND_FROM` | Yes (prod) | The "From" address for all outbound emails. Must be a verified domain in Resend. | e.g. `no-reply@yourdomain.com` |
| `RESEND_REPLY_TO` | No | Optional "Reply-To" address. | e.g. `support@yourdomain.com` |

---

### 3.10 Google OAuth (for owner sign-in)

Owners can sign in or register using Google OAuth in addition to email/password.

| Variable | Required | Description | Where to get it |
|----------|----------|-------------|----------------|
| `GOOGLE_OAUTH_CLIENT_ID` | Yes | Google OAuth 2.0 client ID. | Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Yes | Google OAuth 2.0 client secret. | Same as above |
| `GOOGLE_OAUTH_CALLBACK_URL` | Yes | OAuth redirect URI — must exactly match what is registered in Google Console. | `https://admin.yourdomain.com/auth/google/callback` |

---

### 3.11 Super-Admin Seed

These values are used once during `pnpm prisma:seed` to create the initial super-admin account. They can be removed from the environment after the first seed run.

| Variable | Required | Description | How to set |
|----------|----------|-------------|-----------|
| `SUPER_ADMIN_EMAIL` | Yes | Email address for the super-admin account. | Choose your own |
| `SUPER_ADMIN_PASSWORD_HASH` | Yes | Argon2id hash of the super-admin password. See generation command below. | See Section 5 |
| `SUPER_ADMIN_NAME` | No | `Platform Admin` | Display name for the super-admin. | e.g. `Platform Admin` |

Generate the hash before seeding:
```bash
cd backend
node -e "require('argon2').hash('YourPasswordHere').then(h => console.log(h))"
```

Then set `SUPER_ADMIN_PASSWORD_HASH` to the printed hash value (starts with `$argon2id$`).

---

### 3.12 Booking Defaults

These control platform-wide booking behaviour. They seed the `PlatformSettings` database record, which can then be adjusted via the super-admin dashboard without redeploying.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SLOT_HOLD_TTL_MINUTES` | No | `8` | Minutes a slot is held for a user after they click "Book" but before payment completes. |
| `ADVANCE_PERCENT` | No | `50` | Percentage of the total booking amount charged as advance payment (the remainder is due at the venue). |
| `CANCEL_FULL_REFUND_HOURS` | No | `24` | Hours before slot start within which a 100% refund is issued on cancellation. |
| `CANCEL_HALF_REFUND_HOURS` | No | `6` | Hours before slot start within which a 50% refund is issued. Cancellations within this window get 0% refund. |

---

### 3.13 Platform Free Mode

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PLATFORM_FREE_MODE` | No | `false` | Set to `true` to bypass subscription checks. Use during pre-launch when subscription billing is not yet active. |
| `PLATFORM_FREE_MODE_REASON` | No | — | Human-readable message shown to owners explaining why free mode is active (e.g. `Pre-launch beta`). |

---

### 3.14 Observability

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LOG_LEVEL` | No | `info` | Pino log level. One of: `trace`, `debug`, `info`, `warn`, `error`, `fatal`. |
| `LOKI_PUSH_URL` | No | — | Optional Grafana Loki push endpoint for log shipping. e.g. `http://loki:3100/loki/api/v1/push` |
| `PROMETHEUS_METRICS_ENABLED` | No | `true` | Set to `false` to disable Prometheus metrics endpoint. |

---

### 3.15 Rate Limiting

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RATE_LIMIT_OTP_PER_PHONE_PER_15MIN` | No | `3` | Max OTP requests from a single phone number in a 15-minute window. |
| `RATE_LIMIT_OTP_PER_IP_PER_HOUR` | No | `10` | Max OTP requests from a single IP address per hour. |
| `RATE_LIMIT_API_PER_USER_PER_MIN` | No | `120` | Max authenticated API requests per user per minute. |
| `RATE_LIMIT_API_PER_IP_PER_MIN` | No | `300` | Max unauthenticated API requests per IP per minute. |

---

## 4. Environment Variables — Frontend Apps

Each Next.js app needs a `.env.local` file. `NEXT_PUBLIC_*` variables are inlined at build time and are visible to the browser — never put secrets in them.

### 4.1 user-web (port 3000)

File: `apps/user-web/.env.local`

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL of the backend API (no trailing slash, no `/api/v1` suffix — that is appended in code). | `https://api.yourdomain.com` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Recommended | The Razorpay Key ID to initialise the Razorpay checkout JS on the frontend. This is the **owner's** Razorpay Key ID — in a multi-owner scenario, the backend returns the correct key in the booking initiation response. Set this to your test key for local dev. | `rzp_test_xxxxxxxxxxxxxx` |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical URL of the user app, used for `robots.txt` generation. | `https://app.yourdomain.com` |

### 4.2 admin-web (port 3002)

File: `apps/admin-web/.env.local`

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL of the backend API. | `https://api.yourdomain.com` |

### 4.3 landing (port 3003)

File: `apps/landing/.env.local`

The landing page is a static marketing site. No required env vars — it links out to the other apps via hardcoded or configured URLs.

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_USER_APP_URL` | No | URL of the player app. Defaults to `https://app.boxcricket.in` if not set. | `https://app.yourdomain.com` |
| `NEXT_PUBLIC_OWNER_APP_URL` | No | URL of the owner portal. | `https://admin.yourdomain.com/owner` |

---

## 5. How to Generate Secrets

Run these commands once before your first deploy. Store outputs in a password manager or secrets manager.

### JWT RS256 Key Pair

```bash
# Step 1: Generate 2048-bit RSA private key
openssl genrsa -out private.pem 2048

# Step 2: Extract the public key
openssl rsa -in private.pem -pubout -out public.pem

# Step 3: Base64-encode both (single line, no wrapping)
base64 -w 0 private.pem   # Copy this → JWT_PRIVATE_KEY_BASE64
base64 -w 0 public.pem    # Copy this → JWT_PUBLIC_KEY_BASE64

# macOS uses -b instead of -w:
# base64 -b 0 private.pem
# base64 -b 0 public.pem

# Clean up — do not commit PEM files
rm private.pem public.pem
```

### AES-256-GCM Encryption Key

```bash
# Generates 32 random bytes encoded as 64 hex characters
openssl rand -hex 32
# Copy the output → ENCRYPTION_KEY_HEX
```

### Super-Admin Password Hash

```bash
cd backend
# Replace 'YourPasswordHere' with your actual chosen password
node -e "require('argon2').hash('YourPasswordHere').then(h => console.log(h))"
# Copy the $argon2id$... output → SUPER_ADMIN_PASSWORD_HASH
```

### Razorpay Webhook Secret

Generate a random string in the Razorpay Dashboard (see Section 6) and copy it to `RAZORPAY_PLATFORM_WEBHOOK_SECRET`. You can also generate one locally and paste it into both the dashboard and the env var:

```bash
openssl rand -hex 32
```

---

## 6. External Service Setup

### Razorpay

BoxCricket uses Razorpay in a **per-owner key** model: each venue owner connects their own Razorpay account and payments from their customers go directly to them. The platform itself also needs a Razorpay account to receive webhook notifications.

**Platform account setup:**

1. Create an account at https://razorpay.com
2. Complete KYC for the platform entity
3. Go to **Settings → API Keys → Generate Key** — copy the Key ID and Key Secret to `RAZORPAY_PLATFORM_KEY_ID` and `RAZORPAY_PLATFORM_KEY_SECRET`
4. Go to **Settings → Webhooks → Add New Webhook**
   - URL: `https://api.yourdomain.com/api/v1/webhooks/razorpay`
   - Secret: generate one and copy it to `RAZORPAY_PLATFORM_WEBHOOK_SECRET`
   - Events to enable: `payment.captured`, `refund.created`
5. For local development, use Test mode keys (prefixed `rzp_test_`). Switch to Live keys only in production

**Owner account (each owner does this themselves):**

Owners add their own Razorpay Key ID, Key Secret, and Webhook Secret via the owner portal at `/owner/settings/payments`. These values are encrypted with AES-256-GCM before being stored in the database. Owners must:
1. Create their own Razorpay account and complete KYC
2. Generate API keys
3. Create a webhook in their dashboard pointing to the same webhook URL above, with their own secret
4. Enter these values in the owner portal (requires step-up OTP verification)

---

### Cloudflare R2

R2 is Cloudflare's S3-compatible object storage. It is used for all file uploads: venue photos, box photos, KYC documents, and generated PDF invoices.

1. Create a Cloudflare account at https://cloudflare.com
2. Navigate to **R2 Object Storage** in the sidebar
3. Click **Create bucket** and name it (e.g. `boxcricket-media` for production, `boxcricket-dev` for development)
4. Enable public access on the bucket (or configure a custom domain/subdomain pointing to it)
5. Navigate to **R2 → Manage R2 API Tokens → Create API Token**
   - Give it **Object Read & Write** permissions
   - Scope it to the specific bucket
   - Copy the **Access Key ID** → `R2_ACCESS_KEY_ID`
   - Copy the **Secret Access Key** → `R2_SECRET_ACCESS_KEY` (shown only once)
6. Your **Account ID** is shown in the right sidebar of any Cloudflare page → `R2_ACCOUNT_ID`
7. Set `R2_PUBLIC_BASE_URL` to the public bucket URL (from the bucket's **Settings → Public Access** section), e.g. `https://pub-xxxxxxxx.r2.dev` or your custom domain

> For local development, you can skip R2 entirely. The storage service will stub all requests and log warnings — no files will actually be stored, but the app will function.

---

### SMS — MSG91

MSG91 is an Indian SMS gateway. It is used to send OTP codes to players during phone-number login.

**Development:** Set `MSG91_AUTH_KEY` to an empty string or omit it entirely. The SMS service will stub — OTP codes are printed to the backend console logs. Use these to log in locally.

**Production (India):**

1. Create a MSG91 account at https://msg91.com
2. Complete DLT (Distributed Ledger Technology) registration — required by TRAI for all commercial SMS in India. This involves:
   - Registering your **principal entity** (company) on the DLT portal
   - Registering your **sender ID** (6 characters, e.g. `BOXCRK`)
   - Registering each **SMS template** you will use (exact text with variable placeholders)
3. After DLT approval, get your Auth Key from MSG91 Dashboard → **API** → **Auth Key** → `MSG91_AUTH_KEY`
4. Your approved sender ID → `MSG91_SENDER_ID`
5. Get template IDs from MSG91 Dashboard → **SMS** → **Templates**:
   - OTP template (e.g. `"Your BoxCricket OTP is ##OTP##. Valid for 5 minutes."`) → `MSG91_OTP_TEMPLATE_ID`
   - Booking confirmation template → `MSG91_BOOKING_CONFIRM_TEMPLATE_ID`
   - Refund notification template → `MSG91_REFUND_TEMPLATE_ID`

> DLT registration can take 3–7 business days. Plan ahead for production launches.

---

### Email — Resend

1. Create a Resend account at https://resend.com
2. Add and verify your sending domain under **Domains** (follow the DNS record instructions)
3. Go to **API Keys** and create a new key with **Full Access**
4. Copy the key → `RESEND_API_KEY`
5. Set `RESEND_FROM` to a verified address on your domain, e.g. `no-reply@yourdomain.com`

Email is used for:
- Owner password reset links
- Step-up OTP codes for sensitive owner actions (adding Razorpay keys, viewing KYC data)
- Booking confirmation emails (if configured)

**Development:** Leave `RESEND_API_KEY` unset. Emails will be stubbed — content is printed to the console.

---

### Google OAuth

1. Go to https://console.cloud.google.com
2. Create a project (or use an existing one)
3. Enable the **Google+ API** or **Google Identity** API
4. Go to **Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add authorized redirect URIs:
   - Development: `http://localhost:3002/auth/google/callback`
   - Production: `https://admin.yourdomain.com/auth/google/callback`
7. Copy the Client ID → `GOOGLE_OAUTH_CLIENT_ID`
8. Copy the Client Secret → `GOOGLE_OAUTH_CLIENT_SECRET`
9. Set `GOOGLE_OAUTH_CALLBACK_URL` to the matching redirect URI

---

## 7. Database Setup

The backend uses Prisma 5 with PostgreSQL 16. All monetary values are stored in paise (1 INR = 100 paise).

### Create the database

Using Docker (recommended for local dev — see Section 13 for the compose file):

```bash
cd backend
docker compose up -d
# PostgreSQL will be available at localhost:5433
# Default credentials: user=boxcricket, password=boxcricket_dev, db=boxcricket
```

Or create it manually:
```bash
createdb boxcricket
psql -c "CREATE USER boxcricket WITH PASSWORD 'yourpassword';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE boxcricket TO boxcricket;"
```

### Run migrations

```bash
cd backend

# Development (creates migration history, safe to run repeatedly):
pnpm prisma:migrate:dev

# Production (applies pending migrations without prompting):
pnpm prisma:migrate:deploy
```

### Seed initial data

```bash
cd backend
pnpm prisma:seed
```

The seed script creates:
- **1 super-admin account** — email and password hash from `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD_HASH` env vars. Change the password immediately after first login.
- **Subscription plans** — BASIC (₹1,499/month, 1 venue, 4 boxes) and PRO (₹3,999/month, unlimited venues and boxes)
- **Platform settings singleton** — default slot hold (8 min), advance percent (50%), cancellation policy (100% refund >24h, 50% >6h, 0% <6h)
- **Dev fixtures** (only when `NODE_ENV != production`) — 1 demo owner, 2 approved venues in Bangalore, 5 boxes with pricing rules, 1 demo player phone

> The seed is idempotent — running it multiple times is safe (uses `upsert`).

---

## 8. Super-Admin Initial Setup

The super-admin account is the platform operator. After first deploy:

1. Open `https://admin.yourdomain.com/super-admin/login`
2. Log in with the email and password you hashed in Section 3.11
3. **Immediately change your password** via Settings → Security
4. **Set up TOTP 2FA** — go to Settings → Security → Enable Authenticator. Scan the QR code with Google Authenticator or Authy. 2FA is required for sensitive operations.
5. Go to **Platform Settings** and confirm or adjust:
   - Slot hold TTL
   - Advance payment percentage
   - Cancellation policy
   - Free mode toggle
6. Go to **Cities** and add the cities where your service operates (used to filter venue listings)

**Default credentials from seed (CHANGE IMMEDIATELY):**
- Email: value of `SUPER_ADMIN_EMAIL` in your `.env`
- Password: whatever plaintext you hashed for `SUPER_ADMIN_PASSWORD_HASH`

There is no hardcoded default password — you set it during the seed step.

---

## 9. Owner Onboarding Flow

After the platform is live, venue owners go through this flow:

1. **Register** at `https://admin.yourdomain.com/owner/register` with their business email and password (or continue with Google)
2. **Verify email** — a verification link is sent to their inbox via Resend
3. **Log in** to the owner portal
4. **Complete KYC** — enter PAN number, GSTIN, and bank account details for invoice compliance
5. **Add Razorpay keys** — enter their Razorpay Key ID, Key Secret, and Webhook Secret. This action requires a step-up OTP sent to their registered email.
6. **Create venue(s)** — add venue name, address, city, amenities, and photos (uploaded to R2)
7. **Add boxes** — define surface type, opening/closing hours, default price, and pricing rules (weekday/weekend peak/off-peak)
8. **Submit for approval** — venue enters `PENDING` status
9. **Super-admin reviews and approves** the venue via the moderation dashboard
10. **Go live** — once `APPROVED`, the venue appears in player search results and bookings can be made

---

## 10. Local Development Setup

Complete step-by-step from zero.

### Step 1: Clone and install

```bash
git clone https://github.com/MarmikShah634/box-booking.git
cd box-booking
pnpm install
```

### Step 2: Start infrastructure

```bash
cd backend
docker compose up -d
# Starts PostgreSQL 16 on port 5433 and Redis 7 on port 6379
```

Verify containers are healthy:
```bash
docker compose ps
# Both services should show "healthy"
```

### Step 3: Configure backend environment

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in the minimum required values for local dev:

```bash
# Generate JWT keys
openssl genrsa -out /tmp/jwt_private.pem 2048
openssl rsa -in /tmp/jwt_private.pem -pubout -out /tmp/jwt_public.pem
echo "JWT_PRIVATE_KEY_BASE64=$(base64 -w 0 /tmp/jwt_private.pem)"
echo "JWT_PUBLIC_KEY_BASE64=$(base64 -w 0 /tmp/jwt_public.pem)"
rm /tmp/jwt_private.pem /tmp/jwt_public.pem

# Generate encryption key
echo "ENCRYPTION_KEY_HEX=$(openssl rand -hex 32)"

# Generate super-admin password hash
cd backend
node -e "require('argon2').hash('DevAdmin@123').then(h => console.log('SUPER_ADMIN_PASSWORD_HASH=' + h))"
cd ..
```

Paste each output value into `backend/.env`.

Minimum required values for local dev (services without keys run in stub mode):
- `JWT_PRIVATE_KEY_BASE64` — generated above
- `JWT_PUBLIC_KEY_BASE64` — generated above
- `ENCRYPTION_KEY_HEX` — generated above
- `SUPER_ADMIN_EMAIL` — e.g. `admin@boxcricket.dev`
- `SUPER_ADMIN_PASSWORD_HASH` — generated above
- All other required fields are pre-filled in `.env.example` with working local dev values

### Step 4: Configure frontend apps

```bash
# User app
cp apps/user-web/.env.example apps/user-web/.env.local

# Admin/owner portal
cp apps/admin-web/.env.example apps/admin-web/.env.local

# Landing page (optional)
cp apps/landing/.env.example apps/landing/.env.local
```

The example files have working localhost defaults — no changes needed for local dev.

### Step 5: Run database migrations and seed

```bash
cd backend
pnpm prisma:migrate:dev
pnpm prisma:seed
cd ..
```

### Step 6: Start all apps

From the repo root:
```bash
pnpm dev
```

This starts the backend API and both web apps concurrently. Or start them individually in separate terminals:

```bash
# Terminal 1 — Backend API on :3001
pnpm --filter backend start:dev

# Terminal 2 — User app on :3000
pnpm --filter user-web dev

# Terminal 3 — Admin/owner portal on :3002
pnpm --filter admin-web dev

# Terminal 4 — Landing page on :3003
pnpm --filter landing dev
```

### Step 7: Verify everything is running

| URL | What you should see |
|-----|---------------------|
| http://localhost:3001/health | `{"status":"ok"}` |
| http://localhost:3000 | Player booking app |
| http://localhost:3002/owner/login | Owner login page |
| http://localhost:3002/super-admin/login | Super-admin login |
| http://localhost:3003 | Landing page |

### Development credentials

**Super-admin:** Use the email and password you set in `.env` (`SUPER_ADMIN_EMAIL` and the plaintext you hashed)

**Demo owner:** `demo-owner@boxcricket.dev` — the seed creates a demo owner but with a placeholder password hash, so you cannot log in as the demo owner by default. Instead, register a new owner account via the portal.

**Demo player:** Phone number `+919000000001` — enter it on the user app login screen. OTP will be printed to the backend console (not sent via SMS in dev mode).

---

## 11. Production Deployment Checklist

Go through this list before going live.

### Secrets and configuration
- [ ] `NODE_ENV=production`
- [ ] `ENCRYPTION_KEY_HEX` is exactly 64 hex characters
- [ ] `JWT_PRIVATE_KEY_BASE64` and `JWT_PUBLIC_KEY_BASE64` are a matched RSA-2048 key pair
- [ ] All `REPLACE_ME` placeholders have been replaced with real values
- [ ] Secrets are stored in a secrets manager (AWS Secrets Manager, Doppler, etc.) — not committed to git
- [ ] `SUPER_ADMIN_PASSWORD_HASH` is set (required for seed)
- [ ] `GOOGLE_OAUTH_CALLBACK_URL` points to your production domain

### Infrastructure
- [ ] PostgreSQL 16 has SSL enabled (`?sslmode=require` in `DATABASE_URL`)
- [ ] PostgreSQL has automated daily backups configured
- [ ] Redis has a strong password set (reflected in `REDIS_URL`)
- [ ] All services are in the same VPC/private network (database and Redis not exposed to internet)

### Application
- [ ] `CORS_ALLOWED_ORIGINS` lists only your production frontend domains
- [ ] `PUBLIC_API_URL`, `PUBLIC_USER_WEB_URL`, `PUBLIC_ADMIN_WEB_URL` all use `https://`
- [ ] Razorpay keys are switched to **Live** mode (prefixed `rzp_live_`)
- [ ] Razorpay webhook URL is configured and verified in the Razorpay dashboard
- [ ] R2 bucket exists and is accessible from the production server
- [ ] Resend domain is verified and `RESEND_FROM` uses your domain
- [ ] MSG91 DLT registration is complete and templates are approved
- [ ] `PLATFORM_FREE_MODE` is set to `false` (unless you are intentionally in pre-launch mode)

### Deployment commands (run in order)
```bash
# 1. Install dependencies
pnpm install --frozen-lockfile

# 2. Apply database migrations (no prompt, safe for CI/CD)
cd backend && pnpm prisma:migrate:deploy

# 3. Run seed (idempotent — safe to run on every deploy)
pnpm prisma:seed

# 4. Build backend
pnpm build

# 5. Start
node dist/main.js
```

### Post-deploy
- [ ] Log in as super-admin and change the password immediately
- [ ] Set up TOTP authenticator for super-admin account
- [ ] Confirm platform settings are correct (advance %, cancellation policy)
- [ ] Add operating cities via super-admin dashboard
- [ ] Verify webhook is receiving test events from Razorpay
- [ ] Set up error monitoring (Sentry or similar) with the API URL
- [ ] Confirm SSL/TLS certificates are valid on all four domains
- [ ] Test a full booking flow end to end using a test Razorpay payment

### Rate limiting (review and adjust)
- [ ] `RATE_LIMIT_OTP_PER_PHONE_PER_15MIN` is appropriate for expected traffic
- [ ] `RATE_LIMIT_API_PER_IP_PER_MIN` is not so low it blocks legitimate users

---

## 12. Domain Structure

Recommended subdomain layout. All must have valid TLS certificates.

| Service | URL | Port in dev |
|---------|-----|-------------|
| Backend API | `api.yourdomain.com` | `3001` |
| User (player) app | `app.yourdomain.com` | `3000` |
| Owner portal + super-admin | `admin.yourdomain.com` | `3002` |
| Landing page | `yourdomain.com` | `3003` |

Configure `CORS_ALLOWED_ORIGINS=https://app.yourdomain.com,https://admin.yourdomain.com` in production.

---

## 13. Docker Compose (for local dev)

The backend directory already contains a `docker-compose.yml` (`backend/docker-compose.yml`). Run it from the `backend/` directory:

```bash
cd backend
docker compose up -d      # start
docker compose down       # stop
docker compose down -v    # stop and delete data volumes
```

It starts:
- **PostgreSQL 16** on `localhost:5433` (note: port 5433 not 5432, to avoid conflicts with any local Postgres install)
  - User: `boxcricket`
  - Password: `boxcricket_dev`
  - Database: `boxcricket`
- **Redis 7** on `localhost:6379`
  - Password: `redis_dev_pass`

These credentials are already pre-configured in `backend/.env.example`:
```
DATABASE_URL=postgresql://boxcricket:boxcricket_dev@localhost:5433/boxcricket
REDIS_URL=redis://:redis_dev_pass@localhost:6379
```

---

## 14. Environment File Templates

The following `.env.example` files exist in the repository. Copy them to create your local working files.

### backend/.env.example

Already exists at `backend/.env.example`. Copy with:
```bash
cp backend/.env.example backend/.env
```

### apps/user-web/.env.example

Copy with:
```bash
cp apps/user-web/.env.example apps/user-web/.env.local
```

Contents:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_REPLACE_ME
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### apps/admin-web/.env.example

Copy with:
```bash
cp apps/admin-web/.env.example apps/admin-web/.env.local
```

Contents:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### apps/landing/.env.example

Copy with:
```bash
cp apps/landing/.env.example apps/landing/.env.local
```

Contents:
```
NEXT_PUBLIC_USER_APP_URL=http://localhost:3000
NEXT_PUBLIC_OWNER_APP_URL=http://localhost:3002/owner
```

---

## 15. Mobile App Configuration

There are three React Native / Expo apps in `apps/`:

| App | Directory | Bundle ID (iOS) | Android package | Port |
|-----|-----------|----------------|----------------|------|
| Player app | `apps/user-mobile/` | `com.boxcricket.user` | — | — |
| Owner app | `apps/owner-mobile/` | `com.boxcricket.owner` | — | — |
| Super-admin app | `apps/super-admin-mobile/` | `com.boxcricket.superadmin` | — | — |

### Environment variable

Each mobile app reads `EXPO_PUBLIC_API_URL` to know where the backend is. Create a `.env` file in each app directory:

```bash
# For each of the three mobile apps:
echo "EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3001" > apps/user-mobile/.env
echo "EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3001" > apps/owner-mobile/.env
echo "EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3001" > apps/super-admin-mobile/.env
```

> Use your machine's LAN IP address (e.g. `192.168.1.100`), not `localhost` — mobile devices and simulators cannot reach `localhost` on your dev machine. Find your IP with `ip addr` (Linux) or `ipconfig getifaddr en0` (macOS).

For production, point `EXPO_PUBLIC_API_URL` to `https://api.yourdomain.com`.

### Running on device/simulator (development)

```bash
cd apps/user-mobile    # or owner-mobile / super-admin-mobile
pnpm install
npx expo start

# Then:
# - Press 'a' to open in Android emulator
# - Press 'i' to open in iOS simulator
# - Scan QR code with Expo Go app on a physical device
```

### Updating bundle identifiers (before app store submission)

Edit `app.json` in each app directory:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp"
    },
    "android": {
      "package": "com.yourcompany.yourapp"
    }
  }
}
```

Bundle identifiers must be globally unique on the App Store and Play Store. Use your own reverse-domain format.

### Building for distribution

Install EAS CLI (Expo Application Services):
```bash
npm install -g eas-cli
eas login
```

Configure the build:
```bash
cd apps/user-mobile
eas build:configure
```

Build for stores:
```bash
# iOS (requires Apple Developer account — $99/year)
eas build --platform ios

# Android (requires Google Play Developer account — $25 one-time)
eas build --platform android

# Both
eas build --platform all
```

Submit to stores:
```bash
eas submit --platform ios
eas submit --platform android
```

### Expo SDK version

All three mobile apps use **Expo SDK 51** with React Native 0.74. This requires:
- Node.js 18+
- For iOS builds: Xcode 15+ (on macOS)
- For Android builds: Android Studio with SDK 34+

---

## Appendix: Money Convention

All monetary values throughout the backend, database, and API are stored and transmitted in **paise** (smallest unit of INR). Formatting to rupees happens only in the UI layer.

```
₹800 booking  →  stored as 80000 (paise)
₹1499 subscription  →  stored as 149900 (paise)
```

Never send rupees to the API. Never store rupees in the database.

---

## Appendix: Key API Endpoints Quick Reference

### User (Player)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/user/send-otp` | Send OTP to phone number |
| POST | `/api/v1/auth/user/verify-otp` | Verify OTP, receive JWT tokens |
| GET | `/api/v1/venues/public?city=bangalore` | Browse approved venues |
| GET | `/api/v1/slots/availability?boxId=&date=` | Get slot grid for a box on a date |
| POST | `/api/v1/bookings/holds` | Hold a slot (8 minutes) |
| POST | `/api/v1/bookings/initiate` | Create Razorpay order and confirm hold |
| POST | `/api/v1/bookings/:id/cancel` | Cancel booking |

### Owner

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/owner/register` | Register new owner account |
| POST | `/api/v1/auth/owner/login` | Email/password login |
| GET | `/api/v1/owners/me/dashboard` | Dashboard stats |
| POST | `/api/v1/venues` | Create venue |
| PUT | `/api/v1/boxes/:id/pricing-rules` | Set pricing rules |

### Super-Admin

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/super-admin/login` | Super-admin login |
| GET | `/api/v1/super-admin/venues?status=PENDING` | Venues awaiting approval |
| POST | `/api/v1/super-admin/venues/:id/approve` | Approve a venue |
| PATCH | `/api/v1/super-admin/settings` | Update platform settings |
| GET | `/api/v1/super-admin/audit-log` | View audit log |

Health check (no auth required): `GET /health`
