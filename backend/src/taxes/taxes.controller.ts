// src/taxes/taxes.controller.ts

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
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { TaxesService } from './taxes.service';
import { CreateFreightTaxDto } from './dto/create-freight-tax.dto';
import { UpdateFreightTaxDto } from './dto/update-freight-tax.dto';
import { CreateRawMaterialTaxDto } from './dto/create-raw-material-tax.dto';
import { UpdateRawMaterialTaxDto } from './dto/update-raw-material-tax.dto';
import { QueryTaxesDto } from './dto/query-taxes.dto';
import { ExportTaxesDto } from './dto/export-taxes.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('taxes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  // ========================================
  // FREIGHT TAXES
  // ========================================

  @Get('freight')
  @Roles(UserRole.ADMIN, UserRole.IMPOSTO, UserRole.LOGISTICA)
  findAllFreightTaxes(@Query() query: QueryTaxesDto) {
    return this.taxesService.findAllFreightTaxes(query);
  }

  @Get('freight/:id')
  @Roles(UserRole.ADMIN, UserRole.IMPOSTO, UserRole.LOGISTICA)
  findOneFreightTax(@Param('id') id: string) {
    return this.taxesService.findOneFreightTax(id);
  }

  @Post('freight')
  @Roles(UserRole.ADMIN, UserRole.IMPOSTO)
  createFreightTax(@Body() dto: CreateFreightTaxDto) {
    return this.taxesService.createFreightTax(dto);
  }

  @Patch('freight/:id')
  @Roles(UserRole.ADMIN, UserRole.IMPOSTO)
  updateFreightTax(
    @Param('id') id: string,
    @Body() dto: UpdateFreightTaxDto,
  ) {
    return this.taxesService.updateFreightTax(id, dto);
  }

  @Delete('freight/:id')
  @Roles(UserRole.ADMIN, UserRole.IMPOSTO)
  removeFreightTax(@Param('id') id: string) {
    return this.taxesService.removeFreightTax(id);
  }

  @Post('freight/export')
  @Roles(UserRole.ADMIN, UserRole.IMPOSTO)
  async exportFreightTaxes(
    @Body() dto: ExportTaxesDto,
    @Res() res: Response,
  ) {
    const csv = await this.taxesService.exportFreightTaxes(dto);
    const filename = `impostos-frete-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM para UTF-8
  }

  // ========================================
  // RAW MATERIAL TAXES
  // ========================================

  @Get('raw-material')
  @Roles(UserRole.ADMIN, UserRole.IMPOSTO, UserRole.COMERCIAL)
  findAllRawMaterialTaxes(@Query() query: QueryTaxesDto) {
    return this.taxesService.findAllRawMaterialTaxes(query);
  }

  @Get('raw-material/:id')
  @Roles(UserRole.ADMIN, UserRole.IMPOSTO, UserRole.COMERCIAL)
  findOneRawMaterialTax(@Param('id') id: string) {
    return this.taxesService.findOneRawMaterialTax(id);
  }

  @Post('raw-material')
  @Roles(UserRole.ADMIN, UserRole.IMPOSTO)
  createRawMaterialTax(@Body() dto: CreateRawMaterialTaxDto) {
    return this.taxesService.createRawMaterialTax(dto);
  }

  @Patch('raw-material/:id')
  @Roles(UserRole.ADMIN, UserRole.IMPOSTO)
  updateRawMaterialTax(
    @Param('id') id: string,
    @Body() dto: UpdateRawMaterialTaxDto,
  ) {
    return this.taxesService.updateRawMaterialTax(id, dto);
  }

  @Delete('raw-material/:id')
  @Roles(UserRole.ADMIN, UserRole.IMPOSTO)
  removeRawMaterialTax(@Param('id') id: string) {
    return this.taxesService.removeRawMaterialTax(id);
  }

  @Post('raw-material/export')
  @Roles(UserRole.ADMIN, UserRole.IMPOSTO)
  async exportRawMaterialTaxes(
    @Body() dto: ExportTaxesDto,
    @Res() res: Response,
  ) {
    const csv = await this.taxesService.exportRawMaterialTaxes(dto);
    const filename = `impostos-materia-prima-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM para UTF-8
  }
}