# User Frontend — Implementation Spec

**App:** `apps/user-web`
**Framework:** Next.js 14+ (App Router, RSC)
**Language:** TypeScript (strict)
**Styling:** Tailwind CSS + shadcn/ui (from `packages/ui`)
**Forms:** React Hook Form + Zod (shared schemas from `packages/shared`)
**State:** Zustand for client-side ephemeral state (hold countdown, filter UI); URL query params for filters; server components for data fetching
**Data fetching:** native `fetch` with custom typed client; React Query only on client components that poll or mutate
**Payments:** Razorpay Checkout (`checkout.razorpay.com/v1/checkout.js`)
**Auth:** httpOnly cookie set by API; client uses `/auth/user/me` to know if logged in
**Maps:** none v1
**Analytics:** none v1 (hook left for later)
**PWA:** `next-pwa` plugin

Audience: anyone building Sphere of "user-web" with no other context. Every page, component, behavior, and call below is specified.

---

## 1. Project layout

```
apps/user-web/
├── app/
│   ├── layout.tsx                 # root layout, fonts, cookie banner, toaster
│   ├── globals.css                # Tailwind base
│   ├── page.tsx                   # Home
│   ├── (public)/
│   │   ├── city/[city]/page.tsx   # city listing
│   │   └── venue/[slug]/page.tsx  # venue detail
│   ├── book/[boxId]/page.tsx      # booking sheet
│   ├── auth/
│   │   ├── login/page.tsx         # phone entry
│   │   └── verify/page.tsx        # OTP entry
│   ├── me/
│   │   ├── layout.tsx             # auth guard
│   │   ├── page.tsx               # dashboard (upcoming + past)
│   │   ├── bookings/[id]/page.tsx # booking detail + cancel
│   │   ├── reviews/page.tsx       # pending reviews
│   │   ├── profile/page.tsx       # name + email
│   │   └── data/page.tsx          # export + delete account
│   ├── legal/
│   │   ├── terms/page.mdx
│   │   ├── privacy/page.mdx
│   │   ├── refund/page.mdx
│   │   └── cancellation/page.mdx
│   ├── manifest.ts                # PWA manifest
│   ├── icon.png
│   ├── apple-icon.png
│   ├── opengraph-image.png
│   ├── robots.ts
│   ├── sitemap.ts
│   ├── error.tsx                  # root error boundary
│   ├── not-found.tsx
│   └── loading.tsx
├── components/
│   ├── home/
│   │   ├── Hero.tsx
│   │   ├── CityPicker.tsx
│   │   └── FeaturedVenues.tsx
│   ├── listing/
│   │   ├── Filters.tsx
│   │   ├── VenueCard.tsx
│   │   └── EmptyState.tsx
│   ├── venue/
│   │   ├── PhotoCarousel.tsx
│   │   ├── BoxList.tsx
│   │   ├── PricingTable.tsx
│   │   └── ReviewSummary.tsx
│   ├── booking/
│   │   ├── DatePicker.tsx
│   │   ├── SlotGrid.tsx
│   │   ├── PriceBreakdown.tsx
│   │   ├── HoldCountdown.tsx
│   │   ├── ConfirmSheet.tsx
│   │   └── RazorpayLauncher.tsx
│   ├── me/
│   │   ├── BookingCard.tsx
│   │   ├── CancelDialog.tsx       # shows refund preview based on tier
│   │   └── ReviewDialog.tsx
│   ├── auth/
│   │   ├── PhoneInput.tsx
│   │   └── OtpInput.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── MobileNav.tsx
│   │   ├── Footer.tsx
│   │   └── CookieBanner.tsx
│   └── ui/                        # re-exported from packages/ui
├── lib/
│   ├── api.ts                     # typed fetch client with refresh handling
│   ├── auth.ts                    # cookie helpers (server-side reads)
│   ├── razorpay.ts                # loadScript + open checkout
│   ├── currency.ts                # paise → ₹X,XXX.XX
│   ├── time.ts                    # IST date helpers
│   └── analytics.ts               # stub, no-op v1
├── store/
│   ├── holdStore.ts               # Zustand: active hold + countdown
│   └── filterStore.ts             # filter draft state before commit to URL
├── hooks/
│   ├── useCurrentUser.ts
│   ├── useHoldCountdown.ts
│   └── useSlotAvailability.ts     # polls /slots/availability every 20s on focus
├── content/legal/
│   ├── terms.mdx
│   ├── privacy.mdx
│   ├── refund.mdx
│   └── cancellation.mdx
├── public/
│   ├── icons/ (PWA)
│   └── images/
├── middleware.ts                  # auth redirect for /me/*
├── next.config.mjs                # MDX, image domains, PWA wrapper
├── tailwind.config.ts
├── postcss.config.cjs
├── tsconfig.json
└── package.json
```

