import { IsOptional, IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome da unidade é obrigatório' })
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  country?: string = 'BR';

  @IsString()
  @MinLength(2)
  @MaxLength(2)
  stateUf: string;

  @IsString()
  @IsNotEmpty({ message: 'Cidade é obrigatória' })
  @MaxLength(120)
  city: string;
}
