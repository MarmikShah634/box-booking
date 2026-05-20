// ─── Owner & Auth ─────────────────────────────────────────────────────────────

export interface Owner {
  id: string
  email: string
  name: string
  phone?: string
  avatarUrl?: string
  kycStatus: 'pending' | 'submitted' | 'verified' | 'rejected'
  razorpayConnected: boolean
  subscriptionPlan: 'free' | 'starter' | 'pro'
  subscriptionExpiresAt?: string
  onboardingCompleted: boolean
  createdAt: string
}

// ─── Venue ────────────────────────────────────────────────────────────────────

export interface Venue {
  id: string
  ownerId: string
  name: string
  slug: string
  description?: string
  address: string
  city: string
  state: string
  pincode: string
  latitude?: number
  longitude?: number
  amenities: string[]
  photos: VenuePhoto[]
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'suspended'
  rejectionReason?: string
  createdAt: string
  updatedAt: string
}

export interface VenuePhoto {
  id: string
  url: string
  isPrimary: boolean
  order: number
}

// ─── Box ──────────────────────────────────────────────────────────────────────

export interface Box {
  id: string
  venueId: string
  name: string
  description?: string
  capacity: number
  sportType: string
  amenities: string[]
  photos: string[]
  isActive: boolean
  pricingRules: PricingRule[]
  createdAt: string
}

export interface PricingRule {
  id: string
  boxId: string
  startHour: number // 0-23
  endHour: number // 1-24
  weekdayPricePaise: number
  weekendPricePaise: number
  label?: string
}

// ─── Blackout ─────────────────────────────────────────────────────────────────

export interface Blackout {
  id: string
  boxId: string
  date: string // YYYY-MM-DD
  startHour?: number
  endHour?: number
  reason?: string
  isFullDay: boolean
}

// ─── Booking ──────────────────────────────────────────────────────────────────

export interface Booking {
  id: string
  boxId: string
  userId: string
  userName: string
  userPhone: string
  venueId: string
  venueName: string
  boxName: string
  date: string // YYYY-MM-DD
  startHour: number
  endHour: number
  durationHours: number
  amountPaise: number
  status: 'confirmed' | 'cancelled' | 'no_show' | 'completed'
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed'
  razorpayOrderId?: string
  razorpayPaymentId?: string
  cancellationReason?: string
  createdAt: string
}

// ─── Review ───────────────────────────────────────────────────────────────────

export interface Review {
  id: string
  bookingId: string
  userId: string
  userName: string
  venueId: string
  rating: number
  comment: string
  ownerReply?: string
  ownerRepliedAt?: string
  createdAt: string
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export interface SubscriptionPlan {
  id: string
  name: string
  displayName: string
  pricePaise: number
  billingCycle: 'monthly' | 'yearly'
  features: string[]
  maxVenues: number
  maxBoxesPerVenue: number
  commissionPercent: number
}

export interface Subscription {
  id: string
  ownerId: string
  plan: string
  status: 'active' | 'expired' | 'cancelled'
  currentPeriodStart: string
  currentPeriodEnd: string
  razorpaySubscriptionId?: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface OwnerDashboard {
  totalRevenuePaise: number
  totalBookings: number
  occupancyRate: number
  pendingReviews: number
  todayBookings: Booking[]
  revenueChart: { date: string; revenuePaise: number }[]
  occupancyChart: { date: string; rate: number }[]
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string
  actorId: string
  actorType: 'owner' | 'super_admin' | 'system'
  actorEmail?: string
  action: string
  resourceType: string
  resourceId: string
  reason?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

// ─── Super-Admin ──────────────────────────────────────────────────────────────

export interface SuperAdmin {
  id: string
  email: string
  name: string
  role: 'super_admin'
}

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  isBlocked: boolean
  blockedReason?: string
  totalBookings: number
  createdAt: string
}

export interface PlatformSettings {
  defaultCommissionPercent: number
  maxVenuePhotos: number
  maxBoxPhotos: number
  freeModeEnabled: boolean
  freeModeExpiresAt?: string
  freeModeReason?: string
  maintenanceMode: boolean
  supportEmail: string
  razorpayWebhookSecret?: string
}

export interface City {
  id: string
  name: string
  state: string
  isActive: boolean
  venueCount: number
  createdAt: string
}

export interface WebhookFailure {
  id: string
  event: string
  payload: Record<string, unknown>
  errorMessage: string
  retryCount: number
  lastAttemptAt: string
  createdAt: string
}

export interface SuperAdminDashboard {
  totalOwners: number
  totalVenues: number
  totalBookings: number
  totalRevenuePaise: number
  pendingModerationCount: number
  pendingRefundsCount: number
  webhookFailureCount: number
  recentAuditLogs: AuditLog[]
  queueDepth: number
}

export interface Refund {
  id: string
  bookingId: string
  amountPaise: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  razorpayRefundId?: string
  reason?: string
  retryCount: number
  createdAt: string
  booking?: Booking
}

// ─── KYC ──────────────────────────────────────────────────────────────────────

export interface KycData {
  panNumber: string
  panName: string
  aadhaarNumber?: string
  gstNumber?: string
  bankAccountNumber: string
  bankIfsc: string
  bankAccountName: string
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