---

## 2. Design system

- Use `packages/ui` (shadcn/ui base). Tokens defined in `tailwind.config.ts`:
  - Primary: `emerald-600` (cricket pitch green)
  - Surface: `zinc-50` / `zinc-900` (dark mode auto via `prefers-color-scheme`)
  - Accent: `amber-500` (CTAs hover)
  - Radius: `0.75rem` default
  - Font: Inter (variable), loaded via `next/font/google`
- Mobile-first. Breakpoints: `sm` 640, `md` 768, `lg` 1024, `xl` 1280.
- All interactive elements have explicit focus styles (Tailwind `focus-visible:ring-2 ring-emerald-500`).
- Touch targets ≥ 44×44 px.
- Skeleton loaders for every async page (use `loading.tsx` + per-component skeletons).
- All forms validate on blur and show inline errors; submit button disabled until valid + loading state during submit.

---

## 3. Routing & access

| Route | Type | Auth | Notes |
|---|---|---|---|
| `/` | RSC | public | Home with hero + city picker |
| `/city/[city]` | RSC | public | Venue listing for canonical city slug |
| `/venue/[slug]` | RSC | public | Venue detail |
| `/book/[boxId]` | RSC + Client | redirect to login if not authed | Booking funnel |
| `/auth/login` | Client | public | Phone entry |
| `/auth/verify` | Client | public | OTP entry, `phone` carried via query string |
| `/me` | RSC | required | Dashboard |
| `/me/bookings/[id]` | RSC | required | Detail + cancel |
| `/me/profile` | Client | required | Edit name/email |
| `/me/data` | Client | required | Export + delete |
| `/legal/{slug}` | RSC/MDX | public | Static |

`middleware.ts` checks for refresh-token cookie on `/me/*` and `/book/[boxId]`. If absent, redirect to `/auth/login?next=<original>`.

After login, `next` is honored via redirect.

---

## 4. Typed API client (`lib/api.ts`)

- Wraps `fetch`. Reads `PUBLIC_API_URL` from env.
- All endpoints typed via shared package (`@boxcricket/shared` re-exporting Zod-inferred types).
- On 401: attempt one silent refresh via `/auth/user/refresh` (uses cookie); on success, retry once; on failure, redirect to login (only on client-side).
- Server-side calls (in RSC) attach the incoming request's `Cookie` header so user-bound requests work in SSR.
- Returns typed result `{ ok: true, data } | { ok: false, error }`.

Example:
```ts
const res = await api.getVenuesPublic({ city: 'bangalore', sort: 'rating' });
if (!res.ok) throw new Error(res.error.message);
```

All money values stay in paise across the wire; formatting only at the render boundary via `lib/currency.ts`.

---

## 5. Pages

### 5.1 Home `/`

- Hero (full-width image + tagline + CTA "Book a turf near you").
- City picker (`CityPicker.tsx`): grid of city tiles (Bangalore, Mumbai, Pune, ...). Source from `/super-admin/cities` cached server-side, ISR every 24h. Tapping a tile navigates to `/city/[slug]`.
- "Featured venues" section: server-fetch top 6 venues by review-count from `/venues/public?sort=top&pageSize=6`. Card shows photo, name, city, starting price, rating.
- Footer with legal links + social.
- SEO: title "Book box cricket turfs near you — {brand}". Open Graph image.

### 5.2 City listing `/city/[city]`

