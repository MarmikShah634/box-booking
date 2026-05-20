import { z } from 'zod';

export const PhoneSchema = z.string().min(1).max(15);

export const SendOtpSchema = z.object({
  phone: PhoneSchema,
});

export const VerifyOtpSchema = z.object({
  phone: PhoneSchema,
  otp: z.string().length(6),
});

export const PasswordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one digit');

export const OwnerRegisterSchema = z.object({
  email: z.string().email(),
  password: PasswordSchema,
  name: z.string().min(2).max(100),
  phone: PhoneSchema,
});

export const OwnerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const CreateVenueSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(2000).optional(),
  address: z.string().min(10).max(300),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  geoLat: z.number().min(-90).max(90).optional(),
  geoLng: z.number().min(-180).max(180).optional(),
  amenities: z.array(
    z.enum([
      'parking',
      'washroom',
      'floodlight',
      'cafeteria',
      'equipment',
      'seating',
      'drinking_water',
      'first_aid',
    ]),
  ),
});

export const CreateBoxSchema = z.object({
  name: z.string().min(1).max(50),
  surfaceType: z.enum(['TURF', 'MAT', 'CONCRETE', 'OTHER']),
  defaultHourlyPrice: z.number().int().min(10000),
  openingHour: z.number().int().min(0).max(23),
  closingHour: z.number().int().min(1).max(24),
  photos: z.array(z.string()).optional(),
});

export const PricingRuleSchema = z.object({
  dayType: z.enum(['WEEKDAY', 'WEEKEND']),
  startHour: z.number().int().min(0).max(23),
  endHour: z.number().int().min(1).max(24),
  price: z.number().int().min(10000),
});

export const CreateBlackoutSchema = z.object({
  type: z.enum(['ONE_OFF', 'RECURRING_WEEKLY']),
  date: z.string().optional(),
  weekday: z.number().int().min(0).max(6).optional(),
  reason: z.string().max(200).optional(),
});

export const CreateHoldSchema = z.object({
  boxId: z.string(),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotHour: z.number().int().min(0).max(23),
});

export const InitiateBookingSchema = z.object({
  holdId: z.string(),
});

export const CreateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().max(1000).optional(),
});

export const ReviewReplySchema = z.object({
  ownerReply: z.string().min(1).max(500),
});

export const KycSchema = z.object({
  gstin: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/)
    .optional(),
  pan: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/)
    .optional(),
  bankAccountHolderName: z.string().min(2).max(100),
  bankAccountNumber: z.string().min(9).max(18),
  bankIfsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/),
});

export const RazorpayKeysSchema = z.object({
  keyId: z.string().min(1),
  keySecret: z.string().min(1),
  webhookSecret: z.string().min(1),
});

export type CreateVenueInput = z.infer<typeof CreateVenueSchema>;
export type CreateBoxInput = z.infer<typeof CreateBoxSchema>;
export type KycInput = z.infer<typeof KycSchema>;
export type RazorpayKeysInput = z.infer<typeof RazorpayKeysSchema>;
export type CreateHoldInput = z.infer<typeof CreateHoldSchema>;
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
