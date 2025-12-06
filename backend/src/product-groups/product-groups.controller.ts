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
import { ProductGroupEntity } from './entities/product-group.entity';

type ColumnKey =
  | 'name'
  | 'description'
  | 'productsCount'
  | 'overheadPerUnit'
  | 'porcentage'
  | 'volumevendasconsiderar'
  | 'volumePercentageByQuantity'
  | 'volumePercentageByValue'
  | 'averagePrice'
  | 'totalValue'
  | 'createdAt'
  | 'updatedAt';

const PRODUCT_GROUP_COLUMN_DEFINITIONS: Record<ColumnKey, {
  header: string;
  getValue: (item: ProductGroupEntity) => string;
}> = {
  name: {
    header: 'Nome',
    getValue: (item) => item.name,
  },
  description: {
    header: 'Descrição',
    getValue: (item) => item.description ?? '',
  },
  productsCount: {
    header: 'Qtd. Produtos',
    getValue: (item) => String(item.productsCount ?? 0),
  },
  overheadPerUnit: {
    header: 'Overhead/Unidade',
    getValue: (item) => formatCurrency(item.overheadPerUnit ?? 0),
  },
  porcentage: {
    header: '% Grupo',
    getValue: (item) =>
      item.porcentage !== null && item.porcentage !== undefined
        ? `${item.porcentage}%`
        : '',
  },
  volumevendasconsiderar: {
    header: 'Volume Considerar',
    getValue: (item) =>
      item.volumevendasconsiderar !== null &&
      item.volumevendasconsiderar !== undefined
        ? String(item.volumevendasconsiderar)
        : '',
  },
  volumePercentageByQuantity: {
    header: 'Vol. % (Quantidade)',
    getValue: (item) => `${item.volumePercentageByQuantity}%`,
  },
  volumePercentageByValue: {
    header: 'Vol. % (Valor)',
    getValue: (item) => `${item.volumePercentageByValue}%`,
  },
  averagePrice: {
    header: 'Preço Médio',
    getValue: (item) => formatCurrency(item.averagePrice ?? 0),
  },
  totalValue: {
    header: 'Valor Total',
    getValue: (item) => formatCurrency(item.totalValue ?? 0),
  },
  createdAt: {
    header: 'Criado em',
    getValue: (item) => formatDate(item.createdAt),
  },
  updatedAt: {
    header: 'Atualizado em',
    getValue: (item) => formatDate(item.updatedAt),
  },
};

const DEFAULT_PRODUCT_GROUP_EXPORT_COLUMNS: ColumnKey[] = [
  'name',
  'description',
  'productsCount',
  'overheadPerUnit',
  'porcentage',
  'volumevendasconsiderar',
  'volumePercentageByQuantity',
  'volumePercentageByValue',
  'averagePrice',
  'totalValue',
];

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2)}`;
}

function formatDate(date: Date | string): string {
  const parsed = date instanceof Date ? date : new Date(date);
  return parsed.toISOString();
}

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

    const requestedColumns = exportDto.columns?.length
      ? (exportDto.columns as ColumnKey[])
      : DEFAULT_PRODUCT_GROUP_EXPORT_COLUMNS;

    let columns = requestedColumns.filter(
      (column) => column in PRODUCT_GROUP_COLUMN_DEFINITIONS,
    ) as ColumnKey[];

    if (columns.length === 0) {
      columns = DEFAULT_PRODUCT_GROUP_EXPORT_COLUMNS;
    }

    const headers = columns.map(
      (column) => PRODUCT_GROUP_COLUMN_DEFINITIONS[column].header,
    );

    const rows = data.map((item) =>
      columns.map((column) =>
        PRODUCT_GROUP_COLUMN_DEFINITIONS[column].getValue(item),
      ),
    );

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