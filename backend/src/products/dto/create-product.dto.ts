import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Matches,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RawMaterialItemDto {
  @IsUUID('4', { message: 'ID da matéria-prima deve ser um UUID válido' })
  @IsNotEmpty({ message: 'ID da matéria-prima é obrigatório' })
  rawMaterialId: string;

  @IsUUID('4', {
    message: 'ID da localização da matéria-prima deve ser um UUID válido',
  })
  @IsNotEmpty({ message: 'A localização da matéria-prima é obrigatória' })
  rawMaterialLocationPivotId: string;

  @IsNumber({}, { message: 'Quantidade deve ser um número' })
  @Min(0.001, { message: 'Quantidade deve ser maior que 0' })
  @Type(() => Number)
  quantity: number;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'O código é obrigatório' })
  @Matches(/^\d+$/, {
    message: 'O código deve conter apenas números',
  })
  code: string;

  @IsArray({ message: 'freightIds deve ser um array' })
  @IsUUID('4', {
    each: true,
    message: 'Cada ID de frete deve ser um UUID válido',
  })
  @IsOptional()
  freightIds?: string[];

  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID('4', { message: 'ID do custo fixo deve ser um UUID válido' })
  @IsOptional()
  fixedCostId?: string;

  @IsUUID()
  @IsOptional()
  productGroupId?: string;

  @IsArray({ message: 'rawMaterials deve ser um array' })
  @ValidateNested({ each: true })
  @ArrayMinSize(1, {
    message: 'Deve ter no mínimo 1 matéria-prima',
  })
  @Type(() => RawMaterialItemDto)
  rawMaterials: RawMaterialItemDto[];
}
