// src/taxes/dto/create-raw-material-tax.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsUUID,
  IsBoolean,
  MaxLength,
  MinLength,
  IsOptional,
  IsArray,
} from 'class-validator';

export class CreateRawMaterialTaxDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome do imposto é obrigatório' })
  @MinLength(2, { message: 'Nome deve ter no mínimo 2 caracteres' })
  @MaxLength(40, { message: 'Nome deve ter no máximo 40 caracteres' })
  name: string;

  @IsNumber({}, { message: 'Taxa deve ser um número' })
  @Min(0.01, { message: 'Taxa deve ser maior que 0%' })
  @Max(100, { message: 'Taxa deve ser no máximo 100%' })
  rate: number;

  @IsBoolean({ message: 'Recuperável deve ser verdadeiro ou falso' })
  recoverable: boolean;

  @IsOptional()
  @IsArray({ message: 'rawMaterialIds deve ser um array' })
  @IsUUID('4', { each: true, message: 'ID de matéria-prima inválido' })
  rawMaterialIds?: string[];
}
