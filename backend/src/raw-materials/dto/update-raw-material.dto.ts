// src/raw-materials/dto/update-raw-material.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateRawMaterialDto, RawMaterialLocationDto } from './create-raw-material.dto';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

export class UpdateRawMaterialDto extends PartialType(CreateRawMaterialDto) {
	// Permitir operações específicas nas localidades (set/replace)
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => RawMaterialLocationDto)
	locations?: RawMaterialLocationDto[];
}