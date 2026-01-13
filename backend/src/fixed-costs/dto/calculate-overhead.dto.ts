import { IsBoolean, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CalculateOverheadDto {
  @IsBoolean()
  applyToProducts: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  productIds?: string[];
}