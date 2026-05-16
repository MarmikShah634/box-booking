import { EncryptionService } from './encryption.service';
import type { ConfigService } from '@nestjs/config';

const TEST_KEY_HEX = 'a'.repeat(64);

function makeService(): EncryptionService {
  const config = { getOrThrow: (_key: string) => TEST_KEY_HEX } as unknown as ConfigService;
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
    const tampered = parts[0] + ':' + (parts[1] ?? '').slice(0, -2) + 'AA' + ':' + parts[2];
    expect(() => svc.decrypt(tampered)).toThrow();
  });

  it('throws on wrong format', () => {
    expect(() => svc.decrypt('not-encrypted')).toThrow('Invalid encrypted value format');
  });

  it('throws on invalid key length in production', () => {
    const badConfig = {
      getOrThrow: () => 'tooshort',
      get: (key: string) => (key === 'NODE_ENV' ? 'production' : undefined),
    } as unknown as ConfigService;
    const svc2 = new EncryptionService(badConfig);
    expect(() => svc2.onModuleInit()).toThrow('ENCRYPTION_KEY_HEX must be exactly 64 hex characters');
  });

  it('uses deterministic fallback key in development when key is wrong length', () => {
    const devConfig = {
      getOrThrow: () => 'tooshort',
      get: (key: string) => (key === 'NODE_ENV' ? 'development' : undefined),
    } as unknown as ConfigService;
    const svc2 = new EncryptionService(devConfig);
    // Should not throw in development
    expect(() => svc2.onModuleInit()).not.toThrow();
    // Should be usable (encrypt/decrypt still works with fallback key)
    const plain = 'test-dev-fallback';
    expect(svc2.decrypt(svc2.encrypt(plain))).toBe(plain);
  });

  it('throws on wrong format with a non-hex 64-char string in production', () => {
    // Provide 64 chars but with invalid hex chars ('z' repeated)
    const badConfig = {
      getOrThrow: () => 'z'.repeat(64),
      get: (key: string) => (key === 'NODE_ENV' ? 'production' : undefined),
    } as unknown as ConfigService;
    const svc2 = new EncryptionService(badConfig);
    expect(() => svc2.onModuleInit()).toThrow('ENCRYPTION_KEY_HEX must be exactly 64 hex characters');
  });
});
