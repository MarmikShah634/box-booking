# Owner Portal — Implementation Spec

**App:** `apps/admin-web` — owner routes live under `/owner/*`
**Framework:** Next.js 14+ (App Router, RSC)
**Auth:** Email + password OR Google OAuth (NextAuth on the admin-web side, federated to backend Owner record)
**Step-up:** Email OTP required to change Razorpay keys, bank account, or transfer ownership
**Styling:** Tailwind + shadcn/ui (from `packages/ui`)
**Tables:** TanStack Table v8
**Forms:** React Hook Form + Zod
**Uploads:** Direct-to-R2 via presigned URLs
**Charts:** Recharts (small footprint, sufficient for admin)
**Time/Date:** `date-fns` + `date-fns-tz` for IST

Audience: builder of `/owner/*` surface with no prior context. Every page, component, and acceptance behavior specified.

The same Next.js app (`apps/admin-web`) hosts both `/owner/*` (this doc) and `/super-admin/*` (separate doc). Shared layout shell and auth bootstrap are defined here and referenced from the super-admin doc.

---

## 1. Project layout (relevant subset)

```
apps/admin-web/
├── app/
│   ├── layout.tsx                       # root layout shared by owner + super-admin
│   ├── globals.css
│   ├── page.tsx                         # redirects: → /owner if owner cookie, /super-admin if admin cookie, else /owner/login
│   ├── (auth-owner)/
│   │   ├── owner/login/page.tsx
│   │   ├── owner/register/page.tsx
│   │   ├── owner/verify-email/page.tsx
│   │   ├── owner/forgot-password/page.tsx
│   │   ├── owner/reset-password/page.tsx
│   │   └── owner/onboarding/page.tsx    # multi-step wizard
│   ├── owner/
│   │   ├── layout.tsx                   # AppShell w/ sidebar; auth guard
│   │   ├── page.tsx                     # Dashboard
│   │   ├── venues/
│   │   │   ├── page.tsx                 # venue list
│   │   │   ├── new/page.tsx
│   │   │   └── [venueId]/
│   │   │       ├── page.tsx             # venue overview
│   │   │       ├── edit/page.tsx
│   │   │       ├── boxes/page.tsx
│   │   │       ├── boxes/new/page.tsx
│   │   │       └── boxes/[boxId]/
│   │   │           ├── page.tsx
│   │   │           ├── pricing/page.tsx
│   │   │           └── blackouts/page.tsx
│   │   ├── bookings/
│   │   │   ├── page.tsx                 # list across all venues
│   │   │   └── [id]/page.tsx
│   │   ├── reviews/page.tsx
│   │   ├── subscription/page.tsx
│   │   ├── settings/
│   │   │   ├── profile/page.tsx
│   │   │   ├── kyc/page.tsx
│   │   │   ├── razorpay/page.tsx        # step-up gated
│   │   │   └── bank/page.tsx            # step-up gated
│   │   └── audit/page.tsx               # owner's own audit (last 90 days)
│   ├── api/auth/[...nextauth]/route.ts  # NextAuth handler (Google + Credentials)
│   └── middleware.ts                    # route guards
├── components/owner/
│   ├── shell/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── MobileMenu.tsx
│   │   └── ImpersonationBanner.tsx      # shown if super-admin is acting as owner (v2)
│   ├── onboarding/
│   │   ├── Wizard.tsx
│   │   ├── StepProfile.tsx
│   │   ├── StepKyc.tsx
│   │   ├── StepRazorpay.tsx
│   │   ├── StepFirstVenue.tsx
│   │   ├── StepFirstBox.tsx
│   │   ├── StepPricing.tsx
│   │   └── StepSubmit.tsx
│   ├── dashboard/
│   │   ├── StatTiles.tsx
│   │   ├── BookingsTodayList.tsx
│   │   ├── OccupancyChart.tsx
│   │   └── RevenueChart.tsx
│   ├── venues/
│   │   ├── VenueForm.tsx
│   │   ├── VenueCard.tsx
│   │   ├── VenuePhotoUploader.tsx
│   │   └── VenueStatusBadge.tsx
│   ├── boxes/
│   │   ├── BoxForm.tsx
│   │   ├── PricingTableEditor.tsx
│   │   ├── BlackoutCalendar.tsx
│   │   └── BoxPhotosUploader.tsx
│   ├── bookings/
│   │   ├── BookingsTable.tsx
│   │   ├── BookingFilters.tsx
│   │   ├── BookingDetailPanel.tsx
│   │   └── MarkNoShowDialog.tsx
│   ├── reviews/
│   │   ├── ReviewsList.tsx
│   │   └── ReviewReplyDialog.tsx
│   ├── settings/
│   │   ├── StepUpDialog.tsx             # email OTP flow
│   │   ├── RazorpayKeyForm.tsx
│   │   ├── BankForm.tsx
│   │   └── KycForm.tsx
│   ├── subscription/
│   │   ├── PlanCard.tsx
│   │   ├── CurrentSubscriptionPanel.tsx
│   │   └── FreeModeBadge.tsx
│   ├── ui/                              # re-exports from packages/ui
│   └── shared/
│       ├── DataTable.tsx                # TanStack wrapper
│       ├── ConfirmDialog.tsx
│       ├── EmptyState.tsx
│       ├── DateRangePicker.tsx
│       └── ImageUploader.tsx
├── lib/
│   ├── api.ts                           # typed client, refresh handling, step-up token attach
│   ├── auth.ts                          # NextAuth options, session shape
│   ├── razorpay-validate.ts             # client-side key format check before submit
│   ├── format.ts                        # money/date IST
│   └── policies.ts                      # client copies of cancellation tier wording
└── store/owner/
    ├── onboardingStore.ts               # multi-step wizard draft
    └── filtersStore.ts                  # bookings table filters
```

