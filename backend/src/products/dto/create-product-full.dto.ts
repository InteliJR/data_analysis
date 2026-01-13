import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsUUID,
  IsNumber,
  Min,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FullCreateLocationTaxDto {
  @IsOptional()
  @IsUUID('4')
  taxId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsNumber()
  @Type(() => Number)
  rate!: number;

  @IsBoolean()
  recoverable!: boolean;
}

export class FullCreateEmbeddedLocationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  stateUf!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsOptional()
  @IsString()
  country?: string; // default BR no service
}

export class FullCreateRawMaterialLocationDto {
  @IsOptional()
  @IsUUID('4')
  locationId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FullCreateEmbeddedLocationDto)
  location?: FullCreateEmbeddedLocationDto;

  @IsNumber()
  @Type(() => Number)
  acquisitionPrice!: number;

  @IsIn(['BRL', 'USD', 'EUR'])
  currency!: 'BRL' | 'USD' | 'EUR';

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priceConvertedBrl?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  additionalCost?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  freightIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FullCreateLocationTaxDto)
  taxes?: FullCreateLocationTaxDto[];
}

export class FullCreateRawMaterialDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['KG', 'G', 'L', 'ML', 'M', 'CM', 'UN', 'CX', 'PC'])
  measurementUnit!: 'KG' | 'G' | 'L' | 'ML' | 'M' | 'CM' | 'UN' | 'CX' | 'PC';

  @IsOptional()
  @IsString()
  inputGroup?: string;

  @IsNumber()
  @Type(() => Number)
  paymentTerm!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FullCreateRawMaterialLocationDto)
  locations!: FullCreateRawMaterialLocationDto[];
}

export class FullCreateCompositionItemDto {
  @IsString()
  @IsNotEmpty()
  rawMaterialCode!: string;

  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  quantity!: number;

  @IsOptional()
  @IsIn(['KG', 'G', 'L', 'ML', 'M', 'CM', 'UN', 'CX', 'PC'])
  measurementUnit?: 'KG' | 'G' | 'L' | 'ML' | 'M' | 'CM' | 'UN' | 'CX' | 'PC';
}

export class FullCreatePricingDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  additionalCosts?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  margin?: number;
}

export class CreateProductFullDto {
  @IsString()
  @IsNotEmpty()
  code!: string; // aceita alfanumérico (ex.: PROD-0001)

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID('4')
  fixedCostId?: string;

  @IsOptional()
  @IsUUID('4')
  productGroupId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  freightIds?: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FullCreateRawMaterialDto)
  rawMaterials!: FullCreateRawMaterialDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FullCreateCompositionItemDto)
  composition!: FullCreateCompositionItemDto[];

  // Campos opcionais adicionais presentes no payload do cliente (ignorados no cálculo)
  @IsOptional()
  @ValidateNested()
  @Type(() => FullCreatePricingDto)
  pricing?: FullCreatePricingDto;

  @IsOptional()
  @IsString()
  measurementUnit?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  paymentTerm?: number;

  @IsOptional()
  @IsString()
  stateUf?: string;

  @IsOptional()
  @IsString()
  city?: string;
}
