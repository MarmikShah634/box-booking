import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;

@Injectable()
export class EncryptionService implements OnModuleInit {
  private key!: Buffer;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const hex = this.config.getOrThrow<string>('ENCRYPTION_KEY_HEX');
    if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
      if (this.config.get('NODE_ENV') === 'production') {
        throw new Error('ENCRYPTION_KEY_HEX must be exactly 64 hex characters (32 bytes)');
      }
      // Dev: use a deterministic fallback so the app boots during early steps
      this.key = Buffer.alloc(32, 0xde);
      return;
    }
    this.key = Buffer.from(hex, 'hex');
  }

  /**
   * Encrypts plaintext to "<iv_b64>:<ciphertext_b64>:<tag_b64>".
   * Each call produces a unique ciphertext (random IV).
   */
  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv.toString('base64'), encrypted.toString('base64'), tag.toString('base64')].join(':');
  }

  /**
   * Decrypts a value produced by encrypt(). Throws on tampered input.
   */
  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted value format');
    const [ivB64, dataB64, tagB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    if (iv.length !== IV_BYTES) throw new Error('Invalid IV length');
    if (tag.length !== TAG_BYTES) throw new Error('Invalid auth tag length');
    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }
}
