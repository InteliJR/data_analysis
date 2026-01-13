import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsIn,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExportFixedCostDto {
  @IsString()
  @IsIn(['csv'])
  format: 'csv' = 'csv';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string = 'calculationDate';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  columns?: string[];

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeProducts?: boolean = false;
}