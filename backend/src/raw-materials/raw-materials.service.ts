import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRawMaterialDto } from './dto/create-raw-material.dto';
import { UpdateRawMaterialDto } from './dto/update-raw-material.dto';
import { QueryRawMaterialDto } from './dto/query-raw-material.dto';
import { ExportRawMaterialDto } from './dto/export-raw-material.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RawMaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRawMaterialDto: CreateRawMaterialDto, userId: string) {
    // 1. Verifica se o código já existe
    const existingCode = await this.prisma.rawMaterial.findUnique({
      where: { code: createRawMaterialDto.code.toUpperCase() },
    });

    if (existingCode) {
      throw new ConflictException(
        'Já existe uma matéria-prima com este código',
      );
    }

    // 2. Verifica se os fretes existem (se houver IDs)
    if (
      createRawMaterialDto.freightIds &&
      createRawMaterialDto.freightIds.length > 0
    ) {
      const count = await this.prisma.freight.count({
        where: { id: { in: createRawMaterialDto.freightIds } },
      });
      if (count !== createRawMaterialDto.freightIds.length) {
        throw new BadRequestException(
          'Um ou mais IDs de frete não foram encontrados',
        );
      }
    }

    // 3. Cria a matéria-prima
    const rawMaterial = await this.prisma.rawMaterial.create({
      data: {
        code: createRawMaterialDto.code.toUpperCase(),
        name: createRawMaterialDto.name,
        description: createRawMaterialDto.description,
        measurementUnit: createRawMaterialDto.measurementUnit,
        inputGroup: createRawMaterialDto.inputGroup,
        paymentTerm: createRawMaterialDto.paymentTerm,
        acquisitionPrice: createRawMaterialDto.acquisitionPrice,
        currency: createRawMaterialDto.currency,
        priceConvertedBrl: createRawMaterialDto.priceConvertedBrl,
        additionalCost: createRawMaterialDto.additionalCost,
        // Conexão N:M com Fretes
        freights: {
          connect: createRawMaterialDto.freightIds.map((id) => ({ id })),
        },
        // Criação aninhada de Impostos
        rawMaterialTaxes: {
          create: createRawMaterialDto.rawMaterialTaxes.map((tax) => ({
            name: tax.name,
            rate: tax.rate,
            recoverable: tax.recoverable,
          })),
        },
      },
      include: {
        freights: {
          // PLURAL
          select: {
            id: true,
            name: true,
            unitPrice: true,
            currency: true,
          },
        },
        rawMaterialTaxes: true,
      },
    });

    // 4. Log
    await this.createChangeLog(
      rawMaterial.id,
      'created',
      null,
      'Matéria-prima criada',
      userId,
    );

    return rawMaterial;
  }

  async findAll(query: QueryRawMaterialDto) {
    const {
      page = 1,
      limit = 10,
      search,
      measurementUnit,
      inputGroup,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: Prisma.RawMaterialWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { inputGroup: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        measurementUnit ? { measurementUnit } : {},
        inputGroup
          ? { inputGroup: { contains: inputGroup, mode: 'insensitive' } }
          : {},
      ],
    };

    const orderBy: Prisma.RawMaterialOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.rawMaterial.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          freights: {
            select: {
              id: true,
              name: true,
              unitPrice: true,
              currency: true,
              freightTaxes: {
                select: {
                  id: true,
                  name: true,
                  rate: true,
                },
              },
            },
          },
          rawMaterialTaxes: {
            select: {
              id: true,
              name: true,
              rate: true,
              recoverable: true,
            },
          },
        },
      }),
      this.prisma.rawMaterial.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const rawMaterial = await this.prisma.rawMaterial.findUnique({
      where: { id },
      include: {
        freights: {
          select: {
            id: true,
            name: true,
            unitPrice: true,
            currency: true,
            // CRÍTICO: Incluir os impostos dos fretes
            freightTaxes: {
              select: {
                id: true,
                name: true,
                rate: true,
              },
            },
          },
        },
        rawMaterialTaxes: {
          select: {
            id: true,
            name: true,
            rate: true,
            recoverable: true,
          },
        },
      },
    });

    if (!rawMaterial) {
      throw new NotFoundException('Matéria-prima não encontrada');
    }

    return rawMaterial;
  }

  async update(
    id: string,
    updateRawMaterialDto: UpdateRawMaterialDto,
    userId: string,
  ) {
    // 1. Busca o existente
    const existing = await this.prisma.rawMaterial.findUnique({
      where: { id },
      include: { freights: { select: { id: true } } },
    });

    if (!existing) {
      throw new NotFoundException('Matéria-prima não encontrada');
    } // 2. Validação de Código Único

    if (updateRawMaterialDto.code) {
      const codeExists = await this.prisma.rawMaterial.findFirst({
        where: {
          code: updateRawMaterialDto.code.toUpperCase(),
          NOT: { id },
        },
      });
      if (codeExists) {
        throw new ConflictException(
          'Já existe uma matéria-prima com este código',
        );
      }
    } // 3. Validação de Fretes (se fornecidos)

    if (updateRawMaterialDto.freightIds) {
      const count = await this.prisma.freight.count({
        where: { id: { in: updateRawMaterialDto.freightIds } },
      });
      if (count !== updateRawMaterialDto.freightIds.length) {
        throw new BadRequestException('Um ou mais fretes não encontrados');
      }
    } // 4. Registrar Log de Mudanças

    await this.logChanges(existing, updateRawMaterialDto, userId); // 5. Preparar dados do Update

    const data: Prisma.RawMaterialUpdateInput = {
      ...(updateRawMaterialDto.code && {
        code: updateRawMaterialDto.code.toUpperCase(),
      }),
      ...(updateRawMaterialDto.name && { name: updateRawMaterialDto.name }),
      ...(updateRawMaterialDto.description !== undefined && {
        description: updateRawMaterialDto.description,
      }),
      ...(updateRawMaterialDto.measurementUnit && {
        measurementUnit: updateRawMaterialDto.measurementUnit,
      }),
      ...(updateRawMaterialDto.inputGroup !== undefined && {
        inputGroup: updateRawMaterialDto.inputGroup,
      }),
      ...(updateRawMaterialDto.paymentTerm !== undefined && {
        paymentTerm: updateRawMaterialDto.paymentTerm,
      }),
      ...(updateRawMaterialDto.acquisitionPrice !== undefined && {
        acquisitionPrice: updateRawMaterialDto.acquisitionPrice,
      }),
      ...(updateRawMaterialDto.currency && {
        currency: updateRawMaterialDto.currency,
      }),
      ...(updateRawMaterialDto.priceConvertedBrl !== undefined && {
        priceConvertedBrl: updateRawMaterialDto.priceConvertedBrl,
      }),
      ...(updateRawMaterialDto.additionalCost !== undefined && {
        additionalCost: updateRawMaterialDto.additionalCost,
      }),
    }; // Atualização de Fretes (N:M)

    if (updateRawMaterialDto.freightIds !== undefined) {
      data.freights = {
        set: updateRawMaterialDto.freightIds.map((fid) => ({ id: fid })),
      };
    } // Atualização de Impostos

    if (updateRawMaterialDto.rawMaterialTaxes) {
      data.rawMaterialTaxes = {
        set: [],
        create: updateRawMaterialDto.rawMaterialTaxes.map((tax) => ({
          name: tax.name,
          rate: tax.rate,
          recoverable: tax.recoverable,
        })),
      };
    } // 6. Executar Update

    const updated = await this.prisma.rawMaterial.update({
      where: { id },
      data,
      include: {
        // REMOVIDO: freight: { ... } <- Isso causava o erro
        freights: {
          // Mantido apenas o Plural
          select: {
            id: true,
            name: true,
            unitPrice: true,
            currency: true,
          },
        },
        rawMaterialTaxes: true,
      },
    });

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);

    // Verifica dependência em Produtos
    const productsUsing = await this.prisma.productRawMaterial.count({
      where: { rawMaterialId: id },
    });

    if (productsUsing > 0) {
      throw new ConflictException(
        'Esta matéria-prima está associada a produtos e não pode ser excluída',
      );
    }

    await this.prisma.rawMaterial.delete({ where: { id } });
    return { message: 'Matéria-prima excluída com sucesso' };
  }

  // ==========================================
  // LOGS E HISTÓRICO
  // ==========================================

  // 1. Histórico específico de uma Matéria-Prima (CORRIGIDO)
  async getChangeLogs(id: string, page: number = 1, limit: number = 20) {
    await this.findOne(id);

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.rawMaterialChangeLog.findMany({
        where: { rawMaterialId: id },
        skip,
        take: limit,
        orderBy: { changedAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.rawMaterialChangeLog.count({
        where: { rawMaterialId: id },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    // Formatar resposta para incluir changedBy como string legível
    const formattedData = data.map((log) => ({
      ...log,
      changedBy: log.user
        ? `${log.user.name} (${log.user.email})`
        : 'Usuário desconhecido',
    }));

    return {
      data: formattedData,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasMore,
      },
    };
  }

  // 2. Lista geral das últimas alterações (CORRIGIDO)
  async getRecentChanges(limit: number = 10) {
    const logs = await this.prisma.rawMaterialChangeLog.findMany({
      take: limit,
      orderBy: { changedAt: 'desc' },
      include: {
        rawMaterial: {
          select: {
            name: true,
            code: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Formatar resposta para incluir changedBy como string legível
    return logs.map((log) => ({
      ...log,
      changedBy: log.user
        ? `${log.user.name} (${log.user.email})`
        : 'Usuário desconhecido',
    }));
  }

  // ==========================================
  // MÉTODOS PRIVADOS DE LOG (Adicione isso à sua classe)
  // ==========================================

  private async createChangeLog(
    rawMaterialId: string,
    field: string,
    oldValue: string | null,
    newValue: string | null,
    userId: string,
  ) {
    try {
      await this.prisma.rawMaterialChangeLog.create({
        data: {
          rawMaterialId,
          field,
          oldValue: oldValue ? String(oldValue) : null,
          newValue: newValue ? String(newValue) : null,
          userId,
        },
      });
    } catch (error) {
      console.error('Erro ao criar log de mudança:', error);
      // Não queremos que o log falhe a transação principal, então apenas logamos o erro
    }
  }

  private async logChanges(
    oldData: any,
    newData: UpdateRawMaterialDto,
    userId: string,
  ) {
    const fieldsToTrack = [
      'code',
      'name',
      'description',
      'measurementUnit',
      'inputGroup',
      'paymentTerm',
      'acquisitionPrice',
      'currency',
      'priceConvertedBrl',
      'additionalCost',
    ];

    for (const field of fieldsToTrack) {
      const newValue = newData[field];
      const oldValue = oldData[field];

      // Se o valor não foi enviado no DTO, ignora
      if (newValue === undefined) continue;

      // Tratamento especial para Decimal vs Number
      let areDifferent = newValue !== oldValue;

      if (
        oldValue &&
        typeof oldValue === 'object' &&
        'toFixed' in oldValue // Verifica se é um Decimal do Prisma
      ) {
        areDifferent = Number(oldValue) !== Number(newValue);
      }

      if (areDifferent) {
        await this.createChangeLog(
          oldData.id,
          field,
          oldValue !== null && oldValue !== undefined ? String(oldValue) : '',
          String(newValue),
          userId,
        );
      }
    }
  }

  // ==========================================
  // EXPORTAÇÃO
  // ==========================================

  async export(exportDto: ExportRawMaterialDto) {
    const {
      limit = 500,
      sortBy = 'name',
      sortOrder = 'asc',
      filters,
    } = exportDto;

    const where: Prisma.RawMaterialWhereInput = {
      AND: [
        filters?.search
          ? {
              OR: [
                { code: { contains: filters.search, mode: 'insensitive' } },
                { name: { contains: filters.search, mode: 'insensitive' } },
                {
                  inputGroup: { contains: filters.search, mode: 'insensitive' },
                },
              ],
            }
          : {},
        filters?.measurementUnit
          ? { measurementUnit: filters.measurementUnit }
          : {},
        filters?.inputGroup
          ? {
              inputGroup: { contains: filters.inputGroup, mode: 'insensitive' },
            }
          : {},
      ],
    };

    const data = await this.prisma.rawMaterial.findMany({
      where,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        freights: true, // PLURAL
        rawMaterialTaxes: true,
      },
    });

    const formattedData = data.map((item) => {
      // Formatar lista de fretes para uma única string
      const freightsStr = item.freights
        .map((f) => `${f.name} (${f.currency} ${f.unitPrice})`)
        .join('; ');

      return {
        Código: item.code,
        Nome: item.name,
        Descrição: item.description || '',
        'Unidade de Medida': item.measurementUnit,
        'Grupo de Insumo': item.inputGroup || '',
        'Prazo de Pagamento': `${item.paymentTerm} dias`,
        'Preço de Aquisição': item.acquisitionPrice.toString(),
        Moeda: item.currency,
        'Preço em BRL': item.priceConvertedBrl.toString(),
        'Custo Adicional': item.additionalCost.toString(),
        // Fretes agora é uma lista formatada
        Fretes: freightsStr,
        Impostos: item.rawMaterialTaxes
          .map(
            (tax) =>
              `${tax.name} (${tax.rate}%)${tax.recoverable ? ' [Recuperável]' : ''}`,
          )
          .join('; '),
      };
    });

    return this.generateCsv(formattedData);
  }

  private generateCsv(data: any[]): string {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const headerRow = headers.join(',');
    const rows = data.map((row) => {
      return headers
        .map((fieldName) => {
          const value = row[fieldName];
          const stringValue =
            value === null || value === undefined ? '' : String(value);
          return `"${stringValue.replace(/"/g, '""')}"`;
        })
        .join(',');
    });
    return [headerRow, ...rows].join('\n');
  }
}
