// src/product-groups/dto/update-product-group.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateProductGroupDto } from './create-product-group.dto';
import { IsOptional, IsInt, Min, Max } from 'class-validator';

export class UpdateProductGroupDto extends PartialType(CreateProductGroupDto) {
	@IsOptional()
	@IsInt()
	@Min(0)
	@Max(100)
	porcentage?: number;

	@IsOptional()
	@IsInt()
	volumevendasconsiderar?: number;
}