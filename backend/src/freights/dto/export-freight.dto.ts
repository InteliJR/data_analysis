// =============================================
// src/freights/dto/export-freight.dto.ts
// =============================================

import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Currency, FreightOperationType } from '@prisma/client';

export class ExportFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(Currency, { message: 'Moeda inválida. Use BRL, USD ou EUR' })
  currency?: Currency;

  @IsOptional()
  @IsEnum(FreightOperationType, {
    message: 'Tipo de operação inválido. Use INTERNAL ou EXTERNAL',
  })
  operationType?: FreightOperationType;

  @IsOptional()
  @IsString()
  originUf?: string;

  @IsOptional()
  @IsString()
  destinationUf?: string;
}

export class ExportFreightDto {
  @IsString()
  @IsIn(['csv'], { message: 'Formato inválido. Use csv' })
  format: string = 'csv';

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O limite deve ser um número inteiro' })
  @Min(1, { message: 'O limite deve ser no mínimo 1' })
  @Max(10000, { message: 'O limite deve ser no máximo 10000' })
  limit?: number = 1000;

  @IsOptional()
  @IsIn([
    'name',
    'unitPrice',
    'originUf',
    'originCity',          
    'destinationUf',
    'destinationCity',     
    'cargoType',
    'operationType',
    'createdAt',
    'updatedAt',
  ], {
    message: 'Campo de ordenação inválido',
  })
  sortBy?: string = 'name';

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Ordem inválida. Use asc ou desc' })
  sortOrder?: 'asc' | 'desc' = 'asc';

  @IsOptional()
  @ValidateNested()
  @Type(() => ExportFiltersDto)
  filters?: ExportFiltersDto;
}