import { Module } from '@nestjs/common';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { AuditModule } from '../audit/audit.module';
import { CryptoModule } from '../crypto/crypto.module';

@Module({
  imports: [AuditModule, CryptoModule],
  controllers: [SuperAdminController],
  providers: [SuperAdminService],
  exports: [SuperAdminService],
})
export class SuperAdminModule {}
