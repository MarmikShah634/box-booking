const ERROR_MAP: Record<string, string> = {
  // Auth
  OTP_EXPIRED: 'Your OTP has expired. Please request a new one.',
  OTP_INVALID: 'Incorrect OTP. Please check and try again.',
  OTP_MAX_ATTEMPTS: 'Too many attempts. Please request a new OTP.',
  PHONE_INVALID: 'Please enter a valid 10-digit mobile number.',
  USER_NOT_FOUND: 'Account not found. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',

  // Booking
  SLOT_UNAVAILABLE: 'This slot is no longer available. Please select another.',
  HOLD_EXPIRED: 'Your hold has expired. Please select a slot again.',
  HOLD_NOT_FOUND: 'Hold not found. Please restart your booking.',
  BOOKING_NOT_FOUND: 'Booking not found.',
  CANCEL_WINDOW_CLOSED: 'This booking can no longer be cancelled.',
  PAYMENT_FAILED: 'Payment was not completed. Please try again.',
  PAYMENT_VERIFICATION_FAILED: 'Payment verification failed. Please contact support.',

  // Venue
  VENUE_NOT_FOUND: 'Venue not found.',
  BOX_NOT_FOUND: 'Box not found.',

  // Generic
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Something went wrong. Please try again.',
  VALIDATION_ERROR: 'Please check your inputs and try again.',
}

export function getErrorMessage(code: string): string {
  return ERROR_MAP[code] || code || 'An unexpected error occurred.'
}

export function friendlyError(error: string): string {
  // Check if it's a known error code
  if (ERROR_MAP[error]) return ERROR_MAP[error]

  // Network/fetch errors
  if (error.toLowerCase().includes('network')) return ERROR_MAP.NETWORK_ERROR
  if (error.toLowerCase().includes('server')) return ERROR_MAP.SERVER_ERROR

  return error || ERROR_MAP.SERVER_ERROR
}
