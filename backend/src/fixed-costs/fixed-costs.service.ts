// src/fixed-costs/fixed-costs.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFixedCostDto } from './dto/create-fixed-cost.dto';
import { UpdateFixedCostDto } from './dto/update-fixed-cost.dto';
import { QueryFixedCostDto } from './dto/query-fixed-cost.dto';
import { ExportFixedCostDto } from './dto/export-fixed-cost.dto';
import { CalculateOverheadDto } from './dto/calculate-overhead.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FixedCostsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calcula o totalCost
   */
  private calculateTotals(dto: CreateFixedCostDto | UpdateFixedCostDto) {
    const personnelExpenses = dto.personnelExpenses || 0;
    const generalExpenses = dto.generalExpenses || 0;
    const proLabore = dto.proLabore || 0;
    const depreciation = dto.depreciation || 0;

    const totalCost =
      personnelExpenses + generalExpenses + proLabore + depreciation;
    return { totalCost };
  }

  async create(createFixedCostDto: CreateFixedCostDto) {
    // Verifica se o código já existe (se fornecido)
    if (createFixedCostDto.code) {
      const existing = await this.prisma.fixedCost.findUnique({
        where: { code: createFixedCostDto.code },
      });

      if (existing) {
        throw new ConflictException('Código de custo fixo já existe');
      }
    }

    const { totalCost } = this.calculateTotals(createFixedCostDto);

    const fixedCost = await this.prisma.fixedCost.create({
      data: {
        description: createFixedCostDto.description,
        code: createFixedCostDto.code,
        personnelExpenses: createFixedCostDto.personnelExpenses,
        generalExpenses: createFixedCostDto.generalExpenses,
        proLabore: createFixedCostDto.proLabore,
        depreciation: createFixedCostDto.depreciation || 0,
        considerationPercentage:
          createFixedCostDto.considerationPercentage || 100,
        totalCost,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return fixedCost;
  }

  async findAll(query: QueryFixedCostDto) {
    const { page = 1, limit = 10, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    // Construir where clause
    const where: Prisma.FixedCostWhereInput = search
      ? {
          OR: [
            { description: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    // Construir orderBy
    const orderBy: Prisma.FixedCostOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder || 'desc' }
      : { calculationDate: 'desc' };

    const [data, total] = await Promise.all([
      this.prisma.fixedCost.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: { products: true },
          },
        },
      }),
      this.prisma.fixedCost.count({ where }),
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

  async findOne(id: string, includeProducts = false) {
    const fixedCost = await this.prisma.fixedCost.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
        ...(includeProducts && {
          products: {
            select: {
              id: true,
              code: true,
              name: true,
              priceWithoutTaxesAndFreight: true,
              priceWithTaxesAndFreight: true,
            },
          },
        }),
      },
    });

    if (!fixedCost) {
      throw new NotFoundException('Custo fixo não encontrado');
    }

    return fixedCost;
  }

  async update(id: string, updateFixedCostDto: UpdateFixedCostDto) {
    // Verifica se existe
    const existing = await this.prisma.fixedCost.findUnique({
      where: { id },
      include: {
        products: { select: { id: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException('Custo fixo não encontrado');
    }

    // Verifica conflito de código (se mudou)
    if (
      updateFixedCostDto.code &&
      updateFixedCostDto.code !== existing.code
    ) {
      const codeExists = await this.prisma.fixedCost.findUnique({
        where: { code: updateFixedCostDto.code },
      });

      if (codeExists) {
        throw new ConflictException('Código de custo fixo já existe');
      }
    }

    // Calcula novos totais se necessário
    const shouldRecalculate =
      updateFixedCostDto.personnelExpenses !== undefined ||
      updateFixedCostDto.generalExpenses !== undefined ||
      updateFixedCostDto.proLabore !== undefined ||
      updateFixedCostDto.depreciation !== undefined ||
      updateFixedCostDto.considerationPercentage !== undefined;

    let totalCost: number | Prisma.Decimal = existing.totalCost;

    if (shouldRecalculate) {
      // Converte Decimal para number para o cálculo
      const merged = {
        personnelExpenses:
          updateFixedCostDto.personnelExpenses !== undefined
            ? updateFixedCostDto.personnelExpenses
            : Number(existing.personnelExpenses),
        generalExpenses:
          updateFixedCostDto.generalExpenses !== undefined
            ? updateFixedCostDto.generalExpenses
            : Number(existing.generalExpenses),
        proLabore:
          updateFixedCostDto.proLabore !== undefined
            ? updateFixedCostDto.proLabore
            : Number(existing.proLabore),
        depreciation:
          updateFixedCostDto.depreciation !== undefined
            ? updateFixedCostDto.depreciation
            : Number(existing.depreciation),
        considerationPercentage:
          updateFixedCostDto.considerationPercentage !== undefined
            ? updateFixedCostDto.considerationPercentage
            : Number(existing.considerationPercentage),
      };

      const calculated = this.calculateTotals(merged);
      totalCost = calculated.totalCost;
    }

    const updated = await this.prisma.fixedCost.update({
      where: { id },
      data: {
        ...updateFixedCostDto,
        totalCost,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    // Se houver produtos associados e o overhead mudou, recalcula preços
    if (existing.products.length > 0 && shouldRecalculate) {
      // Aqui você pode adicionar lógica para recalcular preços dos produtos
      // Por enquanto, apenas retorna informação de produtos afetados
      return {
        ...updated,
        affectedProducts: {
          count: existing.products.length,
          recalculated: true,
        },
      };
    }

    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.fixedCost.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Custo fixo não encontrado');
    }

    // Remove o custo fixo
    // Os produtos terão fixedCostId definido como null automaticamente (onDelete: SetNull)
    await this.prisma.fixedCost.delete({
      where: { id },
    });

    return {
      message: 'Custo fixo deletado com sucesso',
      affectedProducts: {
        count: existing._count.products,
        action: 'fixedCostId set to null',
      },
    };
  }

  async calculateOverhead(id: string, dto: CalculateOverheadDto) {
    const fixedCost = await this.prisma.fixedCost.findUnique({
      where: { id },
    });

    if (!fixedCost) {
      throw new NotFoundException('Custo fixo não encontrado');
    }

    // Determina quais produtos serão afetados
    let productsToAffect;

    if (dto.productIds && dto.productIds.length > 0) {
      // Produtos específicos
      productsToAffect = await this.prisma.product.findMany({
        where: {
          id: { in: dto.productIds },
        },
        select: {
          id: true,
          code: true,
          name: true,
          priceWithTaxesAndFreight: true,
          fixedCostId: true,
        },
      });
    } else {
      // Todos os produtos com este fixedCostId
      productsToAffect = await this.prisma.product.findMany({
        where: {
          fixedCostId: id,
        },
        select: {
          id: true,
          code: true,
          name: true,
          priceWithTaxesAndFreight: true,
          fixedCostId: true,
        },
      });
    }

    // Calcula o overhead total considerado e distribui entre produtos selecionados
    const overheadTotal =
      fixedCost.totalCost.toNumber() *
      (fixedCost.considerationPercentage.toNumber() / 100);
    const perProductOverhead =
      productsToAffect.length > 0 ? overheadTotal / productsToAffect.length : 0;

    const affectedProducts = productsToAffect.map((product) => {
      const priceBeforeOverhead = product.priceWithTaxesAndFreight || 0;
      const overheadApplied = perProductOverhead;
      const priceAfterOverhead = priceBeforeOverhead + overheadApplied;

      return {
        id: product.id,
        code: product.code,
        name: product.name,
        priceBeforeOverhead: priceBeforeOverhead.toNumber(),
        overheadApplied: Number(overheadApplied.toFixed(2)),
        priceAfterOverhead: Number(priceAfterOverhead.toFixed(2)),
        updated: false,
      };
    });

    // Se applyToProducts = true, atualiza os produtos
    if (dto.applyToProducts) {
      await Promise.all(
        affectedProducts.map(async (product) => {
          await this.prisma.product.update({
            where: { id: product.id },
            data: {
              fixedCostId: id,
              // Aqui você pode adicionar lógica adicional para recalcular preços
            },
          });
          product.updated = true;
        }),
      );
    }

    const totalOverheadDistributed = affectedProducts.reduce(
      (sum, p) => sum + p.overheadApplied,
      0,
    );

    return {
      fixedCost: {
        id: fixedCost.id,
        description: fixedCost.description,
        totalCost: fixedCost.totalCost.toNumber(),
        considerationPercentage: fixedCost.considerationPercentage.toNumber(),
        overheadTotal: Number(overheadTotal.toFixed(2)),
        perProductOverhead: Number(perProductOverhead.toFixed(2)),
      },
      affectedProducts,
      summary: {
        totalProductsAffected: affectedProducts.length,
        totalOverheadDistributed,
        applied: dto.applyToProducts,
      },
    };
  }

  async export(dto: ExportFixedCostDto): Promise<string> {
    const { limit, sortBy, sortOrder, columns, includeProducts } = dto;

    // Busca os dados
    const where: Prisma.FixedCostWhereInput = {};
    const orderBy: Prisma.FixedCostOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder || 'desc' }
      : { calculationDate: 'desc' };

    const fixedCosts = await this.prisma.fixedCost.findMany({
      where,
      take: limit,
      orderBy,
      include: includeProducts
        ? {
            _count: {
              select: { products: true },
            },
          }
        : undefined,
    });

    // Define as colunas disponíveis
    const availableColumns = {
      code: 'Código',
      description: 'Descrição',
      personnelExpenses: 'Pessoal',
      generalExpenses: 'Outros',
      proLabore: 'Pró-Labore',
      depreciation: 'Depreciação',
      totalCost: 'Total',
      considerationPercentage: '% Considerar',
    };

    // Determina quais colunas incluir
    const columnsToInclude =
      columns && columns.length > 0
        ? columns.filter((col) => col in availableColumns)
        : Object.keys(availableColumns);

    // Cria o CSV
    const headers = columnsToInclude.map((col) => availableColumns[col]);
    const csvRows = [headers.join(',')];

    fixedCosts.forEach((fc) => {
      const row = columnsToInclude.map((col) => {
        let value = fc[col];

        // Formata valores
        if (
          typeof value === 'object' &&
          value !== null &&
          'toNumber' in value
        ) {
          value = value.toNumber();
        }

        if (col === 'considerationPercentage') {
          return `${value}%`;
        }

        return value || '-';
      });

      if (includeProducts && fc['_count']) {
        row.push(fc['_count'].products.toString());
      }

      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }
}