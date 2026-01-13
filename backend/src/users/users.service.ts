import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import {
  CreateUserDto,
  FindAllUsersQueryDto,
  UpdateUserByAdminDto,
  UpdateUserMeDto,
  ExportUsersDto,
} from './users.controller';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private readonly pepper = process.env.PASSWORD_PEPPER || '';

  // ============================================
  // Hash centralizado
  // ============================================
  private async hashPassword(password: string) {
    return argon2.hash(password + this.pepper, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  // ============================================
  // Validação de senha
  // ============================================
  async validatePassword(user: any, password: string): Promise<boolean> {
    const passwordWithPepper = password + this.pepper;
    return argon2.verify(user.password, passwordWithPepper);
  }

  // ============================================
  // POST /users — cria usuário sempre inativo
  // ============================================
  async create(data: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (exists) {
      throw new ConflictException('Email já cadastrado');
    }

    const hashedPassword = await this.hashPassword(data.password);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: data.role ?? UserRole.COMERCIAL,
        isActive: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  // ============================================
  // POST /users/export — exportar usuários
  // ============================================
  async exportUsers(options: ExportUsersDto): Promise<string> {
    const { columns = ['id', 'name', 'email', 'role', 'isActive'], ...query } =
      options;

    const users = await this.prisma.user.findMany({
      where: this.buildWhereClause(query),
      orderBy: {
        [query.sortBy || 'createdAt']: query.sortOrder || 'desc',
      },
      take: options.limit ? +options.limit : 1000,
    });

    if (!users.length) {
      return 'Nenhum usuário encontrado com os filtros aplicados.';
    }

    const headers = columns.join(',');

    const rows = users.map((user) => {
      return columns
        .map((col) => {
          let value = (user as any)[col];

          if (typeof value === 'boolean') {
            value = value ? 'Ativo' : 'Inativo';
          }

          if (
            typeof value === 'string' &&
            (value.includes(',') || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',');
    });

    return [headers, ...rows].join('\n');
  }

  // ============================================
  // Helper para reutilizar a lógica de filtro
  // ============================================
  private buildWhereClause(query: FindAllUsersQueryDto) {
    const { search, role, isActive } = query;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) {
      where.role = role;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    return where;
  }

  // ============================================
  // GET /users — listar com paginação e filtros
  // ============================================
  async findAll(query: FindAllUsersQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: users,
      meta: {
        total,
        page: +page,
        limit: +limit,
        totalPages,
      },
    };
  }

  // ============================================
  // GET /users/:id — obter por ID
  // ============================================
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    return user;
  }

  // ============================================
  // PATCH /users/:id — atualizar por ADMIN
  // ============================================
  async updateByAdmin(
    id: string,
    data: UpdateUserByAdminDto,
    adminId: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Regra: ADMIN não pode desativar a si mesmo
    if (id === adminId && data.isActive === false) {
      throw new BadRequestException(
        'Um administrador não pode desativar a si mesmo.',
      );
    }

    // Regra: ADMIN não pode mudar a própria role
    if (id === adminId && data.role && data.role !== user.role) {
      throw new BadRequestException(
        'Um administrador não pode alterar a própria função (role).',
      );
    }

    const updateData: any = {
      role: data.role,
      isActive: data.isActive,
      name: data.name,
    };

    if (data.password) {
      updateData.password = await this.hashPassword(data.password);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  // ============================================
  // PATCH /users/me — atualizar dados próprios
  // ============================================
  async updateMe(id: string, data: UpdateUserMeDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new InternalServerErrorException(
        'Usuário autenticado não encontrado no banco de dados.',
      );
    }

    // 1. Validação: Se está alterando email ou senha, exige senha atual
    if ((data.email || data.newPassword) && !data.currentPassword) {
      throw new BadRequestException(
        'Senha atual é obrigatória para alterações de email ou senha.',
      );
    }

    // 2. Validação: Se forneceu senha atual, ela deve estar correta
    if (data.currentPassword) {
      const isPasswordValid = await this.validatePassword(
        user,
        data.currentPassword,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Senha atual incorreta.');
      }
    }

    // 3. Validação: Se está alterando email, verificar se já existe
    if (data.email && data.email !== user.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new ConflictException('Este email já está em uso.');
      }
    }

    // 4. Preparar dados para atualização
    const updateData: any = {};

    if (data.name) {
      updateData.name = data.name;
    }

    if (data.email) {
      updateData.email = data.email;
    }

    if (data.newPassword) {
      updateData.password = await this.hashPassword(data.newPassword);
    }

    // 5. Atualizar no banco
    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  // ============================================
  // Métodos de autenticação (mantidos)
  // ============================================
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}