---

## 2. Auth (owner)

### NextAuth setup
- Two providers: Credentials (email + password) + Google.
- Both providers hit backend (`/auth/owner/login` or `/auth/owner/google/callback`) and receive `{ owner, accessToken, refreshCookie }`. Refresh cookie set by backend on the API domain; NextAuth session JWT (signed locally) is what `admin-web` reads for SSR.
- Session: `{ ownerId, email, name, kycStatus, subscriptionState, freeMode }` minimal claims, refreshed on every server request by calling `/auth/owner/me` if claim is older than 60s.
- `middleware.ts` redirects unauthenticated `/owner/*` to `/owner/login?next=...` and unverified-email owners to `/owner/verify-email` (except for that page itself).

### Step-up dialog
- Component `StepUpDialog`.
- Caller: any settings action requiring step-up (Razorpay keys, bank, transfer ownership).
- Flow:
  1. Caller calls dialog with `action`.
  2. Dialog POSTs `/auth/owner/request-step-up { action }`.
  3. UI: 6-digit OTP input, "Resend" enabled after 30s, max 3 minute timeout shown.
  4. On submit POSTs `/auth/owner/verify-step-up { action, otp }` → receives `stepUpToken`.
  5. Calls back to caller with `stepUpToken`.
  6. Caller attaches `X-Step-Up-Token` header to the sensitive request.

---

## 3. App shell

`/owner/layout.tsx` renders:

- Sidebar (desktop ≥1024px, collapsible to icons only):
  - Dashboard
  - Venues (with count badge of PENDING/REJECTED ones)
  - Bookings
  - Reviews (badge of unread)
  - Subscription
  - Settings (subitems)
  - Help (mailto support)
- Topbar:
  - Owner name + dropdown (profile, logout)
  - `FreeModeBadge` if free-mode active (env or override) — clickable to subscription page
  - Notifications bell (in-app notifications v1.5; placeholder v1)
- Mobile (<1024px): hamburger opens MobileMenu drawer; bottom-nav with 4 icons (Dashboard, Bookings, Reviews, Settings).

Critical empty states:
- Owner with no venues sees onboarding banner urging to create first venue.
- Owner with PENDING venue sees "Awaiting approval" banner with submitted-at timestamp.

---

## 4. Onboarding wizard

Path `/owner/onboarding`. Forced when:
- Owner has no completed KYC, or
- Owner has no Razorpay keys, or
- Owner has zero venues.

Wizard rendered in `Wizard.tsx`. Steps gate progress:

### Step 1 — Profile
Fields: name, phone. PATCH `/owners/me`.

### Step 2 — KYC
Fields: GSTIN (optional but recommended; required if owner expects to issue GST invoices — show warning if omitted), PAN (required), Bank account holder name, Bank account number, IFSC.
- Inline IFSC autocompletion via free Razorpay-hosted IFSC lookup (`https://ifsc.razorpay.com/{ifsc}`) — pure client call, no PII.
- PUT `/owners/me/kyc`.
- After save: `kycStatus = SUBMITTED`. Super-admin may verify offline (no separate verification flow v1; trust submission, flag in audit).

