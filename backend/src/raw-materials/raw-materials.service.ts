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

    // 2. Verifica se os fretes existem
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

    // 3. Validar impostos (verificar duplicados na lista enviada)
    this.validateTaxList(createRawMaterialDto.rawMaterialTaxes);

    // 4. Processar impostos: SEMPRE usar connect para impostos com ID
    const taxesToConnect: string[] = [];
    const taxesToCreate: any[] = [];

    for (const tax of createRawMaterialDto.rawMaterialTaxes) {
      if (tax.id) {
        // Imposto existente - apenas conectar (o ID já garante que existe)
        const exists = await this.prisma.rawMaterialTax.findUnique({
          where: { id: tax.id },
        });
        if (!exists) {
          throw new BadRequestException(
            `Imposto com ID ${tax.id} não encontrado`,
          );
        }
        taxesToConnect.push(tax.id);
      } else {
        // Novo imposto - verificar se nome já existe
        const existing = await this.prisma.rawMaterialTax.findUnique({
          where: { name: tax.name.trim() },
        });

        if (existing) {
          throw new ConflictException(
            `Já existe um imposto com o nome "${tax.name}". Selecione o imposto existente da lista.`,
          );
        }

        taxesToCreate.push({
          name: tax.name.trim(),
          rate: tax.rate,
          recoverable: tax.recoverable,
        });
      }
    }

    // 5. Cria a matéria-prima
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
        freights: {
          connect: createRawMaterialDto.freightIds.map((id) => ({ id })),
        },
        rawMaterialTaxes: {
          // Conecta impostos existentes
          connect: taxesToConnect.map((id) => ({ id })),
          // Cria novos impostos
          create: taxesToCreate,
        },
      },
      include: {
        freights: {
          select: {
            id: true,
            name: true,
            unitPrice: true,
            currency: true,
            originCity: true,
            originUf: true,
            destinationCity: true,
            destinationUf: true,
          },
        },
        rawMaterialTaxes: true,
      },
    });

    // 6. Log de criação
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
              originCity: true,
              originUf: true,
              destinationCity: true,
              destinationUf: true,
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
            originCity: true,
            originUf: true,
            destinationCity: true,
            destinationUf: true,
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
      include: {
        freights: { select: { id: true, name: true } },
        rawMaterialTaxes: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Matéria-prima não encontrada');
    }

    // 2. Validação de Código Único
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
    }

    // 3. Validação de Fretes
    if (updateRawMaterialDto.freightIds) {
      const count = await this.prisma.freight.count({
        where: { id: { in: updateRawMaterialDto.freightIds } },
      });
      if (count !== updateRawMaterialDto.freightIds.length) {
        throw new BadRequestException('Um ou mais fretes não encontrados');
      }
    }

    // 4. Validar e processar impostos
    let taxData: any = undefined;

    if (updateRawMaterialDto.rawMaterialTaxes) {
      this.validateTaxList(updateRawMaterialDto.rawMaterialTaxes);

      const taxesToConnect: string[] = [];
      const taxesToCreate: any[] = [];

      // Processar impostos do DTO
      for (const tax of updateRawMaterialDto.rawMaterialTaxes) {
        if (tax.id) {
          // Imposto existente
          const exists = await this.prisma.rawMaterialTax.findUnique({
            where: { id: tax.id },
          });

          if (!exists) {
            throw new BadRequestException(
              `Imposto com ID ${tax.id} não encontrado`,
            );
          }

          await this.prisma.rawMaterialTax.update({
            where: { id: tax.id },
            data: {
              name: tax.name.trim(),
              rate: tax.rate,
              recoverable: tax.recoverable,
            },
          });

          taxesToConnect.push(tax.id);
        } else {
          const existingTax = await this.prisma.rawMaterialTax.findUnique({
            where: { name: tax.name.trim() },
          });

          if (existingTax) {
            // Se já existe com esse nome, mas veio sem ID, é um conflito ou devemos usar o existente.
            // Como é um update, lançar conflito é mais seguro para evitar sobrescrita acidental
            throw new ConflictException(
              `Já existe um imposto com o nome "${tax.name}". Selecione o imposto existente da lista.`,
            );
          }

          taxesToCreate.push({
            name: tax.name.trim(),
            rate: tax.rate,
            recoverable: tax.recoverable,
          });
        }
      }

      // Usar set para substituir completamente a lista de conexões
      taxData = {
        set: taxesToConnect.map((id) => ({ id })),
        create: taxesToCreate,
      };
    }

    // 5. Registrar Log de Mudanças (ANTES da atualização)
    await this.logChanges(existing, updateRawMaterialDto, userId);

    // 6. Preparar dados do Update
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
    };

    // Atualização de Fretes
    if (updateRawMaterialDto.freightIds !== undefined) {
      data.freights = {
        set: updateRawMaterialDto.freightIds.map((fid) => ({ id: fid })),
      };
    }

    // Atualização de Impostos
    if (taxData) {
      data.rawMaterialTaxes = taxData;
    }

    // 7. Executar Update
    const updated = await this.prisma.rawMaterial.update({
      where: { id },
      data,
      include: {
        freights: {
          select: {
            id: true,
            name: true,
            unitPrice: true,
            currency: true,
            originCity: true,
            originUf: true,
            destinationCity: true,
            destinationUf: true,
          },
        },
        rawMaterialTaxes: true,
      },
    });

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);

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
  // VALIDAÇÃO DE IMPOSTOS
  // ==========================================

  private validateTaxList(taxes: any[]): void {
    if (!taxes || taxes.length === 0) return;

    // Verificar duplicados na lista enviada
    const names = taxes.map((t) => t.name.trim().toLowerCase());
    const hasDuplicates = names.length !== new Set(names).size;

    if (hasDuplicates) {
      throw new BadRequestException(
        'Existem impostos duplicados na lista. Cada imposto deve ter um nome único.',
      );
    }

    // Verificar nomes vazios
    const hasEmptyNames = taxes.some((t) => !t.name || !t.name.trim());
    if (hasEmptyNames) {
      throw new BadRequestException('Todos os impostos devem ter um nome');
    }
  }

  // ==========================================
  // LOGS E HISTÓRICO
  // ==========================================

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

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasMore,
      },
    };
  }

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

    return logs;
  }

  // ==========================================
  // MÉTODOS PRIVADOS DE LOG
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

    // Log de campos simples
    for (const field of fieldsToTrack) {
      const newValue = newData[field];
      const oldValue = oldData[field];

      if (newValue === undefined) continue;

      let areDifferent = newValue !== oldValue;

      if (oldValue && typeof oldValue === 'object' && 'toFixed' in oldValue) {
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

    // Log de fretes
    if (newData.freightIds !== undefined) {
      const oldFreightIds = oldData.freights.map((f: any) => f.id).sort();
      const newFreightIds = [...newData.freightIds].sort();

      const areFreightsDifferent =
        JSON.stringify(oldFreightIds) !== JSON.stringify(newFreightIds);

      if (areFreightsDifferent) {
        const oldFreightNames = oldData.freights
          .map((f: any) => f.name)
          .join(', ');

        const newFreights = await this.prisma.freight.findMany({
          where: { id: { in: newData.freightIds } },
          select: { name: true },
        });
        const newFreightNames = newFreights.map((f) => f.name).join(', ');

        await this.createChangeLog(
          oldData.id,
          'freights',
          oldFreightNames || 'Nenhum',
          newFreightNames || 'Nenhum',
          userId,
        );
      }
    }

    // Log de impostos
    if (newData.rawMaterialTaxes !== undefined) {
      const oldTaxes = oldData.rawMaterialTaxes
        .map((t: any) => `${t.name} (${t.rate}%)`)
        .join(', ');

      const newTaxes = newData.rawMaterialTaxes
        .map((t: any) => `${t.name} (${t.rate}%)`)
        .join(', ');

      if (oldTaxes !== newTaxes) {
        await this.createChangeLog(
          oldData.id,
          'rawMaterialTaxes',
          oldTaxes || 'Nenhum',
          newTaxes || 'Nenhum',
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
        freights: true,
        rawMaterialTaxes: true,
      },
    });

    const formattedData = data.map((item) => {
      const freightsStr = item.freights
        .map((f) => `${f.name} (${f.currency} ${f.unitPrice})`)
        .join('; ');

      // Calcular preço final
      const basePrice =
        Number(item.acquisitionPrice) + Number(item.additionalCost);
      const freightTotal = item.freights.reduce(
        (sum, f) => sum + Number(f.unitPrice),
        0,
      );

      const nonRecoverableTaxes = item.rawMaterialTaxes
        .filter((t) => !t.recoverable)
        .reduce((sum, t) => sum + basePrice * (Number(t.rate) / 100), 0);

      const finalPrice = basePrice + freightTotal + nonRecoverableTaxes;

      return {
        Código: item.code,
        Nome: item.name,
        Descrição: item.description || '',
        'Unidade de Medida': item.measurementUnit,
        'Grupo de Insumo': item.inputGroup || '',
        'Prazo de Pagamento': `${item.paymentTerm} dias`,
        'Preço Base': item.acquisitionPrice.toString(),
        'Preço Final': finalPrice.toFixed(2),
        Moeda: item.currency,
        'Preço em BRL': item.priceConvertedBrl.toString(),
        'Custo Adicional': item.additionalCost.toString(),
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
