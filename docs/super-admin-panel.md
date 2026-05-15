# Super-Admin Panel — Implementation Spec

**App:** `apps/admin-web` — super-admin routes under `/super-admin/*`
**Audience:** the platform operator (single seeded account — the founder)
**Framework:** Next.js 14+ App Router (same monorepo app as owner portal)
**Auth:** Email + password to a dedicated backend route, separate cookie scope from owner cookie
**Styling/forms/tables:** same stack as owner portal (Tailwind + shadcn/ui + TanStack Table + RHF + Zod)
**Access controls:** every write action requires fresh-ish session (< 30 min) and IP-allowlist (optional env). Every write also creates an `AuditLog`.

This document specifies everything required to build the super-admin surface. The shared `apps/admin-web` shell, auth scaffolding, and UI primitives are described in the owner-portal doc; this doc references them.

---

## 1. Project layout (super-admin subset)

```
apps/admin-web/
├── app/
│   ├── (auth-super-admin)/
│   │   ├── super-admin/login/page.tsx
│   │   └── super-admin/locked/page.tsx           # shown after lockout
│   ├── super-admin/
│   │   ├── layout.tsx                            # AppShell w/ super-admin sidebar; auth guard
│   │   ├── page.tsx                              # ops dashboard
│   │   ├── moderation/
│   │   │   ├── page.tsx                          # pending venues queue
│   │   │   └── [venueId]/page.tsx                # review detail
│   │   ├── owners/
│   │   │   ├── page.tsx
│   │   │   └── [ownerId]/page.tsx
│   │   ├── users/
│   │   │   ├── page.tsx
│   │   │   └── [userId]/page.tsx
│   │   ├── bookings/page.tsx                     # global view
│   │   ├── payments/page.tsx                     # failures + recent webhooks
│   │   ├── refunds/page.tsx                      # pending/stuck
│   │   ├── subscriptions/page.tsx
│   │   ├── settings/page.tsx                     # PlatformSettings editor
│   │   ├── cities/page.tsx
│   │   └── audit/
│   │       ├── page.tsx                          # browse + filter
│   │       └── export/page.tsx                   # CSV export form
│   └── middleware.ts                             # also handles /super-admin/* protection
├── components/super-admin/
│   ├── shell/
│   │   ├── SuperAdminSidebar.tsx
│   │   └── SuperAdminTopbar.tsx                  # always-visible "Logged in as SUPER ADMIN" red strip
│   ├── moderation/
│   │   ├── ModerationQueue.tsx
│   │   ├── VenueReviewPanel.tsx                  # photos, address, KYC, pricing summary, "Approve" / "Reject" / "Suspend"
│   │   ├── ApproveDialog.tsx
│   │   ├── RejectDialog.tsx
│   │   └── SuspendDialog.tsx
│   ├── owners/
│   │   ├── OwnersTable.tsx
│   │   ├── OwnerDetailPanel.tsx
│   │   ├── GrantFreeDialog.tsx
│   │   ├── SuspendOwnerDialog.tsx
│   │   └── ResetPasswordDialog.tsx
│   ├── users/
│   │   ├── UsersTable.tsx
│   │   ├── UserDetailPanel.tsx
│   │   └── BlockUserDialog.tsx
│   ├── ops/
│   │   ├── KpiTiles.tsx
│   │   ├── WebhookFailuresList.tsx
│   │   ├── QueueDepthChart.tsx
│   │   └── RecentAuditList.tsx
│   ├── refunds/
│   │   ├── RefundsQueue.tsx
│   │   └── RetryRefundDialog.tsx
│   ├── settings/
│   │   ├── SettingsForm.tsx
│   │   └── FreeModeToggleHint.tsx                # warns env still wins
│   ├── cities/
│   │   ├── CitiesList.tsx
│   │   └── AddCityDialog.tsx
│   └── audit/
│       ├── AuditTable.tsx
│       ├── AuditFilters.tsx
│       └── AuditDetailDrawer.tsx
├── lib/super-admin/
│   ├── api.ts                                    # typed client; all writes set X-Action-Reason header
│   └── colors.ts                                 # accent: red-600 (distinct from owner emerald)
└── store/super-admin/
    └── filtersStore.ts
```

