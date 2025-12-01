// src/raw-materials/dto/create-raw-material.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsPositive,
  Min,
  Max,
  MaxLength,
  MinLength,
  IsArray,
  ValidateNested,
  IsUUID,
  IsBoolean,
} from 'class-validator';
// CORREÇÃO: Importar Type
import { Type } from 'class-transformer';
import { Currency, MeasurementUnit } from '@prisma/client';

export class RawMaterialTaxDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @IsNotEmpty({ message: 'Nome do imposto é obrigatório' })
  @MaxLength(40, {
    message: 'Nome do imposto deve ter no máximo 40 caracteres',
  })
  name: string;

  @IsNumber()
  @Type(() => Number) // CORREÇÃO: Converte string para number
  @IsPositive({ message: 'Taxa deve ser maior que zero' })
  @Min(0.01, { message: 'Taxa deve ser no mínimo 0.01%' })
  @Max(100, { message: 'Taxa deve ser no máximo 100%' })
  rate: number;

  @IsBoolean()
  recoverable: boolean;
}

export class LocationTaxDto {
  @IsOptional()
  @IsUUID()
  taxId?: string; // referencia catálogo

  @IsOptional()
  @IsString()
  @MaxLength(40)
  name?: string; // alternativa para criar novo imposto

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  rate: number;

  @IsBoolean()
  recoverable: boolean;
}

export class RawMaterialLocationDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsString()
  country?: string = 'BR';

  @IsString()
  @MinLength(2)
  @MaxLength(2)
  stateUf: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  city: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  acquisitionPrice: number;

  @IsEnum(Currency)
  currency: Currency;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  priceConvertedBrl: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  additionalCost: number;

  @IsArray()
  @IsUUID('4', { each: true })
  freightIds: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationTaxDto)
  taxes: LocationTaxDto[];
}

export class CreateRawMaterialDto {
  @IsString()
  @IsNotEmpty({ message: 'Código é obrigatório' })
  @MinLength(2, { message: 'Código deve ter no mínimo 2 caracteres' })
  @MaxLength(30, { message: 'Código deve ter no máximo 30 caracteres' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Descrição deve ter no máximo 500 caracteres' })
  description?: string;

  @IsEnum(MeasurementUnit, { message: 'Unidade de medida inválida' })
  measurementUnit: MeasurementUnit;

  @IsOptional()
  @IsString()
  @MaxLength(60, {
    message: 'Grupo de insumo deve ter no máximo 60 caracteres',
  })
  inputGroup?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0, { message: 'Prazo de pagamento deve ser no mínimo 0' })
  @Max(365, { message: 'Prazo de pagamento deve ser no máximo 365 dias' })
  paymentTerm: number;

  // Preços/impostos/fretes por localidade
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RawMaterialLocationDto)
  locations: RawMaterialLocationDto[];
}