- Header: city name, total venue count.
- `Filters.tsx` (sticky on mobile, sidebar on desktop):
  - Price range slider (₹500 – ₹3000, paise on wire)
  - Date picker (today + 14 days)
  - Time of day chips: Morning (6-12) / Afternoon (12-17) / Evening (17-23)
  - Amenities checkbox group (parking, washroom, floodlight, cafeteria, equipment, seating, drinking_water, first_aid)
  - Sort dropdown: Recommended / Price low→high / Rating
- Filter state mirrored in URL query params (so refresh / share preserves state). Use `useSearchParams` + replace navigation, debounced 250ms.
- Listing grid: `VenueCard` (photo, name, area, starting price, ⭐ rating + review count, "Book now" button).
- Pagination: cursor-based via `?page=`. Show "Load more" button (no infinite scroll for SEO clarity).
- Empty state: illustration + suggestion to broaden filters.

Data fetching: server component; passes query to `/venues/public`. On filter change, full URL replacement triggers refetch.

### 5.3 Venue detail `/venue/[slug]`

- Photo carousel (full-width on mobile, 2/3 width on desktop) using `embla-carousel-react`. Lazy-load all but first photo.
- Right side (sticky on desktop): "Pick a box" panel — list of boxes with starting price + "Book" button → `/book/[boxId]`.
- Below carousel: description, amenities pills, address with copy button (no map v1).
- Pricing table (`PricingTable.tsx`): rows are time-bands, cols are weekday/weekend, prices in ₹.
- Reviews section: average rating, distribution bar, latest 5 reviews. "Load more" paginates.
- "Cancellation policy" callout block citing tiers.
- SSR fetch from `/venues/public/{slug}`.
- 404 if API returns 404 (use `notFound()`).
- SEO: structured-data JSON-LD `LocalBusiness` + `SportsActivityLocation`.

### 5.4 Booking funnel `/book/[boxId]`

Server-rendered shell; client component handles interaction (`<BookingFunnel client />`).

Stages (all in one URL, no navigations between):

#### Stage A — pick date & slot
- Date picker (next 14 days). Default = today.
- `SlotGrid.tsx`: vertical list of hours (e.g. 6:00, 7:00 ...). Each row shows state via color:
  - AVAILABLE → green, tappable
  - BOOKED → grey, disabled
  - HELD → amber, disabled, tooltip "Held by another user"
  - BLACKOUT → red diagonal stripes, "Closed: {reason}"
  - PAST / CLOSED → light grey
- Tapping AVAILABLE highlights it and shows `PriceBreakdown` panel: hourly price, total, advance (50%), balance due at venue.
- Tap "Confirm slot" → POST `/bookings/holds` → on success, store hold in Zustand `holdStore` (with `expiresAt`) → advance to Stage B.
- On 409 SLOT_NOT_AVAILABLE → toast error, refresh slot grid.

`useSlotAvailability` hook polls every 20 seconds when tab is focused. Pauses when hidden.

#### Stage B — review & pay
- `ConfirmSheet.tsx`:
  - Venue, box, date, hour summary.
  - Price breakdown (collapsed by default, expandable).
  - `HoldCountdown.tsx` showing mm:ss until hold expires. Color: green > 3 min, amber 1-3 min, red < 1 min.
  - User contact (auto-filled phone, editable name/email — saved to user profile on submit).
  - Cancellation policy mini-card.
  - Checkbox: "I agree to the terms & cancellation policy" → required.
  - "Pay ₹X advance" button.
- On click: POST `/bookings/initiate` with holdId. Receive `{ booking, razorpay }`.
- Open Razorpay Checkout via `RazorpayLauncher` (loads `checkout.razorpay.com/v1/checkout.js` lazily on first need; show splash). Pass `key`, `order_id`, `amount`, `currency`, `name=Brand`, `description=Booking #{id}`, `prefill`.
- On Razorpay success callback: redirect to Stage C (success). On dismiss/failure: stay on Stage B; allow retry (booking remains PENDING_PAYMENT until hold expires; if expired, restart).

#### Stage C — success
- Confirmation screen with venue address, time, balance due at venue, link to download GST invoice (signed URL fetched from `/invoices/:id`).
- "Share with team" button (Web Share API). Falls back to copy-to-clipboard.
- CTA "Go to my bookings".

