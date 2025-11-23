import { PartialType } from '@nestjs/mapped-types';
import { CreateRawMaterialTaxDto } from './create-raw-material-tax.dto';

export class UpdateRawMaterialTaxDto extends PartialType(
  CreateRawMaterialTaxDto,
) {}