`apps/admin-web/middleware.ts` enforces:
- `/super-admin/*` requires the super-admin cookie. Owner cookies do not grant access.
- IP allowlist (comma-separated CIDRs from `SUPER_ADMIN_IP_ALLOWLIST` env, optional). If unset, no IP enforcement.
- 30-minute idle timeout — last activity timestamp in session JWT; if older, redirect to re-login.

---

## 2. Visual differentiation

To make accidental cross-role confusion impossible:
- Primary accent across `/super-admin/*` is **red-600**, owner is emerald-600.
- A persistent red strip across the top: "Logged in as SUPER ADMIN — every action is audit-logged."
- Sidebar uses dark variant by default.
- Tab title prefix `[ADMIN]`.

---

## 3. Auth

| Endpoint | Method | Notes |
|---|---|---|
| `/auth/super-admin/login` | POST | as in backend doc |
| `/auth/super-admin/refresh` | POST | as in backend doc |
| `/auth/super-admin/logout` | POST | as in backend doc |

After 5 failed logins in 15 min: backend returns 423 and admin-web redirects to `/super-admin/locked` showing cooldown countdown.

No registration. No password reset via UI — handled out-of-band by re-running the seed script (documented in backend deployment).

---

## 4. Reason-required pattern

Every super-admin write **must** include a freeform `reason` string (5–500 chars). The UI dialog captures it; the API client sends `X-Action-Reason: <reason>` plus the request body. Backend persists it on the `AuditLog.metadata.reason` field.

This applies to: approve, reject, suspend (venue/owner/user/booking), grant-free, revoke-free, reset-password, block/unblock user, retry refund, settings update, city add.

---

## 5. Ops dashboard `/super-admin`

`KpiTiles`:
- Pending venue approvals (count, link → moderation)
- New owners last 7 days
- Bookings today (count)
- Booking-revenue today (aggregate advance, for ops visibility — money flows to owners, not platform)
- Refunds processed last 7 days
- Failed payments last 24h
- Subscription state breakdown (active / past-due / free-override / cancelled)

Charts:
- `QueueDepthChart`: each BullMQ queue's depth over last 24h (Prometheus query, embedded Grafana iframe if simpler, else custom Recharts).
- Webhook success rate trend.

Lists:
- `WebhookFailuresList` — last 20 failed/retrying webhooks. Row click opens drawer with payload (redacted) + retry action.
- `RecentAuditList` — last 10 super-admin actions (yours own).

---

## 6. Moderation queue `/super-admin/moderation`

`ModerationQueue` table columns: Venue name, Owner, City, Submitted (relative time), Photos count, Boxes count.

Default filter: `status = PENDING`. Toggle to also show APPROVED / REJECTED / SUSPENDED for review.

Bulk actions disabled v1 — each venue reviewed individually.

### Detail `/super-admin/moderation/[venueId]`

`VenueReviewPanel` shows:
- Venue: name, slug, description, address, photos (full size), amenities, pricing summary (table per box), opening hours.
- Owner: name, email, phone, KYC fields (GSTIN, PAN, bank last-4), Razorpay configured: yes/no, last activity.
- Status history (timeline).
- Side panel actions:
  - **Approve** → `ApproveDialog` (reason: "Looks good" default). POST `/super-admin/venues/:id/approve`.
  - **Reject** → `RejectDialog` (reason required, presets: "Photos unclear", "Address invalid", "Pricing too low/high", "Other"). POST `/super-admin/venues/:id/reject`.
  - **Suspend** (only if APPROVED) → `SuspendDialog`. POST `/super-admin/venues/:id/suspend`. Warning copy: "All future bookings will be cancelled with full refund." Backend executes the bulk-cancel + refund pipeline.
  - **Reinstate** (only if SUSPENDED) → POST `/super-admin/venues/:id/reinstate`.
- "View as a user" link → opens public listing page in new tab (only works when APPROVED).

