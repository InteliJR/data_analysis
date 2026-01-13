// src/product-groups/dto/create-product-group.dto.ts

import { IsString, IsOptional, MaxLength, IsInt, Min, Max } from 'class-validator';

export class CreateProductGroupDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  porcentage?: number;

  @IsOptional()
  @IsInt()
  volumevendasconsiderar?: number;
}