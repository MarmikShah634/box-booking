export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'NO_SHOW'
  | 'PAYMENT_FAILED';

export type VenueStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type KycStatus = 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';

export type SlotStatus = 'AVAILABLE' | 'HELD' | 'BOOKED' | 'BLACKOUT' | 'PAST' | 'CLOSED';

export type SurfaceType = 'TURF' | 'MAT' | 'CONCRETE' | 'OTHER';

export interface SlotAvailabilityItem {
  hour: number;
  status: SlotStatus;
  priceInPaise: number | null;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  requestId?: string;
  issues?: Array<{ path: string; message: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
