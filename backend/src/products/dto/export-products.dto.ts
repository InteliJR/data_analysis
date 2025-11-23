import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsIn,
  IsObject,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

class ExportFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsUUID('4', { message: 'ID do grupo de produto deve ser um UUID válido' })
  @IsOptional()
  productGroupId?: string;
}

export class ExportProductsDto {
  @IsIn(['csv'], { message: 'Formato deve ser csv' })
  @IsOptional()
  format?: string = 'csv';

  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite deve ser no mínimo 1' })
  @Max(1000, { message: 'Limite deve ser no máximo 1000' })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 100;

  @IsIn(
    [
      'code',
      'name',
      'createdAt',
      'updatedAt',
      'productGroup', // Relação
      'priceWithoutTaxesAndFreight', // Campo
      'priceWithTaxesAndFreight', // Campo
      'fixedCost', // Relação
    ],
    {
      message: 'Campo de ordenação inválido',
    },
  )
  @IsOptional()
  sortBy?: string = 'code';

  @IsIn(['asc', 'desc'], { message: 'Ordem inválida. Use asc ou desc' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';

  @IsObject()
  @IsOptional()
  @Type(() => ExportFiltersDto)
  filters?: ExportFiltersDto;
}
