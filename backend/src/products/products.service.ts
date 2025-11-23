// src/products/products.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CalculatePriceDto } from './dto/calculate-price.dto';
import { ExportProductsDto } from './dto/export-products.dto';

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

      // Validar matérias-primas
      const rawMaterialIds = createProductDto.rawMaterials.map(
        (rm) => rm.rawMaterialId,
      );
      const rawMaterials = await this.prisma.rawMaterial.findMany({
        where: { id: { in: rawMaterialIds } },
      });

      if (rawMaterials.length !== rawMaterialIds.length) {
        throw new BadRequestException(
          'Uma ou mais matérias-primas não encontradas',
        );
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
          priceWithTaxesAndFreight:
            calculations.calculations.priceWithTaxesAndFreight,
          productRawMaterials: {
            create: createProductDto.rawMaterials.map((rm) => ({
              rawMaterialId: rm.rawMaterialId,
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
          fixedCost: true,
          productGroup: true,
          productRawMaterials: {
            include: {
              rawMaterial: {
                include: {
                  freights: {
                    include: {
                      freightTaxes: true,
                    },
                  },
                  rawMaterialTaxes: true,
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

      return {
        ...product,
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
  }) {
    try {
      const page = query?.page || 1;
      const limit = query?.limit || 10;
      const skip = (page - 1) * limit;

      const rawSortBy = query?.sortBy || 'code';
      const sortOrder = query?.sortOrder || 'asc';

      let orderBy: any = {};

      if (rawSortBy === 'productGroup') {
        orderBy = { productGroup: { name: sortOrder } };
      } else if (rawSortBy === 'fixedCost') {
        orderBy = { fixedCost: { description: sortOrder } };
      } else if (rawSortBy === 'creator') {
        orderBy = { creator: { name: sortOrder } };
      } else {
        orderBy = { [rawSortBy]: sortOrder };
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
                overheadPerUnit: true,
              },
            },
            productGroup: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            productRawMaterials: {
              include: {
                rawMaterial: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                    measurementUnit: true,
                    acquisitionPrice: true,
                    priceConvertedBrl: true,
                    currency: true,
                  },
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

      return {
        data: products,
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
          fixedCost: true,
          productGroup: true,
          productRawMaterials: {
            include: {
              rawMaterial: {
                include: {
                  freights: {
                    include: {
                      freightTaxes: true,
                    },
                  },
                  rawMaterialTaxes: true,
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

      if (!product) {
        throw new NotFoundException('Produto não encontrado');
      }

      return product;
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

      if (updateProductDto.rawMaterials) {
        const rawMaterialIds = updateProductDto.rawMaterials.map(
          (rm) => rm.rawMaterialId,
        );
        const rawMaterials = await this.prisma.rawMaterial.findMany({
          where: { id: { in: rawMaterialIds } },
        });

        if (rawMaterials.length !== rawMaterialIds.length) {
          throw new BadRequestException(
            'Uma ou mais matérias-primas não encontradas',
          );
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
          priceWithTaxesAndFreight:
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
          fixedCost: true,
          productGroup: true,
          productRawMaterials: {
            include: {
              rawMaterial: {
                include: {
                  freights: {
                    include: {
                      freightTaxes: true,
                    },
                  },
                  rawMaterialTaxes: true,
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

      return updatedProduct;
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
   * Fórmula CORRIGIDA:
   * Preço Final = (Soma MP) + (Total Impostos) + (Total Serviço de Frete) + Custo Fixo
   */
  async calculateProductPrice(calculatePriceDto: CalculatePriceDto) {
    try {
      const { rawMaterials, fixedCostId, freightIds } = calculatePriceDto;

      // 1. Buscar dados das matérias-primas
      const rawMaterialsData = await this.prisma.rawMaterial.findMany({
        where: {
          id: { in: rawMaterials.map((rm) => rm.rawMaterialId) },
        },
        include: {
          rawMaterialTaxes: true,
          freights: {
            include: {
              freightTaxes: true,
            },
          },
        },
      });

      if (rawMaterialsData.length !== rawMaterials.length) {
        throw new BadRequestException(
          'Uma ou mais matérias-primas não encontradas',
        );
      }

      // 2. Buscar custo fixo
      let fixedCost: any = null;
      if (fixedCostId) {
        fixedCost = await this.prisma.fixedCost.findUnique({
          where: { id: fixedCostId },
        });

        if (!fixedCost) {
          throw new NotFoundException('Custo fixo não encontrado');
        }
      }

      // 3. Buscar fretes do produto
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

      // 4. Calcular valores das matérias-primas
      const rawMaterialsBreakdown: any[] = [];
      let totalRawMaterials = 0;
      let totalTaxes = 0;
      let totalRawMaterialFreightService = 0;

      for (const rmInput of rawMaterials) {
        const rmData = rawMaterialsData.find(
          (rm) => rm.id === rmInput.rawMaterialId,
        );
        if (!rmData) continue;

        const quantity = rmInput.quantity;
        const unitPrice = Number(
          rmData.priceConvertedBrl || rmData.acquisitionPrice,
        );
        const subtotal = unitPrice * quantity;

        // Impostos da matéria-prima (não recuperáveis)
        const taxes: Record<string, number> = {};
        let taxesTotal = 0;

        if (rmData.rawMaterialTaxes) {
          for (const taxItem of rmData.rawMaterialTaxes) {
            if (!taxItem.recoverable) {
              const taxValue = (subtotal * Number(taxItem.rate)) / 100;
              taxes[taxItem.name] = Number(taxValue.toFixed(2));
              taxesTotal += taxValue;
            }
          }
        }

        // Fretes da matéria-prima
        let freightServiceSubtotal = 0;
        let freightTaxesTotal = 0;
        const freightTaxes: Record<string, number> = {};

        if (rmData.freights && rmData.freights.length > 0) {
          for (const freight of rmData.freights) {
            const currentFreightCost =
              Number(freight.unitPrice || 0) * quantity;
            freightServiceSubtotal += currentFreightCost;

            if (freight.freightTaxes) {
              for (const fTax of freight.freightTaxes) {
                const taxValue = (currentFreightCost * Number(fTax.rate)) / 100;
                const key = fTax.name;
                freightTaxes[key] =
                  (freightTaxes[key] || 0) + Number(taxValue.toFixed(2));
                freightTaxesTotal += taxValue;
              }
            }
          }
        }

        const freightTotalIncludingTaxes =
          freightServiceSubtotal + freightTaxesTotal;

        totalRawMaterials += subtotal;
        totalTaxes += taxesTotal + freightTaxesTotal;
        totalRawMaterialFreightService += freightServiceSubtotal;

        rawMaterialsBreakdown.push({
          rawMaterialCode: rmData.code,
          rawMaterialName: rmData.name,
          quantity,
          unitPrice: Number(unitPrice.toFixed(2)),
          subtotal: Number(subtotal.toFixed(2)),
          taxes: {
            ...taxes,
            total: Number(taxesTotal.toFixed(2)),
          },
          freight: {
            unitPrice:
              quantity > 0
                ? Number((freightServiceSubtotal / quantity).toFixed(2))
                : 0,
            quantity,
            subtotal: Number(freightServiceSubtotal.toFixed(2)),
            taxes: {
              ...freightTaxes,
              total: Number(freightTaxesTotal.toFixed(2)),
            },
            total: Number(freightTotalIncludingTaxes.toFixed(2)),
          },
          totalWithoutTaxesAndFreight: Number(subtotal.toFixed(2)),
          totalWithTaxesAndFreight: Number(
            (subtotal + taxesTotal + freightTotalIncludingTaxes).toFixed(2),
          ),
        });
      }

      // 5. Calcular fretes do produto
      let productFreightServiceCost = 0;
      let productFreightTaxes = 0;

      for (const freight of productFreights) {
        const freightCost = Number(freight.unitPrice || 0);
        productFreightServiceCost += freightCost;

        if (freight.freightTaxes) {
          for (const fTax of freight.freightTaxes) {
            const taxValue = (freightCost * Number(fTax.rate)) / 100;
            productFreightTaxes += taxValue;
          }
        }
      }

      totalTaxes += productFreightTaxes;

      const totalFreightService =
        totalRawMaterialFreightService + productFreightServiceCost;

      // 6. Cálculos finais - ESTE É O VALOR QUE SERÁ SALVO
      const priceWithoutTaxesAndFreight = totalRawMaterials;

      // CRÍTICO: Este é o valor que vai para o banco
      const priceWithTaxesAndFreight =
        totalRawMaterials + totalTaxes + totalFreightService;

      const fixedCostOverhead = fixedCost
        ? Number(fixedCost.overheadPerUnit)
        : 0;

      const finalPriceWithOverhead =
        priceWithTaxesAndFreight + fixedCostOverhead;

      return {
        calculations: {
          rawMaterialsSubtotal: Number(totalRawMaterials.toFixed(2)),
          taxesTotal: Number(totalTaxes.toFixed(2)),
          freightTotal: Number(totalFreightService.toFixed(2)),
          productFreightCost: Number(productFreightServiceCost.toFixed(2)),
          productFreightTaxes: Number(productFreightTaxes.toFixed(2)),
          priceWithoutTaxesAndFreight: Number(
            priceWithoutTaxesAndFreight.toFixed(2),
          ),
          priceWithTaxesAndFreight: Number(priceWithTaxesAndFreight.toFixed(2)),
          fixedCostOverhead: Number(fixedCostOverhead.toFixed(2)),
          finalPriceWithOverhead: Number(finalPriceWithOverhead.toFixed(2)),
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

  async exportProducts(exportDto: ExportProductsDto) {
    try {
      const rawSortBy = exportDto.sortBy || 'code';
      const sortOrder = exportDto.sortOrder || 'asc';

      let orderBy: any = {};

      if (rawSortBy === 'productGroup') {
        orderBy = { productGroup: { name: sortOrder } };
      } else if (rawSortBy === 'fixedCost') {
        orderBy = { fixedCost: { description: sortOrder } };
      } else if (rawSortBy === 'creator') {
        orderBy = { creator: { name: sortOrder } };
      } else {
        orderBy = { [rawSortBy]: sortOrder };
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
              overheadPerUnit: true,
            },
          },
          productGroup: {
            select: {
              name: true,
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
            },
          },
        },
      });

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

      const rows = products.map((product) => {
        const rawMaterialsStr = product.productRawMaterials
          .map(
            (prm: any) =>
              `${prm.rawMaterial.name} (${prm.quantity} ${prm.rawMaterial.measurementUnit})`,
          )
          .join('; ');

        const priceBase = Number(product.priceWithoutTaxesAndFreight) || 0;
        const priceWithTaxes = Number(product.priceWithTaxesAndFreight) || 0;
        const overhead = Number(product.fixedCost?.overheadPerUnit) || 0;
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
