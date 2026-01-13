import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFixedCostDto {
  @IsString()
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  description: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Despesas com pessoal deve ter no máximo 2 casas decimais' },
  )
  @Min(0, { message: 'Despesas com pessoal não pode ser negativa' })
  @Type(() => Number)
  personnelExpenses: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Gastos gerais deve ter no máximo 2 casas decimais' },
  )
  @Min(0, { message: 'Gastos gerais não pode ser negativo' })
  @Type(() => Number)
  generalExpenses: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Pró-labore deve ter no máximo 2 casas decimais' },
  )
  @Min(0, { message: 'Pró-labore não pode ser negativo' })
  @Type(() => Number)
  proLabore: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Depreciação deve ter no máximo 2 casas decimais' },
  )
  @Min(0, { message: 'Depreciação não pode ser negativa' })
  @Type(() => Number)
  @IsOptional()
  depreciation?: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Percentual deve ter no máximo 2 casas decimais' },
  )
  @Min(0, { message: 'Percentual não pode ser negativo' })
  @Max(100, { message: 'Percentual não pode ser maior que 100' })
  @Type(() => Number)
  @IsOptional()
  considerationPercentage?: number;
}