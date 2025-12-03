// src/taxes/dto/export-taxes.dto.ts

import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsIn,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ExportFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;
}

export class ExportTaxesDto {
  @IsString()
  @IsIn(['csv'])
  format: 'csv';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  limit?: number = 500;

  @IsOptional()
  @IsString()
  sortBy?: string = 'name';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ExportFiltersDto)
  filters?: ExportFiltersDto;
}