Quality checklist sidebar (manual checks for the admin to tick before approving; purely UI aid, not enforced):
- Photos are real venue photos (not stock)
- Address is geocodable (manual sanity check)
- Pricing seems realistic for the area
- Boxes are properly named
- Cancellation window understood by owner (KYC submitted)

---

## 7. Owners `/super-admin/owners`

`OwnersTable` columns: Name, Email, Venues, Subscription, KYC, Created. Filters: search, suspended yes/no, free-override yes/no, KYC status.

Row click → `/super-admin/owners/[ownerId]`.

`OwnerDetailPanel` sections:
- Profile (name, email, phone, created)
- KYC details (GSTIN, PAN, bank last-4) with masked reveal-on-click (audit-logged)
- Subscription state with override-until date if any
- Venues table (with their statuses)
- Recent bookings (last 30)
- Recent payments / refunds
- Actions:
  - **Grant free subscription** → `GrantFreeDialog` (date input, reason). POST `/super-admin/owners/:id/grant-free`.
  - **Revoke free** → POST `/super-admin/owners/:id/revoke-free`.
  - **Suspend owner** → `SuspendOwnerDialog` (cascades: all owner venues set to SUSPENDED, future bookings refunded fully).
  - **Reset password** → `ResetPasswordDialog` → POST `/super-admin/owners/:id/reset-password` → email link sent.

---

## 8. Users `/super-admin/users`

`UsersTable`: Phone (masked except last 4), name, email, bookings count, blocked yes/no, created.
Filters: search by phone, blocked.

`UserDetailPanel`:
- Phone, name, email
- Bookings list with statuses
- Reviews authored
- Refund history
- Actions:
  - **Block** → `BlockUserDialog` (reason). POST `/super-admin/users/:id/block`. Backend revokes all refresh tokens for that user.
  - **Unblock** → POST `/super-admin/users/:id/unblock`.
- **Cannot read OTPs or PII beyond what's stored** — explicit copy reminder.

---

## 9. Bookings (global) `/super-admin/bookings`

Cross-venue view; same `BookingsTable` component as owner with extra column `Owner`. Filters add: ownerId, payment status, refundStatus. Read-only — super-admin does not cancel bookings here (per-booking actions allowed only via owner detail or moderation cascade).

---

## 10. Payments `/super-admin/payments`

Tabs:
- Failed payments (last 30 days)
- Webhook event log (last 7 days; filter by event type, status)

Row click → drawer with payload, signature verification result, processing log. Retry button enqueues `webhook-reprocessor` job (backend exposes `/super-admin/webhook-events/:id/retry`).

---

## 11. Refunds `/super-admin/refunds`

`RefundsQueue`: bookings with `refundAmount > 0` and not yet processed beyond 1 hour. Columns: booking id, owner, amount, age, last error.

Row action: **Retry** → `RetryRefundDialog` (confirms amount + reason). POST `/super-admin/refunds/:bookingId/retry`.

Manual mark-as-paid is **not** allowed via UI v1 — must succeed via Razorpay API. (Avoid drift.)

---

## 12. Subscriptions `/super-admin/subscriptions`

Two views:
- **Active** — list of owners with subscriptionStatus=ACTIVE (when paid mode); plan + next billing date.
- **Overrides** — list of `subscriptionOverrideUntil` grants; sortable by expiry. Row actions: extend, revoke.

`FreeModeToggleHint` near the top: shows current state:
- `Env PLATFORM_FREE_MODE = true → free mode forced ON regardless of DB or overrides.`
- `DB freeModeDbOverride = false. Toggle below changes it.`
- "Toggle Free Mode (DB)" requires reason.

---

## 13. Settings `/super-admin/settings`

`SettingsForm` mirrors `PlatformSettings`:
- `slotHoldTtlMinutes` (1–60)
- `advancePercent` (10–100)
- `cancelFullRefundHours` (1–168)
- `cancelHalfRefundHours` (must be < cancelFullRefundHours)
- `freeModeDbOverride` (toggle)
- `freeModeReason` (string)

