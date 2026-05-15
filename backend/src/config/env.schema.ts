import { z } from 'zod';

export const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  PUBLIC_API_URL: z.string().min(1),
  PUBLIC_USER_WEB_URL: z.string().min(1),
  PUBLIC_ADMIN_WEB_URL: z.string().min(1),
  CORS_ALLOWED_ORIGINS: z.string().min(1),

  // Database
  DATABASE_URL: z.string().min(1),
  DATABASE_POOL_MAX: z.coerce.number().default(20),

  // Redis
  REDIS_URL: z.string().min(1),

  // Crypto
  JWT_PRIVATE_KEY_BASE64: z.string().min(1),
  JWT_PUBLIC_KEY_BASE64: z.string().min(1),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().default(900),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().default(2592000),
  ENCRYPTION_KEY_HEX: z.string().min(1),
  ARGON2_MEMORY_KB: z.coerce.number().default(65536),
  ARGON2_TIME_COST: z.coerce.number().default(3),
  ARGON2_PARALLELISM: z.coerce.number().default(1),

  // MSG91
  MSG91_AUTH_KEY: z.string().min(1),
  MSG91_SENDER_ID: z.string().min(1),
  MSG91_OTP_TEMPLATE_ID: z.string().min(1),
  MSG91_BOOKING_CONFIRM_TEMPLATE_ID: z.string().min(1),
  MSG91_REFUND_TEMPLATE_ID: z.string().min(1),

  // Resend
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM: z.string().email(),
  RESEND_REPLY_TO: z.string().email().optional(),

  // Cloudflare R2
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET: z.string().min(1),
  R2_PUBLIC_BASE_URL: z.string().min(1),
  R2_PRESIGN_TTL_SECONDS: z.coerce.number().default(3600),

  // Razorpay platform
  RAZORPAY_PLATFORM_KEY_ID: z.string().min(1),
  RAZORPAY_PLATFORM_KEY_SECRET: z.string().min(1),
  RAZORPAY_PLATFORM_WEBHOOK_SECRET: z.string().min(1),

  // Free mode
  PLATFORM_FREE_MODE: z.string().default('false'),
  PLATFORM_FREE_MODE_REASON: z.string().optional(),

  // Super-admin seed
  SUPER_ADMIN_EMAIL: z.string().email(),
  SUPER_ADMIN_PASSWORD_HASH: z.string().min(1),
  SUPER_ADMIN_NAME: z.string().default('Platform Admin'),

  // Google OAuth
  GOOGLE_OAUTH_CLIENT_ID: z.string().min(1),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().min(1),
  GOOGLE_OAUTH_CALLBACK_URL: z.string().min(1),

  // Booking defaults
  SLOT_HOLD_TTL_MINUTES: z.coerce.number().default(8),
  ADVANCE_PERCENT: z.coerce.number().default(50),
  CANCEL_FULL_REFUND_HOURS: z.coerce.number().default(24),
  CANCEL_HALF_REFUND_HOURS: z.coerce.number().default(6),

  // Observability
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOKI_PUSH_URL: z.string().url().optional(),
  PROMETHEUS_METRICS_ENABLED: z.string().default('true'),

  // Rate limiting
  RATE_LIMIT_OTP_PER_PHONE_PER_15MIN: z.coerce.number().default(3),
  RATE_LIMIT_OTP_PER_IP_PER_HOUR: z.coerce.number().default(10),
  RATE_LIMIT_API_PER_USER_PER_MIN: z.coerce.number().default(120),
  RATE_LIMIT_API_PER_IP_PER_MIN: z.coerce.number().default(300),
});

export type Env = z.infer<typeof envSchema>;
