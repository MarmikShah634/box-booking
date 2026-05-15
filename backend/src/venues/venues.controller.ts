import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { z } from 'zod';
import { VenuesService } from './venues.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentOwner } from '../common/decorators/current-owner.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

const AmenityEnum = z.enum([
  'parking', 'washroom', 'floodlight', 'cafeteria',
  'equipment', 'seating', 'drinking_water', 'first_aid',
]);

const CreateVenueSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(2000).optional(),
  address: z.string().min(10).max(300),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/),
  geoLat: z.number().optional(),
  geoLng: z.number().optional(),
  amenities: z.array(AmenityEnum).default([]),
});

const UpdateVenueSchema = CreateVenueSchema.partial();

const PhotosSchema = z.object({ keys: z.array(z.string().min(1)).min(1) });

@Controller('venues')
export class VenuesController {
  constructor(private readonly svc: VenuesService) {}

  @Roles('owner')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentOwner() payload: JwtPayload,
    @Body(new ZodValidationPipe(CreateVenueSchema)) body: z.infer<typeof CreateVenueSchema>,
  ) {
    return this.svc.create(payload.sub, body);
  }

  @Roles('owner')
  @Get('mine')
  async getMine(@CurrentOwner() payload: JwtPayload) {
    return this.svc.getMyVenues(payload.sub);
  }

  @Public()
  @Get('public')
  async getPublic(
    @Query('city') city?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('amenities') amenities?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.svc.getPublicList({
      city,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      amenities,
      sort: sort as 'price_asc' | 'price_desc' | 'newest' | undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Public()
  @Get('public/:slug')
  async getPublicDetail(@Param('slug') slug: string) {
    return this.svc.getPublicDetail(slug);
  }

  @Roles('owner')
  @Get(':id')
  async getById(@CurrentOwner() payload: JwtPayload, @Param('id') id: string) {
    return this.svc.getById(payload.sub, id);
  }

  @Roles('owner')
  @Patch(':id')
  async update(
    @CurrentOwner() payload: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateVenueSchema)) body: z.infer<typeof UpdateVenueSchema>,
  ) {
    return this.svc.update(payload.sub, id, body);
  }

  @Roles('owner')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentOwner() payload: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.svc.remove(payload.sub, id);
  }

  @Roles('owner')
  @Post(':id/photos')
  async addPhotos(
    @CurrentOwner() payload: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(PhotosSchema)) body: z.infer<typeof PhotosSchema>,
  ) {
    return this.svc.addPhotos(payload.sub, id, body.keys);
  }

  @Roles('owner')
  @Post(':id/submit')
  async submit(@CurrentOwner() payload: JwtPayload, @Param('id') id: string) {
    return this.svc.submit(payload.sub, id);
  }
}
