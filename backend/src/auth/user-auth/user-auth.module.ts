import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserAuthController } from './user-auth.controller';
import { UserAuthService } from './user-auth.service';
import { TokenService } from '../token.service';
import { JwtStrategy } from '../jwt.strategy';
import { UsersModule } from '../../users/users.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}), // options set dynamically in TokenService
    UsersModule,
  ],
  controllers: [UserAuthController],
  providers: [UserAuthService, TokenService, JwtStrategy],
  exports: [TokenService, JwtStrategy],
})
export class UserAuthModule {}
