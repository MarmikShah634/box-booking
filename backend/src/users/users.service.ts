import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertByPhone(phone: string): Promise<User> {
    return this.prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  assertNotBlocked(user: User): void {
    if (user.isBlocked) {
      throw new ForbiddenException({ error: 'FORBIDDEN', message: 'Account is blocked' });
    }
  }
}