### Step 3 — Razorpay
- "Connect Razorpay" panel with instructions + screenshots referencing Razorpay dashboard.
- Fields: `keyId`, `keySecret`, `webhookSecret`.
- Validate client-side regex.
- Submit triggers `StepUpDialog` (this is the first time, so email OTP is mandatory).
- PUT `/owners/me/razorpay-keys` with `X-Step-Up-Token`.
- Backend validates by calling Razorpay test endpoint; surface failure inline ("Razorpay rejected these keys — please re-check").
- After success: show "Configure webhook URL" callout — give the per-owner URL `${PUBLIC_API_URL}/webhooks/razorpay/${ownerId}` and the webhook secret reminder. Provide "Copy" buttons.

### Step 4 — First venue
Fields per `CreateVenueDto`. Photo uploader (R2 presigned, min 1, max 8 photos, drag-reorder).
- POST `/venues`.

### Step 5 — First box
Fields per `CreateBoxDto`. Photo uploader. Opening / closing hours.
- POST `/venues/:venueId/boxes`.

### Step 6 — Pricing
`PricingTableEditor` (see § 6.3). Must define rules covering full opening hours for both weekday and weekend.
- PUT `/boxes/:id/pricing-rules`.

### Step 7 — Submit for review
- Summary card of everything entered.
- "Submit for approval" button → POST `/venues/:id/submit`.
- Success screen: "We typically approve within 24 hours. We'll email you."
- CTA back to dashboard.

