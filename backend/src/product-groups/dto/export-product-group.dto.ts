// src/product-groups/dto/export-product-group.dto.ts

import {
  IsOptional,
  IsString,
  IsIn,
  IsInt,
  Min,
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExportProductGroupDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn([
    'name',
    'volumePercentageByQuantity',
    'volumePercentageByValue',
    'averagePrice',
    'totalValue',
    'overheadPerUnit',
    'productsCount',
  ])
  sortBy?: string = 'name';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsIn(
    [
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
      'createdAt',
      'updatedAt',
    ],
    { each: true },
  )
  columns?: string[];
}