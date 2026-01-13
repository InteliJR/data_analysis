// =============================================
// src/freights/dto/update-freight.dto.ts
// =============================================

import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateFreightDto } from './create-freight.dto';
import {
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateFreightTaxDto } from './update-freight-tax.dto';

export class UpdateFreightDto extends PartialType(
  OmitType(CreateFreightDto, ['freightTaxes'] as const),
) {
  @IsArray({ message: 'Os impostos devem ser um array' })
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @Type(() => UpdateFreightTaxDto)
  @IsOptional()
  freightTaxes?: UpdateFreightTaxDto[];
}