Wizard state persisted in `onboardingStore` (Zustand) **and** on the server (each step calls the matching POST/PUT immediately so refresh resumes from the right step using owner's current state from `/owners/me`).

---

## 5. Dashboard `/owner`

Header: greeting "Good morning, {name}" (IST-time aware).

Stat tiles (4 across desktop, 2x2 mobile):
- Today's bookings (count of CONFIRMED + COMPLETED with `slotDate = today IST`)
- Today's revenue (sum of `advanceAmount` where CONFIRMED today)
- Week's revenue (last 7 days)
- Average occupancy % (last 7 days, computed: confirmed-slot-hours / available-slot-hours across active boxes)

Below:
- `BookingsTodayList` — chronological list of today's bookings (slot time, box, user phone last 4 digits, status, advance / balance), tappable to detail.
- `OccupancyChart` — line chart, last 30 days, % per day.
- `RevenueChart` — bar chart, last 30 days.

Data sources: `/owners/me/dashboard?from=&to=` (single bundled endpoint).

Empty states:
- No venues yet → CTA to onboarding.
- Venue PENDING → "Your venue is in review" panel.
- Venue REJECTED → red panel with reason + "Edit and resubmit" button.

---

## 6. Venues, boxes, pricing, blackouts

### 6.1 Venues list `/owner/venues`
- DataTable columns: name, city, status (badge), boxes count, created.
- Filter: status, search by name.
- Row actions: View, Edit, Add box, Delete (only DRAFT or empty venues).

### 6.2 Venue detail `/owner/venues/[venueId]`
- Tabs: Overview | Boxes | Photos | Edit
- Overview shows status + status timeline (when submitted, when reviewed). If REJECTED show reason and "Edit & resubmit".
- Boxes tab → `BoxesTable` with Add Box CTA.
- Photos tab → reorderable grid via `dnd-kit`.
- Edit tab → `VenueForm`. After material changes (address, name, photos) the venue moves PENDING again — show warning before save.

### 6.3 Pricing editor `/owner/venues/[venueId]/boxes/[boxId]/pricing`
Two-column layout (weekday, weekend). Each column is a list of bands:
- Add Band: select start hour, end hour, price (in ₹ inputs, paise on wire).
- Bands sorted by startHour; warning if any gap or overlap.
- "Use default price" toggle fills gaps with `box.defaultHourlyPrice`.
- Preview chart shows ₹/hour over 24h for each day type.
- Save button disabled until rules cover full opening hours.

Live preview applies pricing engine locally (using shared `computeSlotPrice`) so owner sees what users will see, including edge hours.

### 6.4 Blackouts `/owner/venues/[venueId]/boxes/[boxId]/blackouts`
- Calendar (react-day-picker) with one-off blackout dates highlighted.
- Side panel: list of recurring weekday blackouts (Mon/Tue/...). Toggle each.
- Reason field optional, ≤ 200 chars.
- On adding: if there are confirmed bookings on that date, backend returns 409 with the booking list — show modal: "Cancel these N bookings first (with full refund)?" with one-click bulk cancel option.

### 6.5 Photo uploader (`VenuePhotoUploader`)
- Multi-file drag/drop.
- For each file:
  1. Validate type + size client-side.
  2. Request presigned upload via POST `/storage/presign-upload` with purpose + content type.
  3. PUT to R2 directly with returned URL.
  4. POST keys to backend on save.
- Progress UI per file.
- Reorder via drag handles. Cover photo = first item.

---

## 7. Bookings

### 7.1 List `/owner/bookings`
- `BookingsTable` columns: Date, Time, Venue, Box, User (last 4 digits + name if shared), Status, Advance ₹, Balance ₹, Created.
- Filters: venue (multi), box (multi), status (multi), date range, search by user phone (full match).
- Sort: slot start desc default.
- CSV export button → GET `/owners/me/bookings?format=csv&...`.
- Pagination cursor or page + size.

### 7.2 Detail `/owner/bookings/[id]`
- Slot info (date/time, box, venue).
- User info (phone, name, email).
- Payment info (advance paid, balance due, Razorpay payment ID).
- Status timeline.
- Invoice download link if available.
- Actions:
  - **Mark NO_SHOW** — enabled only after `slotStartAt + 30 min`. Opens dialog with optional reason note. POST `/bookings/:id/no-show`.
  - **Cancel** — same dialog as user; refund preview based on tier; can override refund amount up to advance (e.g. owner-initiated full refund as goodwill). Backend allows owner to specify `refundAmount` ≤ advance.
  - **Add internal note** — `notes` field, PATCH `/bookings/:id` (owner-only field).

---

## 8. Reviews `/owner/reviews`
- `ReviewsList` grouped by venue.
- Each card: rating stars, text, user (first name or initial), date.
- "Reply" button → `ReviewReplyDialog` (≤500 chars). POST `/reviews/:id/reply`. Single edit allowed within 7 days.
- Unread filter: reviews without owner reply.

---

## 9. Subscription `/owner/subscription`

States:
1. **Free mode (env)** — banner: "Platform is currently free for all owners. No payment needed." Reason text from `PLATFORM_FREE_MODE_REASON`.
2. **Free granted (override)** — banner: "Free access granted by admin until {date}." With days-remaining indicator.
3. **Active subscription** — shows plan, billing period, next charge date.
4. **PAST_DUE** — red banner "Renew to keep your listings live."

Even when in state 1/2, the page lets owner browse plans (`PlanCard` for each) but the Subscribe button is disabled with tooltip: "You currently have free access."

When in paid mode and no subscription:
- Plans grid → Choose Plan → POST `/subscriptions/me/subscribe?planCode=...` → platform's Razorpay Checkout opens (platform-level keys, not owner's).
- On success: webhook updates subscription, page refreshes.

Cancel subscription button (PAST_DUE protection): cancels auto-renew but keeps active until period end.

Display history of past payments (last 12 months) via `/subscriptions/me/payments`.

---

## 10. Settings

### 10.1 Profile `/owner/settings/profile`
- Email (read-only after verification), name, phone.
- Change password section (current password + new + confirm).
- Connected accounts: Google badge (connect/disconnect).
- Logout-all-devices button.

### 10.2 KYC `/owner/settings/kyc`
- `KycForm` (same as onboarding step 2) — editable.
- Updating bank requires step-up.

### 10.3 Razorpay `/owner/settings/razorpay`
- Read-only: `keyId` masked (`rzp_live_••••XXXX`), webhook URL with copy button, lastVerifiedAt.
- "Rotate keys" → opens `StepUpDialog` then `RazorpayKeyForm`.

### 10.4 Bank `/owner/settings/bank`
- Bank account holder, last-4 of account, IFSC.
- "Update bank" → step-up + form.

---

## 11. Owner audit `/owner/audit`
- Last 90 days of owner's own actions (created venue, updated pricing, marked NO_SHOW, etc.) + super-admin actions affecting owner (approval, suspension).
- Read-only.
- Backend filter: `actorType=OWNER&actorId={me}` OR `targetType=Owner&targetId={me}`.

