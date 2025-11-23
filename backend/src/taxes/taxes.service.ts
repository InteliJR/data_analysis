// src/taxes/taxes.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFreightTaxDto } from './dto/create-freight-tax.dto';
import { UpdateFreightTaxDto } from './dto/update-freight-tax.dto';
import { CreateRawMaterialTaxDto } from './dto/create-raw-material-tax.dto';
import { UpdateRawMaterialTaxDto } from './dto/update-raw-material-tax.dto';
import { QueryTaxesDto } from './dto/query-taxes.dto';
import { ExportTaxesDto } from './dto/export-taxes.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TaxesService {
  constructor(private readonly prisma: PrismaService) {}

  // ========================================
  // FREIGHT TAXES
  // ========================================

  async findAllFreightTaxes(query: QueryTaxesDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || 'name';
    const sortOrder = query.sortOrder || 'asc';

    const where: Prisma.FreightTaxWhereInput = {};

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const validSortFields = ['name', 'rate', 'createdAt', 'updatedAt'];
    const shouldSortByCount = sortBy === 'freightsCount';

    let orderBy: any = {};
    if (validSortFields.includes(sortBy)) {
      orderBy = { [sortBy]: sortOrder };
    } else if (!shouldSortByCount) {
      orderBy = { name: 'asc' };
    }

    const [data, total] = await Promise.all([
      this.prisma.freightTax.findMany({
        where,
        skip,
        take: limit,
        orderBy: shouldSortByCount ? undefined : orderBy,
        include: {
          _count: {
            select: {
              freights: true,
            },
          },
          freights: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.freightTax.count({ where }),
    ]);

    let processedData = data.map((tax) => ({
      ...tax,
      freightsCount: tax._count.freights,
    }));

    if (shouldSortByCount) {
      processedData.sort((a, b) => {
        const diff = a.freightsCount - b.freightsCount;
        return sortOrder === 'asc' ? diff : -diff;
      });
    }

    return {
      data: processedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneFreightTax(id: string) {
    const tax = await this.prisma.freightTax.findUnique({
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
          },
        },
        _count: {
          select: {
            freights: true,
          },
        },
      },
    });

    if (!tax) {
      throw new NotFoundException('Imposto de frete não encontrado');
    }

    return {
      ...tax,
      freightsCount: tax._count.freights,
    };
  }

  async createFreightTax(dto: CreateFreightTaxDto) {
    // Verifica se já existe um imposto com este nome
    const existing = await this.prisma.freightTax.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Já existe um imposto com este nome');
    }

    // Se houver fretes para conectar, valida
    if (dto.freightIds && dto.freightIds.length > 0) {
      const freights = await this.prisma.freight.findMany({
        where: { id: { in: dto.freightIds } },
        include: {
          freightTaxes: true,
        },
      });

      if (freights.length !== dto.freightIds.length) {
        throw new BadRequestException(
          'Um ou mais fretes não foram encontrados',
        );
      }

      // Verifica se algum frete já tem um imposto com o mesmo nome
      for (const freight of freights) {
        const hasTax = freight.freightTaxes.some((t) => t.name === dto.name);
        if (hasTax) {
          throw new ConflictException(
            `O frete "${freight.name}" já possui um imposto com o nome "${dto.name}"`,
          );
        }
      }
    }

    const tax = await this.prisma.freightTax.create({
      data: {
        name: dto.name,
        rate: new Prisma.Decimal(dto.rate),
        freights:
          dto.freightIds && dto.freightIds.length > 0
            ? {
                connect: dto.freightIds.map((id) => ({ id })),
              }
            : undefined,
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
        _count: {
          select: {
            freights: true,
          },
        },
      },
    });

    return {
      ...tax,
      freightsCount: tax._count.freights,
    };
  }

  async updateFreightTax(id: string, dto: UpdateFreightTaxDto) {
    const currentTax = await this.findOneFreightTax(id);

    // Se está mudando o nome, verifica duplicação
    if (dto.name && dto.name !== currentTax.name) {
      const existing = await this.prisma.freightTax.findFirst({
        where: {
          name: dto.name,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('Já existe um imposto com este nome');
      }
    }

    const updateData: Prisma.FreightTaxUpdateInput = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }

    if (dto.rate !== undefined) {
      updateData.rate = new Prisma.Decimal(dto.rate);
    }

    // Se está enviando novos fretes para associar
    if (dto.freightIds !== undefined && dto.freightIds.length > 0) {
      const freights = await this.prisma.freight.findMany({
        where: { id: { in: dto.freightIds } },
        include: {
          freightTaxes: true,
        },
      });

      if (freights.length !== dto.freightIds.length) {
        throw new BadRequestException(
          'Um ou mais fretes não foram encontrados',
        );
      }

      // Verifica se algum dos novos fretes já tem um imposto com este nome
      const taxName = dto.name || currentTax.name;
      for (const freight of freights) {
        const hasTax = freight.freightTaxes.some(
          (t) => t.name === taxName && t.id !== id,
        );
        if (hasTax) {
          throw new ConflictException(
            `O frete "${freight.name}" já possui um imposto com o nome "${taxName}"`,
          );
        }
      }

      // CORREÇÃO: Adiciona os novos fretes SEM remover os existentes
      const currentFreightIds = currentTax.freights?.map((f) => f.id) || [];
      const allFreightIds = [
        ...new Set([...currentFreightIds, ...dto.freightIds]),
      ];

      updateData.freights = {
        set: allFreightIds.map((id) => ({ id })),
      };
    }

    const tax = await this.prisma.freightTax.update({
      where: { id },
      data: updateData,
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
        _count: {
          select: {
            freights: true,
          },
        },
      },
    });

    return {
      ...tax,
      freightsCount: tax._count.freights,
    };
  }

  async removeFreightTax(id: string) {
    await this.findOneFreightTax(id);
    await this.prisma.freightTax.delete({ where: { id } });
    return { message: 'Imposto de frete excluído com sucesso' };
  }

  async exportFreightTaxes(dto: ExportTaxesDto) {
    const limit = dto.limit || 500;
    const sortBy = dto.sortBy || 'name';
    const sortOrder = dto.sortOrder || 'asc';

    const where: Prisma.FreightTaxWhereInput = {};

    if (dto.filters?.search) {
      where.name = { contains: dto.filters.search, mode: 'insensitive' };
    }

    const validSortFields = ['name', 'rate', 'createdAt', 'updatedAt'];
    const shouldSortByCount = sortBy === 'freightsCount';

    let orderBy: any = {};
    if (validSortFields.includes(sortBy)) {
      orderBy = { [sortBy]: sortOrder };
    } else if (!shouldSortByCount) {
      orderBy = { name: 'asc' };
    }

    const taxes = await this.prisma.freightTax.findMany({
      where,
      take: limit,
      orderBy: shouldSortByCount ? undefined : orderBy,
      include: {
        _count: {
          select: {
            freights: true,
          },
        },
      },
    });

    let processedTaxes = taxes.map((tax) => ({
      ...tax,
      freightsCount: tax._count.freights,
    }));

    if (shouldSortByCount) {
      processedTaxes.sort((a, b) => {
        const diff = a.freightsCount - b.freightsCount;
        return sortOrder === 'asc' ? diff : -diff;
      });
    }

    const header = 'Nome,Taxa (%),Quantidade de Fretes,Data de Criação';
    const rows = processedTaxes.map((tax) => {
      const name = this.escapeCsv(tax.name);
      const rate = Number(tax.rate).toFixed(2);
      const freightsCount = tax.freightsCount;
      const createdAt = new Date(tax.createdAt).toLocaleDateString('pt-BR');

      return `${name},${rate},${freightsCount},${createdAt}`;
    });

    return [header, ...rows].join('\n');
  }

  // ========================================
  // RAW MATERIAL TAXES
  // ========================================

  async findAllRawMaterialTaxes(query: QueryTaxesDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || 'name';
    const sortOrder = query.sortOrder || 'asc';

    const where: Prisma.RawMaterialTaxWhereInput = {};

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const validSortFields = [
      'name',
      'rate',
      'recoverable',
      'createdAt',
      'updatedAt',
    ];
    const shouldSortByCount =
      sortBy === 'rawMaterialsCount' || sortBy === 'productsCount';

    let orderBy: any = {};
    if (validSortFields.includes(sortBy)) {
      orderBy = { [sortBy]: sortOrder };
    } else if (!shouldSortByCount) {
      orderBy = { name: 'asc' };
    }

    const [data, total] = await Promise.all([
      this.prisma.rawMaterialTax.findMany({
        where,
        skip,
        take: limit,
        orderBy: shouldSortByCount ? undefined : orderBy,
        include: {
          _count: {
            select: {
              rawMaterials: true,
            },
          },
          rawMaterials: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      }),
      this.prisma.rawMaterialTax.count({ where }),
    ]);

    const dataWithCounts = await Promise.all(
      data.map(async (tax) => {
        const productsCount = await this.prisma.product.count({
          where: {
            productRawMaterials: {
              some: {
                rawMaterial: {
                  rawMaterialTaxes: {
                    some: {
                      id: tax.id,
                    },
                  },
                },
              },
            },
          },
        });

        return {
          ...tax,
          rawMaterialsCount: tax._count.rawMaterials,
          productsCount,
        };
      }),
    );

    if (shouldSortByCount) {
      dataWithCounts.sort((a, b) => {
        const field = sortBy as 'rawMaterialsCount' | 'productsCount';
        const diff = a[field] - b[field];
        return sortOrder === 'asc' ? diff : -diff;
      });
    }

    return {
      data: dataWithCounts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneRawMaterialTax(id: string) {
    const tax = await this.prisma.rawMaterialTax.findUnique({
      where: { id },
      include: {
        rawMaterials: {
          select: {
            id: true,
            name: true,
            code: true,
            acquisitionPrice: true,
            currency: true,
            measurementUnit: true,
          },
        },
        _count: {
          select: {
            rawMaterials: true,
          },
        },
      },
    });

    if (!tax) {
      throw new NotFoundException('Imposto de matéria-prima não encontrado');
    }

    const productsCount = await this.prisma.product.count({
      where: {
        productRawMaterials: {
          some: {
            rawMaterial: {
              rawMaterialTaxes: {
                some: {
                  id: tax.id,
                },
              },
            },
          },
        },
      },
    });

    return {
      ...tax,
      rawMaterialsCount: tax._count.rawMaterials,
      productsCount,
    };
  }

  async createRawMaterialTax(dto: CreateRawMaterialTaxDto) {
    const existing = await this.prisma.rawMaterialTax.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Já existe um imposto com este nome');
    }

    if (dto.rawMaterialIds && dto.rawMaterialIds.length > 0) {
      const rawMaterials = await this.prisma.rawMaterial.findMany({
        where: { id: { in: dto.rawMaterialIds } },
        include: {
          rawMaterialTaxes: true,
        },
      });

      if (rawMaterials.length !== dto.rawMaterialIds.length) {
        throw new BadRequestException(
          'Uma ou mais matérias-primas não foram encontradas',
        );
      }

      for (const rawMaterial of rawMaterials) {
        const hasTax = rawMaterial.rawMaterialTaxes.some(
          (t) => t.name === dto.name,
        );
        if (hasTax) {
          throw new ConflictException(
            `A matéria-prima "${rawMaterial.name}" já possui um imposto com o nome "${dto.name}"`,
          );
        }
      }
    }

    const tax = await this.prisma.rawMaterialTax.create({
      data: {
        name: dto.name,
        rate: new Prisma.Decimal(dto.rate),
        recoverable: dto.recoverable,
        rawMaterials:
          dto.rawMaterialIds && dto.rawMaterialIds.length > 0
            ? {
                connect: dto.rawMaterialIds.map((id) => ({ id })),
              }
            : undefined,
      },
      include: {
        rawMaterials: {
          select: {
            id: true,
            name: true,
            code: true,
            acquisitionPrice: true,
            currency: true,
            measurementUnit: true,
          },
        },
        _count: {
          select: {
            rawMaterials: true,
          },
        },
      },
    });

    const productsCount = await this.prisma.product.count({
      where: {
        productRawMaterials: {
          some: {
            rawMaterial: {
              rawMaterialTaxes: {
                some: {
                  id: tax.id,
                },
              },
            },
          },
        },
      },
    });

    return {
      ...tax,
      rawMaterialsCount: tax._count.rawMaterials,
      productsCount,
    };
  }

  async updateRawMaterialTax(id: string, dto: UpdateRawMaterialTaxDto) {
    const currentTax = await this.findOneRawMaterialTax(id);

    if (dto.name && dto.name !== currentTax.name) {
      const existing = await this.prisma.rawMaterialTax.findFirst({
        where: {
          name: dto.name,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('Já existe um imposto com este nome');
      }
    }

    const updateData: Prisma.RawMaterialTaxUpdateInput = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.rate !== undefined) updateData.rate = new Prisma.Decimal(dto.rate);
    if (dto.recoverable !== undefined) updateData.recoverable = dto.recoverable;

    // CORREÇÃO: Adiciona as novas matérias-primas SEM remover as existentes
    if (dto.rawMaterialIds !== undefined && dto.rawMaterialIds.length > 0) {
      const rawMaterials = await this.prisma.rawMaterial.findMany({
        where: { id: { in: dto.rawMaterialIds } },
        include: {
          rawMaterialTaxes: true,
        },
      });

      if (rawMaterials.length !== dto.rawMaterialIds.length) {
        throw new BadRequestException(
          'Uma ou mais matérias-primas não foram encontradas',
        );
      }

      const taxName = dto.name || currentTax.name;
      for (const rawMaterial of rawMaterials) {
        const hasTax = rawMaterial.rawMaterialTaxes.some(
          (t) => t.name === taxName && t.id !== id,
        );
        if (hasTax) {
          throw new ConflictException(
            `A matéria-prima "${rawMaterial.name}" já possui um imposto com o nome "${taxName}"`,
          );
        }
      }

      const currentRawMaterialIds =
        currentTax.rawMaterials?.map((rm) => rm.id) || [];
      const allRawMaterialIds = [
        ...new Set([...currentRawMaterialIds, ...dto.rawMaterialIds]),
      ];

      updateData.rawMaterials = {
        set: allRawMaterialIds.map((id) => ({ id })),
      };
    }

    const tax = await this.prisma.rawMaterialTax.update({
      where: { id },
      data: updateData,
      include: {
        rawMaterials: {
          select: {
            id: true,
            name: true,
            code: true,
            acquisitionPrice: true,
            currency: true,
            measurementUnit: true,
          },
        },
        _count: {
          select: {
            rawMaterials: true,
          },
        },
      },
    });

    const productsCount = await this.prisma.product.count({
      where: {
        productRawMaterials: {
          some: {
            rawMaterial: {
              rawMaterialTaxes: {
                some: {
                  id: tax.id,
                },
              },
            },
          },
        },
      },
    });

    return {
      ...tax,
      rawMaterialsCount: tax._count.rawMaterials,
      productsCount,
    };
  }

  async removeRawMaterialTax(id: string) {
    await this.findOneRawMaterialTax(id);
    await this.prisma.rawMaterialTax.delete({ where: { id } });
    return { message: 'Imposto de matéria-prima excluído com sucesso' };
  }

  async exportRawMaterialTaxes(dto: ExportTaxesDto) {
    const limit = dto.limit || 500;
    const sortBy = dto.sortBy || 'name';
    const sortOrder = dto.sortOrder || 'asc';

    const where: Prisma.RawMaterialTaxWhereInput = {};

    if (dto.filters?.search) {
      where.name = { contains: dto.filters.search, mode: 'insensitive' };
    }

    const validSortFields = [
      'name',
      'rate',
      'recoverable',
      'createdAt',
      'updatedAt',
    ];
    const shouldSortByCount =
      sortBy === 'rawMaterialsCount' || sortBy === 'productsCount';

    let orderBy: any = {};
    if (validSortFields.includes(sortBy)) {
      orderBy = { [sortBy]: sortOrder };
    } else if (!shouldSortByCount) {
      orderBy = { name: 'asc' };
    }

    const taxes = await this.prisma.rawMaterialTax.findMany({
      where,
      take: limit,
      orderBy: shouldSortByCount ? undefined : orderBy,
      include: {
        _count: {
          select: {
            rawMaterials: true,
          },
        },
      },
    });

    const taxesWithCounts = await Promise.all(
      taxes.map(async (tax) => {
        const productsCount = await this.prisma.product.count({
          where: {
            productRawMaterials: {
              some: {
                rawMaterial: {
                  rawMaterialTaxes: {
                    some: {
                      id: tax.id,
                    },
                  },
                },
              },
            },
          },
        });

        return {
          ...tax,
          rawMaterialsCount: tax._count.rawMaterials,
          productsCount,
        };
      }),
    );

    if (shouldSortByCount) {
      taxesWithCounts.sort((a, b) => {
        const field = sortBy as 'rawMaterialsCount' | 'productsCount';
        const diff = a[field] - b[field];
        return sortOrder === 'asc' ? diff : -diff;
      });
    }

    const header =
      'Nome,Taxa (%),Recuperável,Qtd. Matérias-Primas,Qtd. Produtos,Data de Criação';
    const rows = taxesWithCounts.map((tax) => {
      const name = this.escapeCsv(tax.name);
      const rate = Number(tax.rate).toFixed(2);
      const recoverable = tax.recoverable ? 'Sim' : 'Não';
      const rawMaterialsCount = tax.rawMaterialsCount;
      const productsCount = tax.productsCount;
      const createdAt = new Date(tax.createdAt).toLocaleDateString('pt-BR');

      return `${name},${rate},${recoverable},${rawMaterialsCount},${productsCount},${createdAt}`;
    });

    return [header, ...rows].join('\n');
  }

  private escapeCsv(value: string): string {
    if (!value) return '';
    if (
      value.includes(',') ||
      value.includes('"') ||
      value.includes('\n') ||
      value.includes(';')
    ) {
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    }
    return value;
  }
}
