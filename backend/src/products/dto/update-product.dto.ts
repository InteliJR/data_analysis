import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

/**
 * DTO para atualização de produto.
 * Todos os campos são opcionais.
 * Se rawMaterials for enviado, substitui completamente as associações existentes.
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
