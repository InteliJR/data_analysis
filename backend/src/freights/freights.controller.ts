// src/freights/freights.controller.ts

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
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { FreightsService } from './freights.service';
import { CreateFreightDto } from './dto/create-freight.dto';
import { UpdateFreightDto } from './dto/update-freight.dto';
import { QueryFreightDto } from './dto/query-freight.dto';
import { ExportFreightDto } from './dto/export-freight.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
@Controller('freights')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FreightsController {
  constructor(private readonly freightsService: FreightsService) {}

  /**
   * POST /freights
   * Cria um novo frete com impostos opcionais
   * Acesso: ADMIN, LOGISTICA
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  create(@Body() createFreightDto: CreateFreightDto) {
    return this.freightsService.create(createFreightDto);
  }

  /**
   * POST /freights/export
   * Exporta fretes em formato CSV
   * Acesso: ADMIN, LOGISTICA
   */
  @Post('export')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  async export(
    @Body() exportDto: ExportFreightDto,
    @Res() res: Response,
  ) {
    const csvData = await this.freightsService.exportToCSV(exportDto);

    // Gera nome do arquivo com timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `fretes_${timestamp}.csv`;

    // Configura headers para download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');

    // Adiciona BOM UTF-8 para compatibilidade com Excel
    const BOM = '\uFEFF';
    res.status(HttpStatus.OK).send(BOM + csvData);
  }

  /**
   * GET /freights
   * Lista todos os fretes com paginação e filtros
   * Acesso: ADMIN, LOGISTICA
   * 
   * Query params:
   * - page: número da página (padrão: 1)
   * - limit: itens por página (padrão: 10, máx: 100)
   * - search: busca em name, description, originCity, destinationCity, cargoType
   * - currency: filtra por moeda (BRL, USD, EUR)
   * - operationType: filtra por tipo (INTERNAL, EXTERNAL)
   * - originUf: filtra por UF de origem
   * - destinationUf: filtra por UF de destino
   * - sortBy: campo de ordenação
   * - sortOrder: asc ou desc
   */
  @Get()
  @Throttle({
    default: {
      limit: 50,
      ttl: 60,
    },
  })
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  findAll(@Query() query: QueryFreightDto) {
    return this.freightsService.findAll(query);
  }

  /**
   * GET /freights/statistics
   * Retorna estatísticas dos fretes
   * Acesso: ADMIN, LOGISTICA
   */
  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  getStatistics() {
    return this.freightsService.getStatistics();
  }

  /**
   * GET /freights/:id
   * Busca um frete específico por ID
   * Acesso: ADMIN, LOGISTICA
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  findOne(@Param('id') id: string) {
    return this.freightsService.findOne(id);
  }

  /**
   * PATCH /freights/:id
   * Atualiza um frete existente
   * Acesso: ADMIN, LOGISTICA
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  update(@Param('id') id: string, @Body() updateFreightDto: UpdateFreightDto) {
    return this.freightsService.update(id, updateFreightDto);
  }

  /**
   * DELETE /freights/:id
   * Remove um frete (verifica dependências)
   * Acesso: ADMIN
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.freightsService.remove(id);
  }

  /**
   * DELETE /freights/:freightId/taxes/:taxId
   * Remove um imposto específico de um frete
   * Acesso: ADMIN, LOGISTICA
   */
  @Delete(':freightId/taxes/:taxId')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  deleteFreightTax(
    @Param('freightId') freightId: string,
    @Param('taxId') taxId: string,
  ) {
    return this.freightsService.deleteFreightTax(freightId, taxId);
  }
}