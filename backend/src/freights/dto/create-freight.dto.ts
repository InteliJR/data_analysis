
// =============================================
// src/freights/dto/create-freight.dto.ts
// =============================================

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsPositive,
  MaxLength,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Matches,
} from 'class-validator';
import { Currency, FreightOperationType } from '@prisma/client';
import { Type } from 'class-transformer';
import { CreateFreightTaxDto } from './create-freight-tax.dto';

export class CreateFreightDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do frete é obrigatório' })
  @MaxLength(255, { message: 'O nome deve ter no máximo 255 caracteres' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000, {
    message: 'A descrição deve ter no máximo 5000 caracteres',
  })
  description?: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'O preço unitário deve ter no máximo 2 casas decimais' },
  )
  @IsPositive({ message: 'O preço unitário deve ser positivo' })
  @Type(() => Number)
  unitPrice: number;

  @IsEnum(Currency, { message: 'Moeda inválida. Use BRL, USD ou EUR' })
  currency: Currency;

  @IsString()
  @IsNotEmpty({ message: 'O UF de origem é obrigatório' })
  @MaxLength(2, { message: 'O UF deve ter 2 caracteres' })
  @Matches(/^[A-Z]{2}$/, { message: 'O UF deve conter apenas letras maiúsculas' })
  originUf: string;

  @IsString()
  @IsNotEmpty({ message: 'A cidade de origem é obrigatória' })
  @MaxLength(100, { message: 'A cidade deve ter no máximo 100 caracteres' })
  originCity: string;

  @IsString()
  @IsNotEmpty({ message: 'O UF de destino é obrigatório' })
  @MaxLength(2, { message: 'O UF deve ter 2 caracteres' })
  @Matches(/^[A-Z]{2}$/, { message: 'O UF deve conter apenas letras maiúsculas' })
  destinationUf: string;

  @IsString()
  @IsNotEmpty({ message: 'A cidade de destino é obrigatória' })
  @MaxLength(100, { message: 'A cidade deve ter no máximo 100 caracteres' })
  destinationCity: string;

  @IsString()
  @IsNotEmpty({ message: 'O tipo de carga é obrigatório' })
  @MaxLength(100, { message: 'O tipo de carga deve ter no máximo 100 caracteres' })
  cargoType: string;

  @IsEnum(FreightOperationType, {
    message: 'Tipo de operação inválido. Use INTERNAL ou EXTERNAL',
  })
  operationType: FreightOperationType;

  @IsArray({ message: 'Os impostos devem ser um array' })
  @ValidateNested({ each: true })
  @ArrayMinSize(0, { message: 'Deve haver pelo menos 0 impostos' })
  @Type(() => CreateFreightTaxDto)
  @IsOptional()
  freightTaxes?: CreateFreightTaxDto[];
}

