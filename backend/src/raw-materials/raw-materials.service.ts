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

    // 2. Cria a matéria-prima (campos comuns)
    const rawMaterial = await this.prisma.rawMaterial.create({
      data: {
        code: createRawMaterialDto.code.toUpperCase(),
        name: createRawMaterialDto.name,
        description: createRawMaterialDto.description,
        measurementUnit: createRawMaterialDto.measurementUnit,
        inputGroup: createRawMaterialDto.inputGroup,
        paymentTerm: createRawMaterialDto.paymentTerm,
      },
      include: {},
    });

    // 3. Criar localidades com fretes e impostos locais
    if (!createRawMaterialDto.locations || createRawMaterialDto.locations.length === 0) {
      throw new BadRequestException('Deve fornecer ao menos uma localidade');
    }

    for (const loc of createRawMaterialDto.locations) {
      // Validar fretes
      if (loc.freightIds && loc.freightIds.length > 0) {
        const count = await this.prisma.freight.count({
          where: { id: { in: loc.freightIds } },
        });
        if (count !== loc.freightIds.length) {
          throw new BadRequestException('Um ou mais IDs de frete da localidade não foram encontrados');
        }
      }

      // Processar impostos por localidade
      const locationTaxesCreate: any[] = [];
      if (loc.taxes && loc.taxes.length > 0) {
        // validar duplicados por nome
        const names = loc.taxes
          .filter((t) => t.name)
          .map((t) => t.name!.trim().toLowerCase());
        const hasDup = names.length !== new Set(names).size;
        if (hasDup) {
          throw new BadRequestException('Existem impostos duplicados por localidade');
        }

        for (const t of loc.taxes) {
          let taxId = t.taxId;
          if (!taxId && t.name) {
            const existing = await this.prisma.rawMaterialTax.findUnique({
              where: { name: t.name.trim() },
            });
            if (existing) taxId = existing.id;
            else {
              const createdTax = await this.prisma.rawMaterialTax.create({
                data: { name: t.name.trim(), rate: t.rate, recoverable: t.recoverable },
              });
              taxId = createdTax.id;
            }
          }
          if (!taxId) {
            throw new BadRequestException('Taxa inválida: informe taxId ou name');
          }
          locationTaxesCreate.push({ taxId, rate: t.rate, recoverable: t.recoverable });
        }
      }

      // Criar localidade
      await this.prisma.rawMaterialLocation.create({
        data: {
          rawMaterialId: rawMaterial.id,
          country: loc.country ?? 'BR',
          stateUf: loc.stateUf,
          city: loc.city,
          acquisitionPrice: loc.acquisitionPrice,
          currency: loc.currency,
          priceConvertedBrl: loc.priceConvertedBrl,
          additionalCost: loc.additionalCost,
          freights: {
            connect: (loc.freightIds ?? []).map((id) => ({ id })),
          },
          locationTaxes: {
            create: locationTaxesCreate,
          },
        },
      });
    }

    // 4. Log de criação
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
        // filtros por localidade
        query.stateUf || query.city
          ? {
              locations: {
                some: {
                  AND: [
                    query.stateUf ? { stateUf: query.stateUf } : {},
                    query.city
                      ? { city: { contains: query.city, mode: 'insensitive' } }
                      : {},
                  ],
                },
              },
            }
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
          locations: {
            include: {
              freights: {
                include: {
                  freightTaxes: {
                    select: { id: true, name: true, rate: true },
                  },
                },
              },
              locationTaxes: {
                include: {
                  tax: { select: { id: true, name: true } },
                },
              },
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
        locations: {
          include: {
            freights: {
              include: {
                freightTaxes: { select: { id: true, name: true, rate: true } },
              },
            },
            locationTaxes: {
              include: {
                tax: { select: { id: true, name: true } },
              },
            },
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

    // 3. Validações antigas removidas: fretes/impostos agora são por localidade

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
    };

    // Atualização de localidades: substituição completa (set)
    if (updateRawMaterialDto.locations !== undefined) {
      // Estratégia simples: apagar e recriar todas as localidades
      await this.prisma.rawMaterialLocation.deleteMany({ where: { rawMaterialId: id } });
      for (const loc of updateRawMaterialDto.locations) {
        // Validar fretes
        if (loc.freightIds && loc.freightIds.length > 0) {
          const count = await this.prisma.freight.count({
            where: { id: { in: loc.freightIds } },
          });
          if (count !== loc.freightIds.length) {
            throw new BadRequestException('Um ou mais IDs de frete da localidade não foram encontrados');
          }
        }

        const locationTaxesCreate: any[] = [];
        if (loc.taxes && loc.taxes.length > 0) {
          for (const t of loc.taxes) {
            let taxId = t.taxId;
            if (!taxId && t.name) {
              const existing = await this.prisma.rawMaterialTax.findUnique({
                where: { name: t.name.trim() },
              });
              if (existing) taxId = existing.id;
              else {
                const createdTax = await this.prisma.rawMaterialTax.create({
                  data: { name: t.name.trim(), rate: t.rate, recoverable: t.recoverable },
                });
                taxId = createdTax.id;
              }
            }
            if (!taxId) {
              throw new BadRequestException('Taxa inválida: informe taxId ou name');
            }
            locationTaxesCreate.push({ taxId, rate: t.rate, recoverable: t.recoverable });
          }
        }

        await this.prisma.rawMaterialLocation.create({
          data: {
            rawMaterialId: id,
            country: loc.country ?? 'BR',
            stateUf: loc.stateUf,
            city: loc.city,
            acquisitionPrice: loc.acquisitionPrice,
            currency: loc.currency,
            priceConvertedBrl: loc.priceConvertedBrl,
            additionalCost: loc.additionalCost,
            freights: {
              connect: (loc.freightIds ?? []).map((fid) => ({ id: fid })),
            },
            locationTaxes: { create: locationTaxesCreate },
          },
        });
      }
    }

    // 7. Executar Update
    const updated = await this.prisma.rawMaterial.update({
      where: { id },
      data,
      include: {
        locations: true,
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

    // Log de fretes removido: fretes agora são por localidade (locations).

    // Log de impostos
    // Campos globais de frete/impostos foram movidos para localidades.
    // Logs específicos de mudanças em localidades são tratados ao recriar locations no update.

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
        locations: {
          include: {
            freights: true,
            locationTaxes: { include: { tax: true } },
          },
        },
      },
    });

    const formattedData = data.map((item) => {
      const firstLoc = (item as any).locations?.[0];
      const freightsStr = (firstLoc?.freights ?? [])
        .map((f) => `${f.name} (${f.currency} ${f.unitPrice})`)
        .join('; ');

      // Calcular preço final
      const basePrice = Number((firstLoc?.acquisitionPrice ?? 0)) + Number((firstLoc?.additionalCost ?? 0));
      const freightTotal = (firstLoc?.freights ?? []).reduce(
        (sum, f) => sum + Number(f.unitPrice),
        0,
      );

      const recoverableTaxes = (firstLoc?.locationTaxes ?? [])
        .filter((t) => t.recoverable)
        .reduce((sum, t) => sum + basePrice * (Number(t.rate) / 100), 0);

      // Regra: NÃO somar impostos não recuperáveis ao preço final do export
      const finalPrice = basePrice + freightTotal - recoverableTaxes;

      return {
        Código: item.code,
        Nome: item.name,
        Descrição: item.description || '',
        'Unidade de Medida': item.measurementUnit,
        'Grupo de Insumo': item.inputGroup || '',
        'Prazo de Pagamento': `${item.paymentTerm} dias`,
        'Preço Base': (firstLoc?.acquisitionPrice ?? 0).toString(),
        'Preço Final': finalPrice.toFixed(2),
        Moeda: firstLoc?.currency ?? 'BRL',
        'Preço em BRL': (firstLoc?.priceConvertedBrl ?? 0).toString(),
        'Custo Adicional': (firstLoc?.additionalCost ?? 0).toString(),
        Fretes: freightsStr,
        Impostos: (firstLoc?.locationTaxes ?? [])
          .map(
            (lt) =>
              `${lt.tax?.name ?? ''} (${lt.rate}%)${lt.recoverable ? ' [Recuperável]' : ''}`,
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