#### Stage D — failure handler
- Specific copy for: payment failed, hold expired, slot stolen.
- For "slot stolen" (rare): show "Pick a different slot" CTA back to Stage A.

### 5.5 Auth pages

#### `/auth/login`
- Phone input (`PhoneInput.tsx`): single field with prefix `+91` and 10-digit input. Mask groups for readability.
- On submit: POST `/auth/user/send-otp`. On 204 → push to `/auth/verify?phone=...`. On 429 → friendly message "Too many requests, try in {n} minutes".
- Below: "By continuing you agree to our Terms & Privacy" with inline links.

#### `/auth/verify`
- 6-digit OTP input (`OtpInput.tsx`): six separate boxes, auto-advance, paste-friendly, numeric-only keyboard on mobile.
- "Resend OTP" button enabled after 30s countdown.
- On submit: POST `/auth/user/verify-otp`. On 200 → if user has no name, push to `/me/profile?onboarding=1`; else push to `next` query or `/me`.
- On 5 wrong attempts API returns 429; show "Too many attempts, request a new code" with disabled state.

### 5.6 `/me` dashboard
- Two tabs: Upcoming / Past.
- Each booking rendered as `BookingCard` (date, venue, box, slot time, status, advance paid, balance due, "View" action).
- Empty state when no bookings.

