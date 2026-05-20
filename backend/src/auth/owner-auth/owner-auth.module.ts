import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { OwnerAuthController } from './owner-auth.controller';
import { OwnerAuthService } from './owner-auth.service';
import { TokenService } from '../token.service';
import { JwtStrategy } from '../jwt.strategy';
import { CryptoModule } from '../../crypto/crypto.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    CryptoModule,
  ],
  controllers: [OwnerAuthController],
  providers: [OwnerAuthService, TokenService, JwtStrategy],
  exports: [OwnerAuthService],
})
export class OwnerAuthModule {}
