// src/fixed-costs/fixed-costs.controller.ts

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
import { FixedCostsService } from './fixed-costs.service';
import { CreateFixedCostDto } from './dto/create-fixed-cost.dto';
import { UpdateFixedCostDto } from './dto/update-fixed-cost.dto';
import { QueryFixedCostDto } from './dto/query-fixed-cost.dto';
import { ExportFixedCostDto } from './dto/export-fixed-cost.dto';
import { CalculateOverheadDto } from './dto/calculate-overhead.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';

@Controller('fixed-costs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN) // Apenas ADMIN acessa custos fixos
export class FixedCostsController {
  constructor(private readonly fixedCostsService: FixedCostsService) {}

  @Post()
  create(@Body() createFixedCostDto: CreateFixedCostDto) {
    return this.fixedCostsService.create(createFixedCostDto);
  }

  @Get()
  @Throttle({
    default: {
      limit: 50,
      ttl: 60,
    },
  })
  findAll(@Query() query: QueryFixedCostDto) {
    return this.fixedCostsService.findAll(query);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('includeProducts') includeProducts?: boolean,
  ) {
    return this.fixedCostsService.findOne(id, includeProducts);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFixedCostDto: UpdateFixedCostDto,
  ) {
    return this.fixedCostsService.update(id, updateFixedCostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fixedCostsService.remove(id);
  }

  @Post(':id/calculate-overhead')
  calculateOverhead(
    @Param('id') id: string,
    @Body() dto: CalculateOverheadDto,
  ) {
    return this.fixedCostsService.calculateOverhead(id, dto);
  }

  @Post('export')
  async export(@Body() dto: ExportFixedCostDto, @Res() res: Response) {
    const csv = await this.fixedCostsService.export(dto);

    const filename = `custos-fixos-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(HttpStatus.OK).send(csv);
  }
}