Save requires reason. PATCH `/super-admin/settings`. Any change appears in audit immediately.

Inline alert: "These values are overridden by env at boot if env is set. Current env state: PLATFORM_FREE_MODE = {true|false}. Restart API to pick up env changes."

---

## 14. Cities `/super-admin/cities`

`CitiesList` columns: slug, name, venues count, created.
`AddCityDialog`: name input → POST `/super-admin/cities`. Slug auto-derived (lowercase, hyphen). Removing cities not supported v1 (orphans existing venues).

---

## 15. Audit `/super-admin/audit`

`AuditTable` columns: timestamp, actor type, actor (id + resolved name), action, target (type + id + link to detail), reason, IP.

Filters: date range, actor type, actor id, action (multi-select), target type/id.

Row click → `AuditDetailDrawer` with full metadata JSON (pretty-printed, payload-redacted view for PII like phone).

CSV export at `/super-admin/audit/export`:
- Date range required
- Filters applied
- Stream from backend (`/super-admin/audit-log/export?from&to&...`)
- Filename `audit-{from}-{to}.csv`

---

## 16. Notifications / paging
None in-product v1. Critical alerts (queue depth, payment failure rate) fire from Grafana → email/webhook outside the panel.

---

## 17. Testing

### Component tests
- Each Dialog component verifies "reason required" rule.
- `SettingsForm` validation (TTL bounds, half < full).

### E2E (Playwright)
1. `moderation.spec.ts` — log in as super-admin, approve a PENDING venue, assert audit entry + owner email stub.
2. `reject.spec.ts` — reject with reason, owner email stub asserted to contain reason.
3. `suspend-cascade.spec.ts` — suspend a venue that has 2 future bookings, assert refunds enqueued.
4. `grant-free.spec.ts` — grant free for 30 days, assert owner sees free banner in their portal session.
5. `settings.spec.ts` — change advancePercent → bookings created after change reflect new amount (integration spans backend).
6. `audit-export.spec.ts` — export CSV, validate header + at least one row.

---

## 18. Build sequence

1. **Shell + sidebar + red identity strip + middleware guard.**
2. **Super-admin auth: login, lockout page, refresh, logout, idle timeout.**
3. **Reason-attached API client + reusable Dialog primitives.**
4. **Moderation queue + venue review panel.**
5. **Approve/Reject/Suspend/Reinstate flows with audit assertions.**
6. **Owners table + detail panel.**
7. **Grant-free / Revoke-free / Suspend owner / Reset password dialogs.**
8. **Users table + detail + block/unblock.**
9. **Bookings global view (read-only).**
10. **Payments + webhook event log + retry.**
11. **Refunds queue + retry.**
12. **Subscriptions overview + overrides.**
13. **Platform settings editor + free-mode hint.**
14. **Cities admin.**
15. **Audit browser + CSV export.**
16. **Ops dashboard (KPIs, queue charts, webhook failures, recent audit).**
17. **Polish + visual-distinct theming pass.**
18. **E2E suite.**

---

## 19. Acceptance criteria

- Logging into super-admin from a different cookie/origin than owner works, and the two sessions do not bleed.
- 5 failed logins → 30 min lockout; recovery requires waiting.
- Every write action records an `AuditLog` row with `reason`, IP, actor id, before/after metadata where applicable.
- Approving a venue immediately appears in the public listing endpoint without redeploy.
- Suspending a venue cancels all future bookings with full refund (verifiable by checking booking statuses and refund queue).
- Grant-free → owner immediately sees free banner on next request and can submit venues even when `PLATFORM_FREE_MODE` env is false.
- Toggling `freeModeDbOverride` in settings is overridden by env when env is `true`; UI shows the warning hint.
- Audit CSV export covers all writes in the requested window with deterministic column order and no missing rows.
- 30-minute idle timeout silently refreshes if used recently; logs out cleanly otherwise.
- IP allowlist (when set) refuses access with a clear page.
- Reason input is enforced everywhere; pressing Confirm without reason shows inline error.
