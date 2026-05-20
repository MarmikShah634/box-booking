import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { z } from 'zod';
import { SuperAdminService } from './super-admin.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

const RejectSchema = z.object({ reason: z.string().min(1) });
const SuspendSchema = z.object({ reason: z.string().min(1) });
const GrantFreeSchema = z.object({ until: z.string().min(1) });
const BlockUserSchema = z.object({ reason: z.string().min(1) });
const CitySchema = z.object({ name: z.string().min(1) });

@Controller('super-admin')
@Roles('super_admin')
export class SuperAdminController {
  constructor(private readonly svc: SuperAdminService) {}

  // ── Venues ──────────────────────────────────────────────────────────────────

  @Get('venues')
  async getVenues(
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize?: number,
  ) {
    return this.svc.getVenues({ status, page, pageSize });
  }

  @Get('venues/:id')
  async getVenue(@Param('id') id: string) {
    return this.svc.getVenueById(id);
  }

  @Post('venues/:id/approve')
  async approveVenue(@CurrentAdmin() payload: JwtPayload, @Param('id') id: string) {
    return this.svc.approveVenue(payload.sub, id);
  }

  @Post('venues/:id/reject')
  async rejectVenue(
    @CurrentAdmin() payload: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RejectSchema)) body: z.infer<typeof RejectSchema>,
  ) {
    return this.svc.rejectVenue(payload.sub, id, body.reason);
  }

  @Post('venues/:id/suspend')
  async suspendVenue(
    @CurrentAdmin() payload: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SuspendSchema)) body: z.infer<typeof SuspendSchema>,
  ) {
    return this.svc.suspendVenue(payload.sub, id, body.reason);
  }

  @Post('venues/:id/reinstate')
  async reinstateVenue(@CurrentAdmin() payload: JwtPayload, @Param('id') id: string) {
    return this.svc.reinstateVenue(payload.sub, id);
  }

  // ── Owners ───────────────────────────────────────────────────────────────────

  @Get('owners')
  async getOwners(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize?: number,
  ) {
    return this.svc.getOwners({ page, pageSize });
  }

  @Get('owners/:id')
  async getOwner(@Param('id') id: string) {
    return this.svc.getOwnerById(id);
  }

  @Post('owners/:id/suspend')
  async suspendOwner(
    @CurrentAdmin() payload: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SuspendSchema)) body: z.infer<typeof SuspendSchema>,
  ) {
    return this.svc.suspendOwner(payload.sub, id, body.reason);
  }

  @Post('owners/:id/grant-free')
  async grantFree(
    @CurrentAdmin() payload: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(GrantFreeSchema)) body: z.infer<typeof GrantFreeSchema>,
  ) {
    return this.svc.grantFreeMode(payload.sub, id, body.until);
  }

  @Post('owners/:id/revoke-free')
  async revokeFree(@CurrentAdmin() payload: JwtPayload, @Param('id') id: string) {
    return this.svc.revokeFreeMode(payload.sub, id);
  }

  @Post('owners/:id/reset-password')
  async resetOwnerPassword(@CurrentAdmin() payload: JwtPayload, @Param('id') id: string) {
    return this.svc.resetOwnerPassword(payload.sub, id);
  }

  // ── Users ────────────────────────────────────────────────────────────────────

  @Get('users')
  async getUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize?: number,
  ) {
    return this.svc.getUsers({ page, pageSize });
  }

  @Post('users/:id/block')
  async blockUser(
    @CurrentAdmin() payload: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(BlockUserSchema)) body: z.infer<typeof BlockUserSchema>,
  ) {
    return this.svc.blockUser(payload.sub, id, body.reason);
  }

  @Post('users/:id/unblock')
  async unblockUser(@CurrentAdmin() payload: JwtPayload, @Param('id') id: string) {
    return this.svc.unblockUser(payload.sub, id);
  }

  // ── Bookings ─────────────────────────────────────────────────────────────────

  @Get('bookings')
  async getBookings(
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize?: number,
  ) {
    return this.svc.getBookings({ status, page, pageSize });
  }

  // ── Settings ─────────────────────────────────────────────────────────────────

  @Get('settings')
  async getSettings() {
    return this.svc.getSettings();
  }

  @Patch('settings')
  async updateSettings(
    @CurrentAdmin() payload: JwtPayload,
    @Body() body: Record<string, unknown>,
  ) {
    return this.svc.updateSettings(payload.sub, body);
  }

  // ── Audit Log ────────────────────────────────────────────────────────────────

  @Get('audit-log')
  async getAuditLog(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('pageSize', new DefaultValuePipe(50), ParseIntPipe) pageSize?: number,
  ) {
    return this.svc.getAuditLog({ page, pageSize });
  }

  // ── Cities ───────────────────────────────────────────────────────────────────

  @Get('cities')
  async getCities() {
    return this.svc.getCities();
  }

  @Post('cities')
  @HttpCode(HttpStatus.CREATED)
  addCity(
    @CurrentAdmin() payload: JwtPayload,
    @Body(new ZodValidationPipe(CitySchema)) body: z.infer<typeof CitySchema>,
  ) {
    return this.svc.addCity(payload.sub, body.name);
  }
}
