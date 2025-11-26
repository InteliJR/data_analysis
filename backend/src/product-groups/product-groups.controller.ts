// src/product-groups/product-groups.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Res,
  HttpStatus,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { ProductGroupsService } from './product-groups.service';
import { CreateProductGroupDto } from './dto/create-product-group.dto';
import { UpdateProductGroupDto } from './dto/update-product-group.dto';
import { QueryProductGroupDto } from './dto/query-product-group.dto';
import { ExportProductGroupDto } from './dto/export-product-group.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('product-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductGroupsController {
  constructor(
    private readonly productGroupsService: ProductGroupsService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  create(@Body() createProductGroupDto: CreateProductGroupDto) {
    return this.productGroupsService.create(createProductGroupDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  findAll(@Query() query: QueryProductGroupDto) {
    return this.productGroupsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  findOne(@Param('id') id: string) {
    return this.productGroupsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  update(
    @Param('id') id: string,
    @Body() updateProductGroupDto: UpdateProductGroupDto,
  ) {
    return this.productGroupsService.update(id, updateProductGroupDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.productGroupsService.remove(id);
  }

  @Post('export')
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  async export(
    @Body() exportDto: ExportProductGroupDto,
    @Res() res: Response,
  ) {
    const data = await this.productGroupsService.findAllForExport(exportDto);

    // Criar CSV simples
    const headers = [
      'Nome',
      'Descrição',
      'Qtd. Produtos',
      'Overhead/Unidade',
      '% Grupo',
      'Volume Considerar',
      'Vol. % (Quantidade)',
      'Vol. % (Valor)',
      'Preço Médio',
    ];

    const rows = data.map((item) => [
      item.name,
      item.description || '',
      item.productsCount,
      `R$ ${(item.overheadPerUnit ?? 0).toFixed(2)}`,
      item.porcentage != null ? `${item.porcentage}%` : '',
      item.volumevendasconsiderar != null ? `${item.volumevendasconsiderar}` : '',
      `${item.volumePercentageByQuantity}%`,
      `${item.volumePercentageByValue}%`,
      `R$ ${item.averagePrice.toFixed(2)}`,
    ]);

    // Gerar CSV
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=grupos-produtos-${Date.now()}.csv`,
    );

    return res.status(HttpStatus.OK).send('\uFEFF' + csvContent);
  }
}