### 5.7 `/me/bookings/[id]`
- Full detail.
- If status = CONFIRMED and slot in future: "Cancel booking" button → `CancelDialog`.
- `CancelDialog` makes a preview call client-side (compute hours-until-slot, look up tier from booking's policy snapshot which is included in response) and shows refund amount before confirming.
- On confirm: POST `/bookings/:id/cancel`. Show success toast, refresh.
- If status = COMPLETED and no review: "Leave a review" → `ReviewDialog`.
- "Download invoice" link if available.

### 5.8 `/me/profile`
- Form: name (required), email (optional but used for invoice).
- On save: PATCH `/users/me`.

### 5.9 `/me/data`
- "Export my data" button → POST `/users/me/data-export` → "We'll email you the file in a few minutes".
- "Delete account" button → confirm dialog with checkbox "I understand this deletes all my bookings and reviews after 30 days" → POST `/users/me/delete`.

### 5.10 Legal pages
- MDX in `content/legal/`. Imported via `next.config.mjs` MDX plugin.
- Each has frontmatter `title`, `updated` (date).
- Required disclaimers:
  - Terms: jurisdiction = Indian courts of the city where the venue is located.
  - Privacy: data categories (phone, name, email, booking history), processors (MSG91, Resend, Cloudflare, Razorpay), DPDP rights.
  - Refund: mirrors backend tiers.
  - Cancellation: same.

---

## 6. PWA

`app/manifest.ts`:
```ts
export default function manifest() {
  return {
    name: 'BoxCricket — Book a turf',
    short_name: 'BoxCricket',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#059669',
    icons: [/* 192, 512, maskable */]
  };
}
```

Service worker via `next-pwa`. Strategies:
- HTML pages: NetworkFirst.
- Static assets: CacheFirst with revalidation.
- `/me/*` GET: NetworkOnly (must be fresh).
- API mutations: NetworkOnly (no offline queue v1).

Install prompt: detect `beforeinstallprompt` event, show non-blocking banner after user has visited 3+ pages in session and hasn't dismissed before.

---

## 7. Cookie banner

`CookieBanner.tsx` shown when no `cookie-consent` localStorage entry. Two buttons: Accept / Decline. No analytics cookies loaded until accepted (v1 has no analytics, so banner is informational only; it must still show because user picked it as required).

Banner explains: essential cookies (auth) are required; we collect no others currently.

---

## 8. Error states

- Root `app/error.tsx` for uncaught errors → "Something went wrong" + retry.
- Per-page error boundaries on `/book` (critical UX): show specific recovery actions, not generic message.
- All API errors mapped to friendly toasts using `error.error` code → message dictionary in `lib/errorMessages.ts`.

---

## 9. Performance

- Use `next/image` for all R2-hosted photos with `domains` configured in `next.config.mjs`.
- Pre-render city listing pages with `generateStaticParams` for known cities, then `revalidate: 300`.
- Critical CSS inlined by Next defaults.
- Defer Razorpay script load until user clicks pay.
- Bundle target: `/` < 100 KB gzip JS; `/book/[boxId]` < 180 KB.

---

## 10. Accessibility

- All inputs have `<label>` association.
- Slot grid: each slot is a `<button>` with `aria-label` "Book 7 PM, ₹600, available" / "7 PM not available".
- Carousel: keyboard arrow navigation, `aria-roledescription="carousel"`.
- Color contrast meets WCAG AA on light + dark.
- `prefers-reduced-motion` disables auto-advance + heavy transitions.

---

## 11. Analytics (stub)

`lib/analytics.ts` exposes `track(event, props)` and `identify(userId)`. Both no-op v1. Call sites already wired:
- `home_view`, `city_view`, `venue_view`, `book_step_a`, `book_step_b`, `book_payment_initiated`, `book_payment_success`, `book_payment_failed`, `cancel_initiated`, `cancel_completed`, `review_submitted`.

Swapping to PostHog later = replace the implementation file only.

---

## 12. Testing

### Component tests
- Vitest + React Testing Library on critical components: `SlotGrid` (rendering by status), `PriceBreakdown` (math), `CancelDialog` (tier preview), `HoldCountdown` (timing).

### E2E (Playwright)
Tests live in `apps/user-web/e2e/`:

1. `auth.spec.ts` — login flow (uses test phone & API test endpoint returning fixed OTP `123456` in `NODE_ENV=test`).
2. `discover.spec.ts` — open home, pick city, apply filters, open venue.
3. `book.spec.ts` — happy path through Stage A → B → C with mocked Razorpay handler returning success.
4. `book-race.spec.ts` — open booking page in two browser contexts, both confirm same slot; assert one succeeds and the other gets recovery flow.
5. `cancel.spec.ts` — cancel a confirmed booking, assert refund amount matches expected tier.
6. `me.spec.ts` — review submission flow after COMPLETED booking.

CI: Playwright runs against a staging deploy nightly + on PRs that touch user-web.

---

## 13. Build sequence

1. **Scaffold.** `pnpm create next-app apps/user-web` (App Router, TS, Tailwind). Wire `packages/ui`, `packages/shared`. Configure MDX + `next-pwa`.
2. **Design tokens + layout shell.** Header, Footer, dark mode, base typography.
3. **API client + auth cookie plumbing.** Refresh interceptor.
4. **Auth pages.** Phone input, OTP input, route guards in middleware.
5. **Home.** Hero + city picker (static city list initially) + featured-venues server fetch.
6. **City listing.** Filters + cards + pagination + URL state.
7. **Venue detail.** Carousel + box list + pricing table + reviews.
8. **Booking funnel Stage A.** Slot grid + availability polling + price breakdown + create hold.
9. **Booking funnel Stage B + C.** Hold countdown, initiate booking, Razorpay launcher, success state.
10. **`/me` dashboard.** Bookings list.
11. **Booking detail + cancel dialog.**
12. **Profile + data pages.**
13. **Review dialog.**
14. **Legal MDX pages.**
15. **Cookie banner.**
16. **PWA manifest + service worker + install prompt.**
17. **Error boundaries + skeletons + empty states polish.**
18. **Accessibility audit + Lighthouse pass.**
19. **E2E suite.**
20. **Performance tune to bundle targets.**

---

## 14. Acceptance criteria

- A new player can complete first booking in ≤ 90 seconds from `/` on a 4G connection.
- All filters preserved across reload.
- Booking funnel handles three failure modes gracefully (payment failed, hold expired, slot stolen).
- Hold countdown is visible at all times in Stage B and warns visually in last 60s.
- `/me/bookings/:id` cancel preview matches actual refunded amount within 1 rupee.
- App is installable as a PWA on Android Chrome.
- Lighthouse mobile: Performance ≥ 90, Accessibility = 100, Best Practices ≥ 95, SEO ≥ 95.
- No layout shift > 0.1 on critical pages.
- All copy in English; Hindi deferred to v2 (no hardcoded English strings outside `lib/i18n.ts` so future swap is mechanical).
