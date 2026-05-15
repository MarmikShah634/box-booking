import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

const TEST_KEY_HEX = 'a'.repeat(64); // 32-byte key for tests

function makeService(): EncryptionService {
  const config = { getOrThrow: (key: string) => (key === 'ENCRYPTION_KEY_HEX' ? TEST_KEY_HEX : '') } as any;
  const svc = new EncryptionService(config);
  svc.onModuleInit();
  return svc;
}

describe('EncryptionService', () => {
  let svc: EncryptionService;

  beforeEach(() => {
    svc = makeService();
  });

  it('round-trips a plaintext string', () => {
    const plain = 'super-secret-bank-account-1234';
    expect(svc.decrypt(svc.encrypt(plain))).toBe(plain);
  });

  it('round-trips unicode / special chars', () => {
    const plain = 'hdfc0001234 ✓ मुंबई';
    expect(svc.decrypt(svc.encrypt(plain))).toBe(plain);
  });

  it('produces different ciphertext on each call (random IV)', () => {
    const plain = 'same-plaintext';
    const c1 = svc.encrypt(plain);
    const c2 = svc.encrypt(plain);
    expect(c1).not.toBe(c2);
  });

  it('ciphertext has three colon-separated parts', () => {
    const parts = svc.encrypt('hello').split(':');
    expect(parts).toHaveLength(3);
  });

  it('throws on tampered ciphertext', () => {
    const enc = svc.encrypt('original');
    const parts = enc.split(':');
    // flip one byte in the ciphertext section
    const tampered = parts[0] + ':' + parts[1].slice(0, -2) + 'AA' + ':' + parts[2];
    expect(() => svc.decrypt(tampered)).toThrow();
  });

  it('throws on wrong format', () => {
    expect(() => svc.decrypt('not-encrypted')).toThrow('Invalid encrypted value format');
  });

  it('throws on invalid key length in production', () => {
    const badConfig = {
      getOrThrow: () => 'tooshort',
      get: (key: string) => (key === 'NODE_ENV' ? 'production' : undefined),
    } as any;
    const svc2 = new EncryptionService(badConfig);
    expect(() => svc2.onModuleInit()).toThrow('ENCRYPTION_KEY_HEX must be exactly 64 hex characters');
  });
});
