// src/raw-materials/raw-materials.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { RawMaterialsService } from './raw-materials.service';
import { CreateRawMaterialDto } from './dto/create-raw-material.dto';
import { UpdateRawMaterialDto } from './dto/update-raw-material.dto';
import { QueryRawMaterialDto } from './dto/query-raw-material.dto';
import { ExportRawMaterialDto } from './dto/export-raw-material.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('raw-materials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RawMaterialsController {
  constructor(private readonly rawMaterialsService: RawMaterialsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createRawMaterialDto: CreateRawMaterialDto,
    @Request() req,
  ) {
    return this.rawMaterialsService.create(createRawMaterialDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  findAll(@Query() query: QueryRawMaterialDto) {
    return this.rawMaterialsService.findAll(query);
  }

  @Get('recent-changes')
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  getRecentChanges(@Query('limit') limit?: number) {
    return this.rawMaterialsService.getRecentChanges(limit);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  findOne(@Param('id') id: string) {
    return this.rawMaterialsService.findOne(id);
  }

  @Get(':id/change-logs')
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  getChangeLogs(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.rawMaterialsService.getChangeLogs(id, page, limit);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  update(
    @Param('id') id: string,
    @Body() updateRawMaterialDto: UpdateRawMaterialDto,
    @Request() req,
  ) {
    return this.rawMaterialsService.update(id, updateRawMaterialDto, req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.rawMaterialsService.remove(id);
  }

  @Post('export')
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  @HttpCode(HttpStatus.OK)
  async export(
    @Body() exportDto: ExportRawMaterialDto,
    @Res() res: Response,
  ) {
    const csv = await this.rawMaterialsService.export(exportDto);
    
    const filename = `materias-primas-${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}