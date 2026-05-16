import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { RazorpayService } from './razorpay.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { EncryptionService } from '../crypto/encryption.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

// We mock the Razorpay SDK module
const mockOrdersCreate = jest.fn();
const mockPaymentsRefund = jest.fn();

jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => ({
    orders: { create: mockOrdersCreate },
    payments: { refund: mockPaymentsRefund },
  }));
});

function makeService() {
  const mockPrisma = {
    owner: {
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;

  const mockEncryption = {
    decrypt: jest.fn(),
    encrypt: jest.fn(),
  } as unknown as EncryptionService;

  const svc = new RazorpayService(mockPrisma, mockEncryption);

  return { svc, mockPrisma, mockEncryption };
}

function makeOwnerWithKeys(overrides: Record<string, unknown> = {}) {
  return {
    id: 'owner-1',
    razorpayKeyId: 'rzp_test_key123',
    razorpayKeySecretEnc: 'encrypted-secret',
    razorpayWebhookSecretEnc: 'encrypted-webhook-secret',
    ...overrides,
  };
}

// ── createOrder ───────────────────────────────────────────────────────────────

describe('RazorpayService.createOrder', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws NotFoundException if owner not found', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(svc.createOrder('owner-1', 100000, 'receipt-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws RAZORPAY_NOT_CONFIGURED if owner has no razorpayKeyId', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(
      makeOwnerWithKeys({ razorpayKeyId: null }),
    );

    try {
      await svc.createOrder('owner-1', 100000, 'receipt-1');
    } catch (e) {
      const ex = e as InternalServerErrorException;
      const body = ex.getResponse() as Record<string, unknown>;
      expect(body['error']).toBe('RAZORPAY_NOT_CONFIGURED');
    }
  });

  it('throws RAZORPAY_NOT_CONFIGURED if owner has no razorpayKeySecretEnc', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(
      makeOwnerWithKeys({ razorpayKeySecretEnc: null }),
    );

    try {
      await svc.createOrder('owner-1', 100000, 'receipt-1');
    } catch (e) {
      const ex = e as InternalServerErrorException;
      const body = ex.getResponse() as Record<string, unknown>;
      expect(body['error']).toBe('RAZORPAY_NOT_CONFIGURED');
    }
  });

  it('decrypts key secret via EncryptionService', async () => {
    const { svc, mockPrisma, mockEncryption } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(makeOwnerWithKeys());
    (mockEncryption.decrypt as jest.Mock).mockReturnValue('plain-secret');
    mockOrdersCreate.mockResolvedValue({ id: 'order_1', amount: 100000, currency: 'INR' });

    await svc.createOrder('owner-1', 100000, 'receipt-1');

    expect(mockEncryption.decrypt).toHaveBeenCalledWith('encrypted-secret');
  });

  it('calls Razorpay orders.create with correct parameters', async () => {
    const { svc, mockPrisma, mockEncryption } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(makeOwnerWithKeys());
    (mockEncryption.decrypt as jest.Mock).mockReturnValue('plain-secret');
    mockOrdersCreate.mockResolvedValue({ id: 'order_1', amount: 100000, currency: 'INR' });

    await svc.createOrder('owner-1', 100000, 'receipt-1', { bookingId: 'booking-1' });

    expect(mockOrdersCreate).toHaveBeenCalledWith({
      amount: 100000,
      currency: 'INR',
      receipt: 'receipt-1',
      notes: { bookingId: 'booking-1' },
    });
  });

  it('returns id, amount, currency on success', async () => {
    const { svc, mockPrisma, mockEncryption } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(makeOwnerWithKeys());
    (mockEncryption.decrypt as jest.Mock).mockReturnValue('plain-secret');
    mockOrdersCreate.mockResolvedValue({ id: 'order_123', amount: 50000, currency: 'INR' });

    const result = await svc.createOrder('owner-1', 50000, 'receipt-1');

    expect(result).toEqual({ id: 'order_123', amount: 50000, currency: 'INR' });
  });

  it('throws PAYMENT_ERROR if Razorpay API call fails', async () => {
    const { svc, mockPrisma, mockEncryption } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(makeOwnerWithKeys());
    (mockEncryption.decrypt as jest.Mock).mockReturnValue('plain-secret');
    mockOrdersCreate.mockRejectedValue(new Error('Network error'));

    try {
      await svc.createOrder('owner-1', 100000, 'receipt-1');
    } catch (e) {
      const ex = e as InternalServerErrorException;
      const body = ex.getResponse() as Record<string, unknown>;
      expect(body['error']).toBe('PAYMENT_ERROR');
    }
  });

  it('converts string amount from Razorpay response to number', async () => {
    const { svc, mockPrisma, mockEncryption } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(makeOwnerWithKeys());
    (mockEncryption.decrypt as jest.Mock).mockReturnValue('plain-secret');
    mockOrdersCreate.mockResolvedValue({ id: 'order_1', amount: '100000', currency: 'INR' });

    const result = await svc.createOrder('owner-1', 100000, 'receipt-1');

    expect(typeof result.amount).toBe('number');
    expect(result.amount).toBe(100000);
  });
});

