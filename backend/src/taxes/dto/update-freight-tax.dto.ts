import { PartialType } from '@nestjs/mapped-types';
import { CreateFreightTaxDto } from './create-freight-tax.dto';

export class UpdateFreightTaxDto extends PartialType(CreateFreightTaxDto) {}