---

## 12. Notifications (in-app stub)
- Bell icon with badge.
- For v1, badges only on Reviews (unread = no owner reply) and on Bookings (today's bookings without invoice generated).
- Real notification center deferred.

---

## 13. Validation & UX rules

- Money inputs accept ₹ symbol and commas, parse to paise on submit.
- All destructive actions go through `ConfirmDialog` with typed-name confirmation if a venue/booking name applies.
- Toasts: success (3s), error (6s), info (4s). Top-right desktop, bottom mobile.
- Form drafts auto-saved to `sessionStorage` on field blur for KYC, Razorpay, and venue forms (cleared on successful submit) — protects against accidental tab close.
- Time displayed in IST consistently with timezone label ("Today, 7:00 PM IST").

---

## 14. Permissions matrix

| Capability | Owner (KYC verified, Razorpay configured) | Owner (KYC pending) | Owner (suspended) |
|---|---|---|---|
| View own dashboard | ✓ | ✓ | ✓ (read-only banner) |
| Create venue | ✓ | ✓ (saved as DRAFT) | ✗ |
| Submit venue for approval | ✓ | ✗ (`KYC_INCOMPLETE`) | ✗ |
| Edit pricing | ✓ | ✓ | ✗ |
| Receive bookings | ✓ (after approval) | ✗ | ✗ |
| Issue refund | ✓ | ✓ | ✗ |
| Subscribe / pay | ✓ | ✓ | ✓ |

---

## 15. Testing

### Component tests (Vitest)
- `PricingTableEditor` validation (gaps, overlaps).
- `BlackoutCalendar` conflict detection display.
- `StepUpDialog` happy path + 429 + 401.

### E2E (Playwright)
1. `onboarding.spec.ts` — full wizard to "submitted for approval".
2. `pricing.spec.ts` — set rules, see chart preview update.
3. `blackout.spec.ts` — add blackout with conflicting bookings → bulk-cancel flow.
4. `bookings.spec.ts` — filter, export CSV, mark NO_SHOW after slot end.
5. `reviews.spec.ts` — reply to review.
6. `razorpay-rotate.spec.ts` — step-up + key rotation with mocked backend success.
7. `subscription-free-mode.spec.ts` — free mode banner blocks Subscribe button; toggle off (test fixture) shows plans + checkout.

---

## 16. Build sequence

1. **Shell setup.** App layout, sidebar/topbar, theme, NextAuth wiring with backend.
2. **Owner auth pages.** Login, register, verify, forgot/reset, Google.
3. **Onboarding wizard skeleton.** Each step renders standalone first.
4. **Settings: profile + KYC.** Form + PATCH endpoints.
5. **Settings: Razorpay + Bank with step-up dialog.**
6. **Venues list + Create venue form + photo uploader.**
7. **Box CRUD + photo uploader.**
8. **Pricing editor with live engine preview.**
9. **Blackouts calendar + conflict flow.**
10. **Venue submit-for-approval + status badges.**
11. **Dashboard with stat tiles + charts.**
12. **Bookings list + filters + CSV.**
13. **Booking detail + NO_SHOW + owner-side cancel.**
14. **Reviews list + reply.**
15. **Subscription page with free-mode handling.**
16. **Owner audit page.**
17. **Polish: empty states, drafts, toasts, mobile nav.**
18. **E2E suite.**

---

## 17. Acceptance criteria

- Brand-new owner can sign up, complete KYC + Razorpay + first venue + first box + pricing, and submit for approval in one sitting without leaving the wizard.
- Pricing editor refuses to save until full opening-hours coverage is met for both day types, with clear inline errors.
- Adding a blackout that conflicts with confirmed bookings prompts the bulk-cancel flow; no silent failure.
- Step-up dialog requires fresh OTP every time Razorpay keys or bank are updated.
- Free-mode banner displays the correct reason and the Subscribe action is consistently disabled while active.
- Mark-NO_SHOW is only enabled at `slotStartAt + 30 min` (UI matches backend rule).
- All money inputs and outputs are paise-faithful (no rounding drift across forms).
- Owner page first paint < 1.5s on a 4G connection; sidebar interactions feel instant (<100ms).
- All destructive actions audit-logged on the backend.
