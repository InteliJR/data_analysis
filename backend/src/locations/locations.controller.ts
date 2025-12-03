import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { QueryLocationDto } from './dto/query-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('locations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  create(@Body() dto: CreateLocationDto, @Request() req) {
    return this.locationsService.create(dto, req.user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL, UserRole.LOGISTICA)
  findAll(@Query() query: QueryLocationDto) {
    return this.locationsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL, UserRole.LOGISTICA)
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  @Get(':id/change-logs')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  getChangeLogs(@Param('id') id: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.locationsService.getChangeLogs(id, Number(page) || 1, Number(limit) || 20);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  update(@Param('id') id: string, @Body() dto: UpdateLocationDto, @Request() req) {
    return this.locationsService.update(id, dto, req.user.id);
  }
}
