import { Controller, Get, Param } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly svc: InvoicesService) {}

  @Roles('user')
  @Get(':id')
  async getInvoice(@CurrentUser() payload: JwtPayload, @Param('id') id: string) {
    return this.svc.getInvoice(payload.sub, 'user', id);
  }
}
