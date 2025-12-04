// src/products/products.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CalculatePriceDto } from './dto/calculate-price.dto';
import { ExportProductsDto } from './dto/export-products.dto';

const RAW_MATERIAL_WITH_LOCATIONS_INCLUDE = {
  locations: {
    include: {
      location: true,
      freights: {
        include: {
          freightTaxes: true,
        },
      },
      locationTaxes: {
        include: {
          tax: true,
        },
      },
    },
  },
} satisfies Prisma.RawMaterialInclude;

const RAW_MATERIAL_LOCATION_PIVOT_WITH_RELATIONS = {
  location: true,
  freights: {
    include: {
      freightTaxes: true,
    },
  },
  locationTaxes: {
    include: {
      tax: true,
    },
  },
  rawMaterial: {
    select: {
      id: true,
      code: true,
      name: true,
      measurementUnit: true,
    },
  },
} satisfies Prisma.RawMaterialLocationPivotInclude;

type RawMaterialSelectionInput = {
  rawMaterialId: string;
  rawMaterialLocationPivotId: string;
  quantity: number;
};

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, userId: string) {
    try {
      const existingProduct = await this.prisma.product.findUnique({
        where: { code: createProductDto.code },
      });

      if (existingProduct) {
        throw new ConflictException('Já existe um produto com este código');
      }

      // Validar custo fixo
      if (createProductDto.fixedCostId) {
        const fixedCost = await this.prisma.fixedCost.findUnique({
          where: { id: createProductDto.fixedCostId },
        });

        if (!fixedCost) {
          throw new NotFoundException('Custo fixo não encontrado');
        }
      }

      // Validar grupo de produto
      if (createProductDto.productGroupId) {
        const productGroup = await this.prisma.productGroup.findUnique({
          where: { id: createProductDto.productGroupId },
        });

        if (!productGroup) {
          throw new NotFoundException('Grupo de produto não encontrado');
        }
      }

      // Validar fretes
      if (
        createProductDto.freightIds &&
        createProductDto.freightIds.length > 0
      ) {
        const freights = await this.prisma.freight.findMany({
          where: { id: { in: createProductDto.freightIds } },
        });

        if (freights.length !== createProductDto.freightIds.length) {
          throw new BadRequestException('Um ou mais fretes não encontrados');
        }
      }

      // CRÍTICO: Calcular preços ANTES de criar
      const calculations = await this.calculateProductPrice({
        rawMaterials: createProductDto.rawMaterials,
        fixedCostId: createProductDto.fixedCostId,
        freightIds: createProductDto.freightIds,
      });

      // Criar produto com valores calculados
      const product = await this.prisma.product.create({
        data: {
          code: createProductDto.code,
          name: createProductDto.name,
          description: createProductDto.description,
          creatorId: userId,
          fixedCostId: createProductDto.fixedCostId,
          productGroupId: createProductDto.productGroupId,
          // VALORES CALCULADOS - NÃO RECALCULAR
          priceWithoutTaxesAndFreight:
            calculations.calculations.priceWithoutTaxesAndFreight,
          totalCostWithAllFreights:
            calculations.calculations.priceWithTaxesAndFreight,
          productRawMaterials: {
            create: createProductDto.rawMaterials.map((rm) => ({
              rawMaterialId: rm.rawMaterialId,
              rawMaterialLocationPivotId: rm.rawMaterialLocationPivotId,
              quantity: rm.quantity,
            })),
          },
          ...(createProductDto.freightIds &&
            createProductDto.freightIds.length > 0 && {
              freights: {
                connect: createProductDto.freightIds.map((id) => ({ id })),
              },
            }),
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          fixedCost: {
            select: {
              id: true,
              description: true,
              code: true,
              totalCost: true,
            },
          },
          productGroup: true,
          productRawMaterials: {
            include: {
              rawMaterial: {
                include: RAW_MATERIAL_WITH_LOCATIONS_INCLUDE,
              },
              locationPivot: {
                include: RAW_MATERIAL_LOCATION_PIVOT_WITH_RELATIONS,
              },
            },
          },
          freights: {
            include: {
              freightTaxes: true,
            },
          },
        },
      });

      const normalizedProduct = this.withLegacyPriceField(product);

      return {
        ...normalizedProduct,
        calculations: calculations.calculations,
        breakdown: calculations.breakdown,
      };
    } catch (error: any) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao criar produto: ${message}`);
    }
  }

  async findAll(query?: {
    page?: number;
    limit?: number;
    search?: string;
    productGroupId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    stateUf?: string;
    city?: string;
  }) {
    try {
      const page = query?.page || 1;
      const limit = query?.limit || 10;
      const skip = (page - 1) * limit;

      const rawSortBy = query?.sortBy || 'code';
      const sortOrder = query?.sortOrder || 'asc';
      const normalizedSortBy =
        rawSortBy === 'priceWithTaxesAndFreight'
          ? 'totalCostWithAllFreights'
          : rawSortBy;

      let orderBy: any = {};

      if (rawSortBy === 'productGroup') {
        orderBy = { productGroup: { name: sortOrder } };
      } else if (rawSortBy === 'fixedCost') {
        orderBy = { fixedCost: { description: sortOrder } };
      } else if (rawSortBy === 'creator') {
        orderBy = { creator: { name: sortOrder } };
      } else {
        orderBy = { [normalizedSortBy]: sortOrder };
      }

      const where: any = {};

      if (query?.search) {
        where.OR = [
          { code: { contains: query.search, mode: 'insensitive' as const } },
          { name: { contains: query.search, mode: 'insensitive' as const } },
        ];
      }

      if (query?.productGroupId) {
        where.productGroupId = query.productGroupId;
      }

      const locationFilter: Record<string, any> = {};
      if (query?.stateUf) {
        locationFilter.stateUf = query.stateUf.toUpperCase();
      }
      if (query?.city) {
        locationFilter.city = {
          equals: query.city,
          mode: 'insensitive' as const,
        };
      }

      if (Object.keys(locationFilter).length > 0) {
        where.productRawMaterials = {
          some: {
            locationPivot: {
              location: locationFilter,
            },
          },
        };
      }

      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            fixedCost: {
              select: {
                id: true,
                description: true,
                code: true,
                totalCost: true,
              },
            },
            productGroup: {
              select: {
                id: true,
                name: true,
                description: true,
                overheadPerUnit: true,
              },
            },
            productRawMaterials: {
              include: {
                rawMaterial: {
                  include: RAW_MATERIAL_WITH_LOCATIONS_INCLUDE,
                },
                locationPivot: {
                  include: RAW_MATERIAL_LOCATION_PIVOT_WITH_RELATIONS,
                },
              },
            },
            freights: {
              select: {
                id: true,
                name: true,
                unitPrice: true,
                currency: true,
              },
            },
          },
        }),
        this.prisma.product.count({ where }),
      ]);

      const normalizedProducts = products.map((product) =>
        this.withLegacyPriceField(product),
      );

      return {
        data: normalizedProducts,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao buscar produtos: ${message}`);
    }
  }

  async findOne(id: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          fixedCost: {
            select: {
              id: true,
              description: true,
              code: true,
              totalCost: true,
            },
          },
          productGroup: true,
          productRawMaterials: {
            include: {
              rawMaterial: {
                include: RAW_MATERIAL_WITH_LOCATIONS_INCLUDE,
              },
              locationPivot: {
                include: RAW_MATERIAL_LOCATION_PIVOT_WITH_RELATIONS,
              },
            },
          },
          freights: {
            include: {
              freightTaxes: true,
            },
          },
        },
      });

      if (!product) {
        throw new NotFoundException('Produto não encontrado');
      }

      return this.withLegacyPriceField(product);
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao buscar produto: ${message}`);
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          productRawMaterials: true,
          freights: true,
        },
      });

      if (!product) {
        throw new NotFoundException('Produto não encontrado');
      }

      if (updateProductDto.code && updateProductDto.code !== product.code) {
        const existingProduct = await this.prisma.product.findUnique({
          where: { code: updateProductDto.code },
        });

        if (existingProduct) {
          throw new ConflictException('Já existe um produto com este código');
        }
      }

      if (updateProductDto.fixedCostId !== undefined) {
        if (updateProductDto.fixedCostId) {
          const fixedCost = await this.prisma.fixedCost.findUnique({
            where: { id: updateProductDto.fixedCostId },
          });

          if (!fixedCost) {
            throw new NotFoundException('Custo fixo não encontrado');
          }
        }
      }

      if (updateProductDto.productGroupId !== undefined) {
        if (updateProductDto.productGroupId) {
          const productGroup = await this.prisma.productGroup.findUnique({
            where: { id: updateProductDto.productGroupId },
          });

          if (!productGroup) {
            throw new NotFoundException('Grupo de produto não encontrado');
          }
        }
      }

      if (updateProductDto.freightIds) {
        const freights = await this.prisma.freight.findMany({
          where: { id: { in: updateProductDto.freightIds } },
        });

        if (freights.length !== updateProductDto.freightIds.length) {
          throw new BadRequestException('Um ou mais fretes não encontrados');
        }
      }

      let newPrices = {};
      // Recalcular preços se houver mudança relevante
      if (
        updateProductDto.rawMaterials ||
        updateProductDto.fixedCostId !== undefined ||
        updateProductDto.freightIds
      ) {
        const currentRawMaterials =
          updateProductDto.rawMaterials ||
          product.productRawMaterials.map((prm) => ({
            rawMaterialId: prm.rawMaterialId,
            rawMaterialLocationPivotId: prm.rawMaterialLocationPivotId,
            quantity: Number(prm.quantity),
          }));

        const newFixedCostId =
          updateProductDto.fixedCostId !== undefined
            ? updateProductDto.fixedCostId
            : product.fixedCostId;

        const newFreightIds =
          updateProductDto.freightIds || product.freights.map((f) => f.id);

        const calculations = await this.calculateProductPrice({
          rawMaterials: currentRawMaterials,
          fixedCostId: newFixedCostId ? newFixedCostId : undefined,
          freightIds: newFreightIds.length > 0 ? newFreightIds : undefined,
        });

        newPrices = {
          priceWithoutTaxesAndFreight:
            calculations.calculations.priceWithoutTaxesAndFreight,
          totalCostWithAllFreights:
            calculations.calculations.priceWithTaxesAndFreight,
        };
      }

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          name: updateProductDto.name,
          description: updateProductDto.description,
          code: updateProductDto.code,
          fixedCostId: updateProductDto.fixedCostId,
          productGroupId: updateProductDto.productGroupId,
          ...newPrices,
          ...(updateProductDto.rawMaterials && {
            productRawMaterials: {
              deleteMany: {},
              create: updateProductDto.rawMaterials.map((rm) => ({
                rawMaterialId: rm.rawMaterialId,
                rawMaterialLocationPivotId: rm.rawMaterialLocationPivotId,
                quantity: rm.quantity,
              })),
            },
          }),
          ...(updateProductDto.freightIds !== undefined && {
            freights: {
              set: [],
              connect: updateProductDto.freightIds.map((id) => ({ id })),
            },
          }),
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          fixedCost: {
            select: {
              id: true,
              description: true,
              code: true,
              totalCost: true,
            },
          },
          productGroup: true,
          productRawMaterials: {
            include: {
              rawMaterial: {
                include: RAW_MATERIAL_WITH_LOCATIONS_INCLUDE,
              },
              locationPivot: {
                include: RAW_MATERIAL_LOCATION_PIVOT_WITH_RELATIONS,
              },
            },
          },
          freights: {
            include: {
              freightTaxes: true,
            },
          },
        },
      });

      return this.withLegacyPriceField(updatedProduct);
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao atualizar produto: ${message}`);
    }
  }

  async remove(id: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new NotFoundException('Produto não encontrado');
      }

      await this.prisma.product.delete({
        where: { id },
      });

      return {
        message: `Produto "${product.name}" deletado com sucesso`,
        id,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao remover produto: ${message}`);
    }
  }

  /**
   * CÁLCULO CONSOLIDADO DE PREÇOS
   * Preço Final da Estrutura = Σ(Produtos por localização) + Fretes da estrutura + Custo fixo
   * Onde o custo final de cada produto é: base + adicional + frete da MP + impostos não recuperáveis (MP)
   */
  async calculateProductPrice(calculatePriceDto: CalculatePriceDto) {
    try {
      const { rawMaterials, fixedCostId, freightIds } = calculatePriceDto;

      const pivotMap = await this.getRawMaterialPivotMap(rawMaterials);

      const rawMaterialsBreakdown: any[] = [];
      let baseSubtotal = 0;
      let nonRecoverableTaxesTotal = 0;
      let recoverableCreditsTotal = 0;
      let mpFreightServiceTotal = 0;
      let mpFreightTaxesTotal = 0;

      for (const rmInput of rawMaterials) {
        const pivot = pivotMap.get(rmInput.rawMaterialLocationPivotId);
        if (!pivot) {
          throw new BadRequestException('Localização da matéria-prima inválida');
        }

        const quantity = Number(rmInput.quantity);
        const baseUnit = Number(
          pivot.priceConvertedBrl ?? pivot.acquisitionPrice ?? 0,
        );
        const additionalUnit = Number(pivot.additionalCost ?? 0);
        const unitCost = baseUnit + additionalUnit;
        const subtotal = unitCost * quantity;
        baseSubtotal += subtotal;

        const taxes: Record<string, number> = {};
        const recoverableDetails: Record<string, number> = {};
        let itemNonRecoverable = 0;
        let itemRecoverable = 0;

        for (const taxItem of pivot.locationTaxes ?? []) {
          const rate =
            taxItem.rate !== null && taxItem.rate !== undefined
              ? Number(taxItem.rate)
              : Number(taxItem.tax?.defaultRate ?? 0);
          const taxValue = (subtotal * rate) / 100;
          const taxName = taxItem.tax?.name || 'Imposto';
          if (taxItem.recoverable) {
            recoverableDetails[taxName] = Number(taxValue.toFixed(2));
            itemRecoverable += taxValue;
          } else {
            taxes[taxName] = Number(taxValue.toFixed(2));
            itemNonRecoverable += taxValue;
          }
        }

        nonRecoverableTaxesTotal += itemNonRecoverable;
        recoverableCreditsTotal += itemRecoverable;

        let itemFreightService = 0;
        let itemFreightTaxes = 0;
        const freightTaxesDetail: Record<string, number> = {};

        for (const freight of pivot.freights ?? []) {
          const serviceCost = Number(freight.unitPrice || 0) * quantity;
          itemFreightService += serviceCost;

          for (const freightTax of freight.freightTaxes ?? []) {
            const taxValue = (serviceCost * Number(freightTax.rate || 0)) / 100;
            freightTaxesDetail[freightTax.name] = Number(
              (freightTaxesDetail[freightTax.name] || 0) + taxValue,
            );
            itemFreightTaxes += taxValue;
          }
        }

        mpFreightServiceTotal += itemFreightService;
        mpFreightTaxesTotal += itemFreightTaxes;

        const formattedFreightTaxesDetail = Object.fromEntries(
          Object.entries(freightTaxesDetail).map(([key, value]) => [
            key,
            Number((value as number).toFixed(2)),
          ]),
        );

        const itemFinalCost =
          subtotal + itemNonRecoverable + itemFreightService + itemFreightTaxes;

        rawMaterialsBreakdown.push({
          rawMaterialCode: pivot.rawMaterial.code,
          rawMaterialName: pivot.rawMaterial.name,
          rawMaterialMeasurementUnit: pivot.rawMaterial.measurementUnit,
          quantity,
          location: pivot.location,
          unitBase: Number(baseUnit.toFixed(2)),
          unitAdditionalCost: Number(additionalUnit.toFixed(2)),
          subtotal: Number(subtotal.toFixed(2)),
          taxes: {
            ...taxes,
            totalNonRecoverable: Number(itemNonRecoverable.toFixed(2)),
            recoverableCredits: {
              ...recoverableDetails,
              total: Number(itemRecoverable.toFixed(2)),
            },
          },
          freight: {
            unitPrice:
              quantity > 0
                ? Number((itemFreightService / quantity).toFixed(2))
                : 0,
            quantity,
            subtotal: Number(itemFreightService.toFixed(2)),
            taxes: {
              ...formattedFreightTaxesDetail,
              total: Number(itemFreightTaxes.toFixed(2)),
            },
            total: Number(
              (itemFreightService + itemFreightTaxes).toFixed(2),
            ),
          },
          totalCostForItem: Number(itemFinalCost.toFixed(2)),
        });
      }

      let fixedCostValue = 0;
      if (fixedCostId) {
        const fixedCost = await this.prisma.fixedCost.findUnique({
          where: { id: fixedCostId },
          select: { totalCost: true },
        });

        if (!fixedCost) {
          throw new NotFoundException('Custo fixo não encontrado');
        }

        fixedCostValue = Number(fixedCost.totalCost || 0);
      }

      let productFreights: any[] = [];
      if (freightIds && freightIds.length > 0) {
        productFreights = await this.prisma.freight.findMany({
          where: { id: { in: freightIds } },
          include: {
            freightTaxes: true,
          },
        });

        if (productFreights.length !== freightIds.length) {
          throw new BadRequestException('Um ou mais fretes não encontrados');
        }
      }

      let productFreightServiceCost = 0;
      let productFreightTaxes = 0;
      for (const freight of productFreights) {
        const freightCost = Number(freight.unitPrice || 0);
        productFreightServiceCost += freightCost;

        for (const fTax of freight.freightTaxes ?? []) {
          const taxValue = (freightCost * Number(fTax.rate)) / 100;
          productFreightTaxes += taxValue;
        }
      }

      const productsFinalCost =
        baseSubtotal +
        nonRecoverableTaxesTotal +
        mpFreightServiceTotal +
        mpFreightTaxesTotal;

      const structureFreightTotal =
        productFreightServiceCost + productFreightTaxes;

      const priceWithoutTaxesAndFreight = baseSubtotal;
      const priceWithTaxesAndFreight =
        productsFinalCost + structureFreightTotal + fixedCostValue;

      return {
        calculations: {
          rawMaterialsSubtotal: Number(baseSubtotal.toFixed(2)),
          nonRecoverableTaxesTotal: Number(
            nonRecoverableTaxesTotal.toFixed(2),
          ),
          recoverableCreditsTotal: Number(
            recoverableCreditsTotal.toFixed(2),
          ),
          rawMaterialFreightServiceTotal: Number(
            mpFreightServiceTotal.toFixed(2),
          ),
          rawMaterialFreightTaxesTotal: Number(
            mpFreightTaxesTotal.toFixed(2),
          ),
          productFreightCost: Number(productFreightServiceCost.toFixed(2)),
          productFreightTaxes: Number(productFreightTaxes.toFixed(2)),
          productsFinalCost: Number(productsFinalCost.toFixed(2)),
          structureFreightTotal: Number(structureFreightTotal.toFixed(2)),
          fixedCostTotal: Number(fixedCostValue.toFixed(2)),
          priceWithoutTaxesAndFreight: Number(
            priceWithoutTaxesAndFreight.toFixed(2),
          ),
          priceWithTaxesAndFreight: Number(priceWithTaxesAndFreight.toFixed(2)),
          finalPriceWithOverhead: Number(priceWithTaxesAndFreight.toFixed(2)),
        },
        breakdown: rawMaterialsBreakdown,
      };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao calcular preço: ${message}`);
    }
  }

  private async getRawMaterialPivotMap(
    rawMaterials: RawMaterialSelectionInput[],
  ) {
    if (!rawMaterials || rawMaterials.length === 0) {
      throw new BadRequestException('Informe ao menos uma matéria-prima.');
    }

    const duplicateCheck = new Set<string>();
    for (const item of rawMaterials) {
      if (!item.rawMaterialLocationPivotId) {
        throw new BadRequestException(
          'Selecione uma localização para cada matéria-prima.',
        );
      }
      if (duplicateCheck.has(item.rawMaterialLocationPivotId)) {
        throw new BadRequestException(
          'Não é permitido repetir o mesmo produto na mesma localização dentro da estrutura.',
        );
      }
      duplicateCheck.add(item.rawMaterialLocationPivotId);
    }

    const pivotIds = Array.from(duplicateCheck);
    const pivots = await this.prisma.rawMaterialLocationPivot.findMany({
      where: { id: { in: pivotIds } },
      include: RAW_MATERIAL_LOCATION_PIVOT_WITH_RELATIONS,
    });

    if (pivots.length !== pivotIds.length) {
      throw new BadRequestException(
        'Uma ou mais localizações selecionadas não foram encontradas.',
      );
    }

    const pivotMap = new Map<string, (typeof pivots)[number]>();
    pivots.forEach((pivot) => pivotMap.set(pivot.id, pivot));

    for (const item of rawMaterials) {
      const pivot = pivotMap.get(item.rawMaterialLocationPivotId);
      if (!pivot) {
        throw new BadRequestException(
          'Localização de matéria-prima inválida informada.',
        );
      }
      if (pivot.rawMaterialId !== item.rawMaterialId) {
        throw new BadRequestException(
          'A localização selecionada não pertence à matéria-prima informada.',
        );
      }
    }

    return pivotMap;
  }

  private withLegacyPriceField<T extends { totalCostWithAllFreights?: any }>(
    product: T,
  ) {
    return {
      ...product,
      priceWithTaxesAndFreight: product.totalCostWithAllFreights,
    };
  }

  async exportProducts(exportDto: ExportProductsDto) {
    try {
      const rawSortBy = exportDto.sortBy || 'code';
      const sortOrder = exportDto.sortOrder || 'asc';
      const normalizedSortBy =
        rawSortBy === 'priceWithTaxesAndFreight'
          ? 'totalCostWithAllFreights'
          : rawSortBy;

      let orderBy: any = {};

      if (rawSortBy === 'productGroup') {
        orderBy = { productGroup: { name: sortOrder } };
      } else if (rawSortBy === 'fixedCost') {
        orderBy = { fixedCost: { description: sortOrder } };
      } else if (rawSortBy === 'creator') {
        orderBy = { creator: { name: sortOrder } };
      } else {
        orderBy = { [normalizedSortBy]: sortOrder };
      }

      const where: any = {};

      if (exportDto.filters?.search) {
        where.OR = [
          {
            code: {
              contains: exportDto.filters.search,
              mode: 'insensitive',
            },
          },
          {
            name: {
              contains: exportDto.filters.search,
              mode: 'insensitive',
            },
          },
        ];
      }

      if (exportDto.filters?.productGroupId) {
        where.productGroupId = exportDto.filters.productGroupId;
      }

      const exportLocationFilter: Record<string, any> = {};
      if (exportDto.filters?.stateUf) {
        exportLocationFilter.stateUf = exportDto.filters.stateUf.toUpperCase();
      }
      if (exportDto.filters?.city) {
        exportLocationFilter.city = {
          equals: exportDto.filters.city,
          mode: 'insensitive' as const,
        };
      }

      if (Object.keys(exportLocationFilter).length > 0) {
        where.productRawMaterials = {
          some: {
            locationPivot: {
              location: exportLocationFilter,
            },
          },
        };
      }

      const products = await this.prisma.product.findMany({
        take: exportDto.limit,
        orderBy,
        where,
        include: {
          creator: {
            select: {
              name: true,
            },
          },
          fixedCost: {
            select: {
              description: true,
              code: true,
              totalCost: true,
            },
          },
          productGroup: {
            select: {
              name: true,
              overheadPerUnit: true,
            },
          },
          productRawMaterials: {
            include: {
              rawMaterial: {
                select: {
                  name: true,
                  measurementUnit: true,
                },
              },
              locationPivot: {
                select: {
                  id: true,
                  location: true,
                },
              },
            },
          },
          freights: {
            include: {
              freightTaxes: true,
            },
          },
        },
      });

      const normalizedProducts = products.map((product) =>
        this.withLegacyPriceField(product),
      );

      const headers = [
        'Código',
        'Nome',
        'Descrição',
        'Grupo',
        'Preço Base',
        'Preço sem Fixo',
        'Custo Fixo',
        'Preço Final',
        'Criador',
        'Matérias-Primas',
        'Data Criação',
      ];

      const rows = normalizedProducts.map((product) => {
        const rawMaterialsStr = product.productRawMaterials
          .map(
            (prm: any) =>
              `${prm.rawMaterial.name} (${prm.quantity} ${prm.rawMaterial.measurementUnit}) - ${prm.locationPivot?.location?.city || '-'} / ${prm.locationPivot?.location?.stateUf || '-'}`,
          )
          .join('; ');

        const priceBase = Number(product.priceWithoutTaxesAndFreight) || 0;
        const priceWithTaxes = Number(product.priceWithTaxesAndFreight) || 0;
        const overhead = Number(product.productGroup?.overheadPerUnit) || 0;
        const finalPrice = priceWithTaxes + overhead;

        return [
          product.code,
          product.name,
          product.description || '',
          product.productGroup?.name || '',
          priceBase.toFixed(2),
          priceWithTaxes.toFixed(2),
          overhead.toFixed(2),
          finalPrice.toFixed(2),
          product.creator?.name || '',
          rawMaterialsStr,
          new Date(product.createdAt).toISOString().split('T')[0],
        ];
      });

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

      return csv;
    } catch (error: any) {
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao exportar produtos: ${message}`);
    }
  }
}
