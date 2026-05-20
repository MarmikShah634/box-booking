import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SuperAdminAuthController } from './super-admin-auth.controller';
import { SuperAdminAuthService } from './super-admin-auth.service';
import { TokenService } from '../token.service';
import { JwtStrategy } from '../jwt.strategy';
import { CryptoModule } from '../../crypto/crypto.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    CryptoModule,
  ],
  controllers: [SuperAdminAuthController],
  providers: [SuperAdminAuthService, TokenService, JwtStrategy],
  exports: [SuperAdminAuthService],
})
export class SuperAdminAuthModule {}
