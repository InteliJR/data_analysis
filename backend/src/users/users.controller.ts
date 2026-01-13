import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ValidationPipe,
  UseGuards,
  Query,
  Req,
  Res
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { Request, Response } from 'express';

// ========================================
// DTOs
// ========================================

// DTO para criação de usuário (apenas ADMIN)
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

// DTO para atualização de usuário (apenas ADMIN)
export class UpdateUserByAdminDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;
}

// DTO para atualização de dados próprios (qualquer usuário)
export class UpdateUserMeDto {
  @IsString()
  @MinLength(3)
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  // Senha atual é OBRIGATÓRIA se estiver alterando email ou senha
  @ValidateIf((o) => o.email || o.newPassword)
  @IsString()
  @MinLength(6, { message: 'Senha atual é obrigatória para alterações de segurança' })
  currentPassword?: string;

  @IsString()
  @MinLength(6, { message: 'Nova senha deve ter no mínimo 6 caracteres' })
  @IsOptional()
  newPassword?: string;
}

// DTO para query parameters de listagem
export class FindAllUsersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class ExportUsersDto extends FindAllUsersQueryDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  columns?: string[];
}

// ========================================
// CONTROLLER
// ========================================
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ----------------------------------------
  // ⚠️ IMPORTANTE: Rotas específicas ANTES das rotas com parâmetros
  // ----------------------------------------

  // ----------------------------------------
  // GET /users/me - Obter Dados Próprios (Qualquer Autenticado)
  // ----------------------------------------
  @Get('me')
  getMe(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.usersService.findById(userId);
  }

  // ----------------------------------------
  // PATCH /users/me - Atualizar Dados Próprios (Qualquer Autenticado)
  // ----------------------------------------
  @Patch('me')
  updateMe(@Req() req: Request, @Body(ValidationPipe) data: UpdateUserMeDto) {
    const userId = (req.user as any).id;
    return this.usersService.updateMe(userId, data);
  }

  // ----------------------------------------
  // GET /users - Listar Usuários (ADMIN)
  // ----------------------------------------
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @Get()
  findAll(@Query(ValidationPipe) query: FindAllUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  // ----------------------------------------
  // POST /users/export - Exportar Usuários (ADMIN)
  // ----------------------------------------
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @Post('export')
  async export(
    @Body(ValidationPipe) options: ExportUsersDto,
    @Res() res: Response,
  ) {
    const csvData = await this.usersService.exportUsers(options);
    
    res.header('Content-Type', 'text/csv');
    res.header(
      'Content-Disposition',
      `attachment; filename="usuarios_${new Date().toISOString()}.csv"`,
    );
    
    return res.send(csvData);
  }

  // ----------------------------------------
  // POST /users - Criar Usuário (ADMIN)
  // ----------------------------------------
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @Post()
  create(@Body(ValidationPipe) data: CreateUserDto) {
    return this.usersService.create(data);
  }

  // ----------------------------------------
  // GET /users/:id - Obter Usuário por ID (ADMIN)
  // ----------------------------------------
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @Get(':id')
  findOne(@Param('id', new ValidationPipe({ transform: true })) id: string) {
    return this.usersService.findById(id);
  }

  // ----------------------------------------
  // PATCH /users/:id - Atualizar Usuário (ADMIN)
  // ----------------------------------------
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id', new ValidationPipe({ transform: true })) id: string,
    @Body(ValidationPipe) data: UpdateUserByAdminDto,
  ) {
    const adminId = (req.user as any).id;
    return this.usersService.updateByAdmin(id, data, adminId);
  }
}