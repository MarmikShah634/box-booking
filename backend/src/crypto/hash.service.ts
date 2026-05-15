import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';

@Injectable()
export class HashService implements OnModuleInit {
  private options!: argon2.Options;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.options = {
      type: argon2.argon2id,
      memoryCost: this.config.get<number>('ARGON2_MEMORY_KB', 65536),
      timeCost: this.config.get<number>('ARGON2_TIME_COST', 3),
      parallelism: this.config.get<number>('ARGON2_PARALLELISM', 1),
      raw: false,
    };
  }

  async hash(plain: string): Promise<string> {
    return argon2.hash(plain, this.options as argon2.Options & { raw?: false });
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain, { type: argon2.argon2id });
    } catch {
      return false;
    }
  }
}