// ── createRefund ──────────────────────────────────────────────────────────────

describe('RazorpayService.createRefund', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws NotFoundException if owner not found', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(svc.createRefund('owner-1', 'pay_123', 50000)).rejects.toThrow(NotFoundException);
  });

  it('calls payments.refund with paymentId and amount', async () => {
    const { svc, mockPrisma, mockEncryption } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(makeOwnerWithKeys());
    (mockEncryption.decrypt as jest.Mock).mockReturnValue('plain-secret');
    mockPaymentsRefund.mockResolvedValue({ id: 'refund_1', amount: 50000 });

    await svc.createRefund('owner-1', 'pay_123', 50000);

    expect(mockPaymentsRefund).toHaveBeenCalledWith('pay_123', { amount: 50000 });
  });

  it('returns refund id and amount on success', async () => {
    const { svc, mockPrisma, mockEncryption } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(makeOwnerWithKeys());
    (mockEncryption.decrypt as jest.Mock).mockReturnValue('plain-secret');
    mockPaymentsRefund.mockResolvedValue({ id: 'refund_abc', amount: 25000 });

    const result = await svc.createRefund('owner-1', 'pay_123', 25000);

    expect(result).toEqual({ id: 'refund_abc', amount: 25000 });
  });

  it('throws REFUND_ERROR if Razorpay API call fails', async () => {
    const { svc, mockPrisma, mockEncryption } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(makeOwnerWithKeys());
    (mockEncryption.decrypt as jest.Mock).mockReturnValue('plain-secret');
    mockPaymentsRefund.mockRejectedValue(new Error('Refund failed'));

    try {
      await svc.createRefund('owner-1', 'pay_123', 50000);
    } catch (e) {
      const ex = e as InternalServerErrorException;
      const body = ex.getResponse() as Record<string, unknown>;
      expect(body['error']).toBe('REFUND_ERROR');
    }
  });
});

// ── verifyWebhookSignature ────────────────────────────────────────────────────

describe('RazorpayService.verifyWebhookSignature', () => {
  let svc: RazorpayService;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ svc } = makeService());
  });

  it('returns true for a valid HMAC-SHA256 signature', () => {
    const { createHmac } = jest.requireActual<typeof import('crypto')>('crypto');
    const secret = 'test-webhook-secret';
    const payload = JSON.stringify({ event: 'payment.captured' });
    const signature = createHmac('sha256', secret).update(payload).digest('hex');

    expect(svc.verifyWebhookSignature(payload, signature, secret)).toBe(true);
  });

  it('returns false for an invalid signature', () => {
    const payload = JSON.stringify({ event: 'payment.captured' });
    expect(svc.verifyWebhookSignature(payload, 'wrong-signature', 'some-secret')).toBe(false);
  });

  it('returns false for tampered payload', () => {
    const { createHmac } = jest.requireActual<typeof import('crypto')>('crypto');
    const secret = 'test-webhook-secret';
    const originalPayload = JSON.stringify({ event: 'payment.captured' });
    const signature = createHmac('sha256', secret).update(originalPayload).digest('hex');
    const tamperedPayload = JSON.stringify({ event: 'payment.refunded' });

    expect(svc.verifyWebhookSignature(tamperedPayload, signature, secret)).toBe(false);
  });
});

// ── getWebhookSecret ──────────────────────────────────────────────────────────

describe('RazorpayService.getWebhookSecret', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws RAZORPAY_NOT_CONFIGURED if owner has no webhook secret', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue({ razorpayWebhookSecretEnc: null });

    try {
      await svc.getWebhookSecret('owner-1');
    } catch (e) {
      const ex = e as InternalServerErrorException;
      const body = ex.getResponse() as Record<string, unknown>;
      expect(body['error']).toBe('RAZORPAY_NOT_CONFIGURED');
    }
  });

  it('decrypts and returns the webhook secret', async () => {
    const { svc, mockPrisma, mockEncryption } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(makeOwnerWithKeys());
    (mockEncryption.decrypt as jest.Mock).mockReturnValue('plain-webhook-secret');

    const result = await svc.getWebhookSecret('owner-1');

    expect(mockEncryption.decrypt).toHaveBeenCalledWith('encrypted-webhook-secret');
    expect(result).toBe('plain-webhook-secret');
  });
});
