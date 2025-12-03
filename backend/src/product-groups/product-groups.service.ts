// src/product-groups/product-groups.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductGroupDto } from './dto/create-product-group.dto';
import { UpdateProductGroupDto } from './dto/update-product-group.dto';
import { QueryProductGroupDto } from './dto/query-product-group.dto';
import { ProductGroupEntity } from './entities/product-group.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createProductGroupDto: CreateProductGroupDto,
  ): Promise<ProductGroupEntity> {
    try {
      const consideredFixedCostsTotal = await this.getConsideredFixedCostsTotal();
      const pct = (createProductGroupDto.porcentage ?? 0) / 100;
      const denom = createProductGroupDto.volumevendasconsiderar ?? 0;
      const overheadPerUnit = denom > 0 ? Number(((consideredFixedCostsTotal * pct) / denom).toFixed(2)) : 0;

      const productGroup = await this.prisma.productGroup.create({
        data: { ...createProductGroupDto, overheadPerUnit },
        include: {
          products: {
            select: {
              totalCostWithAllFreights: true,
            },
          },
        },
      });

      return this.mapToEntity(productGroup);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Já existe um grupo com este nome');
      }
      throw error;
    }
  }

  async findAll(query: QueryProductGroupDto) {
    const { page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    // Filtro de busca
    const where: Prisma.ProductGroupWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    // Buscar grupos com produtos
    const [productGroups, total] = await Promise.all([
      this.prisma.productGroup.findMany({
        where,
        include: {
          products: {
            select: {
              totalCostWithAllFreights: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      this.prisma.productGroup.count({ where }),
    ]);

    // Buscar totais globais e total considerado de custos fixos
    const [globalStats, consideredFixedCostsTotal] = await Promise.all([
      this.getGlobalStats(),
      this.getConsideredFixedCostsTotal(),
    ]);

    // Mapear para entidades com cálculos
    let data = productGroups.map((group) => {
      const entity = this.mapToEntityWithStats(group, globalStats);
      const pct = (entity.porcentage ?? 0) / 100;
      const denom = entity.volumevendasconsiderar ?? 0;
      entity.overheadPerUnit = denom > 0 ? Number((consideredFixedCostsTotal * pct / denom).toFixed(2)) : 0;
      return entity;
    });

    // Ordenação
    data = this.sortProductGroups(data, sortBy, sortOrder);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<ProductGroupEntity> {
    const productGroup = await this.prisma.productGroup.findUnique({
      where: { id },
      include: {
        products: {
          select: {
              totalCostWithAllFreights: true,
          },
        },
      },
    });

    if (!productGroup) {
      throw new NotFoundException('Grupo de produtos não encontrado');
    }

    const [globalStats, consideredFixedCostsTotal] = await Promise.all([
      this.getGlobalStats(),
      this.getConsideredFixedCostsTotal(),
    ]);
    const entity = this.mapToEntityWithStats(productGroup, globalStats);
    const pct = (entity.porcentage ?? 0) / 100;
    const denom = entity.volumevendasconsiderar ?? 0;
    entity.overheadPerUnit = denom > 0 ? Number((consideredFixedCostsTotal * pct / denom).toFixed(2)) : 0;
    return entity;
  }

  async update(
    id: string,
    updateProductGroupDto: UpdateProductGroupDto,
  ): Promise<ProductGroupEntity> {
    try {
      const consideredFixedCostsTotal = await this.getConsideredFixedCostsTotal();
      const pct = (updateProductGroupDto.porcentage ?? 0) / 100;
      const denom = updateProductGroupDto.volumevendasconsiderar ?? 0;
      const overheadPerUnit = denom && denom > 0
        ? Number(((consideredFixedCostsTotal * pct) / denom).toFixed(2))
        : undefined;

      const productGroup = await this.prisma.productGroup.update({
        where: { id },
        data: {
          ...updateProductGroupDto,
          ...(overheadPerUnit !== undefined ? { overheadPerUnit } : {}),
        },
        include: {
          products: {
            select: {
              totalCostWithAllFreights: true,
            },
          },
        },
      });

      const globalStats = await this.getGlobalStats();
      return this.mapToEntityWithStats(productGroup, globalStats);
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('Grupo de produtos não encontrado');
      }
      if (error?.code === 'P2002') {
        throw new ConflictException('Já existe um grupo com este nome');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.productGroup.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('Grupo de produtos não encontrado');
      }
      throw error;
    }
  }

  async findAllForExport(query: any) {
    const { search, sortBy = 'name', sortOrder = 'asc', limit } = query;

    const where: Prisma.ProductGroupWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const productGroups = await this.prisma.productGroup.findMany({
      where,
      include: {
        products: {
          select: {
            totalCostWithAllFreights: true,
          },
        },
      },
      take: limit,
    });

    const [globalStats, consideredFixedCostsTotal] = await Promise.all([
      this.getGlobalStats(),
      this.getConsideredFixedCostsTotal(),
    ]);
    let data = productGroups.map((group) => {
      const entity = this.mapToEntityWithStats(group, globalStats);
      const pct = (entity.porcentage ?? 0) / 100;
      const denom = entity.volumevendasconsiderar ?? 0;
      entity.overheadPerUnit = denom > 0 ? Number((consideredFixedCostsTotal * pct / denom).toFixed(2)) : 0;
      return entity;
    });

    return this.sortProductGroups(data, sortBy, sortOrder);
  }

  // ===== MÉTODOS AUXILIARES =====

  private async getGlobalStats() {
    const allProducts = await this.prisma.product.findMany({
      select: {
        totalCostWithAllFreights: true,
      },
    });

    const totalQuantity = allProducts.length;
    const totalValue = allProducts.reduce(
      (sum, p) => sum + (p.totalCostWithAllFreights?.toNumber() || 0),
      0,
    );

    return { totalQuantity, totalValue };
  }

  private async getConsideredFixedCostsTotal(): Promise<number> {
    const fixedCosts = await this.prisma.fixedCost.findMany({
      select: { totalCost: true, considerationPercentage: true },
    });
    const total = fixedCosts.reduce((sum, fc) => {
      const t = fc.totalCost?.toNumber?.() ?? Number(fc.totalCost) ?? 0;
      const pct = fc.considerationPercentage?.toNumber?.() ?? Number(fc.considerationPercentage) ?? 0;
      return sum + t * (pct / 100);
    }, 0);
    return Number(total.toFixed(2));
  }

  private mapToEntity(group: any): ProductGroupEntity {
    // 1. Calcular o valor total (mesmo que na criação geralmente seja 0, é bom garantir)
    const groupValue = group.products?.reduce(
      (sum: number, p: any) => sum + (p.totalCostWithAllFreights?.toNumber() || 0),
      0,
    ) || 0;

    const productsCount = group.products?.length || 0;
    const averagePrice = productsCount > 0 ? groupValue / productsCount : 0;

    // Overhead por unidade do grupo: total de custos fixos considerados * % do grupo / volume considerado
    const overheadPerUnit =
      group.volumevendasconsiderar && group.porcentage
        ? 0 // substituído na versão com stats globais
        : 0;

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      porcentage: group.porcentage ?? null,
      volumevendasconsiderar: group.volumevendasconsiderar ?? null,
      overheadPerUnit,
      productsCount: productsCount,
      
      // ADICIONE ESTA LINHA PARA CORRIGIR O ERRO:
      totalValue: Number(groupValue.toFixed(2)), 
      
      volumePercentageByQuantity: 0,
      volumePercentageByValue: 0,
      averagePrice: Number(averagePrice.toFixed(2)),
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  private mapToEntityWithStats(
    group: any,
    globalStats: { totalQuantity: number; totalValue: number },
  ): ProductGroupEntity {
    const productsCount = group.products?.length || 0;
    const groupValue = group.products.reduce(
      (sum, p) => sum + (p.totalCostWithAllFreights?.toNumber() || 0),
      0,
    );

    const volumePercentageByQuantity =
      globalStats.totalQuantity > 0
        ? (productsCount / globalStats.totalQuantity) * 100
        : 0;

    const volumePercentageByValue =
      globalStats.totalValue > 0
        ? (groupValue / globalStats.totalValue) * 100
        : 0;

    const averagePrice = productsCount > 0 ? groupValue / productsCount : 0;

    // Calcula overhead por unidade do grupo
    // Busca total considerado de custos fixos de forma síncrona via cache simples neste request
    // (neste método não há await; portanto, calcular em findAll/findOne antes e injetar seria melhor.
    // Para simplicidade, recalcularemos aqui com 0 caso não disponível.)

    const overheadPerUnit = 0; // será sobrescrito em findAll/findOne via mapToEntityWithStatsWrapper

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      porcentage: group.porcentage ?? null,
      volumevendasconsiderar: group.volumevendasconsiderar ?? null,
      productsCount,
      totalValue: Number(groupValue.toFixed(2)),
      volumePercentageByQuantity: Number(volumePercentageByQuantity.toFixed(2)),
      volumePercentageByValue: Number(volumePercentageByValue.toFixed(2)),
      averagePrice: Number(averagePrice.toFixed(2)),
      overheadPerUnit,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  private sortProductGroups(
    data: ProductGroupEntity[],
    sortBy: string,
    sortOrder: 'asc' | 'desc',
  ): ProductGroupEntity[] {
    return data.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortBy) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'volumePercentageByQuantity':
          valueA = a.volumePercentageByQuantity;
          valueB = b.volumePercentageByQuantity;
          break;
        case 'volumePercentageByValue':
          valueA = a.volumePercentageByValue;
          valueB = b.volumePercentageByValue;
          break;
        case 'averagePrice':
          valueA = a.averagePrice;
          valueB = b.averagePrice;
          break;
        case 'totalValue': // <--- ADICIONAR CASE
          valueA = a.totalValue;
          valueB = b.totalValue;
          break;
        case 'overheadPerUnit':
          valueA = a.overheadPerUnit ?? 0;
          valueB = b.overheadPerUnit ?? 0;
          break;
        default:
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
  }
}