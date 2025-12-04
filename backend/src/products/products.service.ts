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
import { CreateProductFullDto } from './dto/create-product-full.dto';

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
          totalCostWithAllFreights:
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
                include: RAW_MATERIAL_WITH_LOCATIONS_INCLUDE,
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

  async createFull(dto: CreateProductFullDto, userId: string) {
    // 1) Dentro da transação: criar/atualizar MPs, pivots e criar Produto com preços nulos
    const productId = await this.prisma.$transaction(async (tx) => {
      // Verificar produto duplicado por code
      const existingProduct = await tx.product.findUnique({ where: { code: dto.code } });
      if (existingProduct) {
        throw new ConflictException('Já existe um produto com este código');
      }

      // Validar FixedCost e ProductGroup se fornecidos
      if (dto.fixedCostId) {
        const fixed = await tx.fixedCost.findUnique({ where: { id: dto.fixedCostId } });
        if (!fixed) throw new NotFoundException('Custo fixo não encontrado');
      }
      if (dto.productGroupId) {
        const group = await tx.productGroup.findUnique({ where: { id: dto.productGroupId } });
        if (!group) throw new NotFoundException('Grupo de produto não encontrado');
      }

      // Validar fretes do produto
      if (dto.freightIds?.length) {
        const found = await tx.freight.findMany({ where: { id: { in: dto.freightIds } } });
        if (found.length !== dto.freightIds.length) {
          throw new BadRequestException('Um ou mais fretes (produto) não encontrados');
        }
      }

      // Criação/atualização de MPs por code
      const rawMaterialIdByCode = new Map<string, string>();

      for (const rm of dto.rawMaterials) {
        const rawMaterial = await tx.rawMaterial.upsert({
          where: { code: rm.code },
          create: {
            code: rm.code,
            name: rm.name,
            description: rm.description,
            measurementUnit: rm.measurementUnit as any,
            inputGroup: rm.inputGroup,
            paymentTerm: rm.paymentTerm,
          },
          update: {
            name: rm.name,
            description: rm.description,
            measurementUnit: rm.measurementUnit as any,
            inputGroup: rm.inputGroup,
            paymentTerm: rm.paymentTerm,
          },
        });

        rawMaterialIdByCode.set(rm.code, rawMaterial.id);

        // Processar locations/pivot
        for (const loc of rm.locations) {
          // Resolver location: id existente ou criação com dados embutidos
          let locationId: string | undefined = loc.locationId;
          if (!locationId && loc.location) {
            const country = loc.location.country ?? 'BR';
            // Tentar encontrar uma existente pelos campos básicos
            const existingLoc = await tx.location.findFirst({
              where: {
                name: loc.location.name,
                stateUf: loc.location.stateUf,
                city: loc.location.city,
                country,
              },
            });
            if (existingLoc) {
              locationId = existingLoc.id;
            } else {
              const createdLoc = await tx.location.create({
                data: {
                  name: loc.location.name,
                  stateUf: loc.location.stateUf,
                  city: loc.location.city,
                  country,
                },
              });
              locationId = createdLoc.id;
            }
          }

          if (!locationId) {
            throw new BadRequestException('Informe locationId ou location (embutido) para cada item de locations');
          }

          const locExists = await tx.location.findUnique({ where: { id: locationId } });
          if (!locExists) throw new NotFoundException(`Localidade não encontrada: ${locationId}`);

          const pivot = await tx.rawMaterialLocationPivot.upsert({
            where: {
              rawMaterialId_locationId: {
                rawMaterialId: rawMaterial.id,
                locationId: locationId,
              },
            },
            create: {
              rawMaterialId: rawMaterial.id,
              locationId: locationId,
              acquisitionPrice: new Prisma.Decimal(loc.acquisitionPrice),
              currency: loc.currency as any,
              priceConvertedBrl: loc.priceConvertedBrl != null ? new Prisma.Decimal(loc.priceConvertedBrl) : undefined,
              additionalCost: new Prisma.Decimal(loc.additionalCost ?? 0),
            },
            update: {
              acquisitionPrice: new Prisma.Decimal(loc.acquisitionPrice),
              currency: loc.currency as any,
              priceConvertedBrl: loc.priceConvertedBrl != null ? new Prisma.Decimal(loc.priceConvertedBrl) : undefined,
              additionalCost: new Prisma.Decimal(loc.additionalCost ?? 0),
            },
          });

          // Conectar fretes à pivot
          if (loc.freightIds?.length) {
            const freights = await tx.freight.findMany({ where: { id: { in: loc.freightIds } } });
            if (freights.length !== loc.freightIds.length) {
              throw new BadRequestException('Um ou mais fretes (pivot) não encontrados');
            }
            await tx.rawMaterialLocationPivot.update({
              where: { id: pivot.id },
              data: {
                freights: {
                  set: [],
                  connect: loc.freightIds.map((id) => ({ id })),
                },
              },
            });
          }

          // Sincronizar impostos da pivot
          if (loc.taxes?.length) {
            for (const t of loc.taxes) {
              let taxId = t.taxId;
              if (!taxId && t.name) {
                const tax = await tx.rawMaterialTax.upsert({
                  where: { name: t.name },
                  create: {
                    name: t.name,
                    defaultRate: new Prisma.Decimal(t.rate),
                    recoverable: t.recoverable,
                  },
                  update: {},
                });
                taxId = tax.id;
              }

              if (!taxId) {
                throw new BadRequestException('Imposto inválido: forneça taxId ou name');
              }

              // upsert na pivot de impostos
              await tx.rawMaterialLocationTax.upsert({
                where: {
                  rawMaterialLocationPivotId_taxId: {
                    rawMaterialLocationPivotId: pivot.id,
                    taxId: taxId,
                  },
                },
                create: {
                  rawMaterialLocationPivotId: pivot.id,
                  taxId: taxId,
                  rate: new Prisma.Decimal(t.rate),
                  recoverable: t.recoverable,
                },
                update: {
                  rate: new Prisma.Decimal(t.rate),
                  recoverable: t.recoverable,
                },
              });
            }
          }
        }
      }

      // Montar composição por código
      const composition = dto.composition.map((c) => {
        const id = rawMaterialIdByCode.get(c.rawMaterialCode);
        if (!id) {
          throw new BadRequestException(`Matéria-prima não encontrada pelo código: ${c.rawMaterialCode}`);
        }
        return { rawMaterialId: id, quantity: c.quantity };
      });

      // Validar fretes do produto (já feitos antes) e calcular preços
      const product = await tx.product.create({
        data: {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          creatorId: userId,
          fixedCostId: dto.fixedCostId,
          productGroupId: dto.productGroupId,
          // valores calculados preenchidos posteriormente fora da transação
          priceWithoutTaxesAndFreight: null,
          totalCostWithAllFreights: null,
          productRawMaterials: {
            create: composition.map((rm) => ({ rawMaterialId: rm.rawMaterialId, quantity: rm.quantity })),
          },
          ...(dto.freightIds?.length ? { freights: { connect: dto.freightIds.map((id) => ({ id })) } } : {}),
        },
        select: { id: true },
      });
      return product.id;
    });

    // 2) Fora da transação: resolver IDs das MPs por código
    const compResolved: { rawMaterialId: string; quantity: number }[] = [];
    for (const c of dto.composition) {
      const rm = await this.prisma.rawMaterial.findUnique({ where: { code: c.rawMaterialCode } });
      if (!rm) throw new BadRequestException(`Matéria-prima não encontrada pelo código: ${c.rawMaterialCode}`);
      compResolved.push({ rawMaterialId: rm.id, quantity: c.quantity });
    }

    // Calcular preços e atualizar o produto
    const calculations = await this.calculateProductPrice({
      rawMaterials: compResolved,
      fixedCostId: dto.fixedCostId,
      freightIds: dto.freightIds,
    });

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        priceWithoutTaxesAndFreight: calculations.calculations.priceWithoutTaxesAndFreight,
        totalCostWithAllFreights: calculations.calculations.priceWithTaxesAndFreight,
      },
    });

    // 3) Retornar produto completo
    const productFull = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        fixedCost: true,
        productGroup: true,
        productRawMaterials: {
          include: {
            rawMaterial: { include: RAW_MATERIAL_WITH_LOCATIONS_INCLUDE },
          },
        },
        freights: { include: { freightTaxes: true } },
      },
    });

    const normalized = this.withLegacyPriceField(productFull!);
    return {
      ...normalized,
      calculations: calculations.calculations,
      breakdown: calculations.breakdown,
    };
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
          fixedCost: true,
          productGroup: true,
          productRawMaterials: {
            include: {
              rawMaterial: {
                include: RAW_MATERIAL_WITH_LOCATIONS_INCLUDE,
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
                include: RAW_MATERIAL_WITH_LOCATIONS_INCLUDE,
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
        include: RAW_MATERIAL_WITH_LOCATIONS_INCLUDE,
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
      // Manter os impostos separados para evitar dupla contagem no preview
      let totalNonRecoverableMpTaxes = 0; // impostos não recuperáveis de MP
      let totalFreightTaxes = 0; // impostos dos fretes (MP + produto)
      let totalRecoverableCredits = 0; // créditos recuperáveis a subtrair
      let totalRawMaterialFreightService = 0; // serviço de frete de MP (sem impostos)

      for (const rmInput of rawMaterials) {
        const rmData = rawMaterialsData.find(
          (rm) => rm.id === rmInput.rawMaterialId,
        );
        if (!rmData) continue;

        const quantity = rmInput.quantity;
        const firstLoc = rmData.locations?.[0];

        if (!firstLoc) {
          throw new BadRequestException(
            `A matéria-prima "${rmData.name}" não possui localizações configuradas.`,
          );
        }

        const unitPrice = Number(
          firstLoc.priceConvertedBrl ?? firstLoc.acquisitionPrice ?? 0,
        );
        const subtotal = unitPrice * quantity;

        // Impostos da matéria-prima
        const taxes: Record<string, number> = {};
        const recoverableCredits: Record<string, number> = {};
        let taxesTotal = 0; // somente não recuperáveis (MP)
        let creditsTotal = 0; // créditos recuperáveis (MP)

        for (const taxItem of firstLoc.locationTaxes ?? []) {
          const taxName = taxItem.tax?.name || 'Imposto';
          const appliedRate =
            taxItem.rate !== null && taxItem.rate !== undefined
              ? Number(taxItem.rate)
              : Number(taxItem.tax?.defaultRate ?? 0);
          const taxValue = (subtotal * appliedRate) / 100;
          if (taxItem.recoverable) {
            recoverableCredits[taxName] = Number(taxValue.toFixed(2));
            creditsTotal += taxValue;
          } else {
            taxes[taxName] = Number(taxValue.toFixed(2));
            taxesTotal += taxValue;
          }
        }

        // Fretes da matéria-prima
        let freightServiceSubtotal = 0; // serviço de frete (MP)
        let freightTaxesTotal = 0; // impostos de frete (MP)
        const freightTaxes: Record<string, number> = {};

        for (const freight of firstLoc.freights ?? []) {
          const currentFreightCost = Number(freight.unitPrice || 0) * quantity;
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

        const freightTotalIncludingTaxes =
          freightServiceSubtotal + freightTaxesTotal;

        totalRawMaterials += subtotal;
        totalNonRecoverableMpTaxes += taxesTotal;
        totalFreightTaxes += freightTaxesTotal;
        totalRecoverableCredits += creditsTotal;
        totalRawMaterialFreightService += freightServiceSubtotal;

        rawMaterialsBreakdown.push({
          rawMaterialCode: rmData.code,
          rawMaterialName: rmData.name,
          quantity,
          unitPrice: Number(unitPrice.toFixed(2)),
          subtotal: Number(subtotal.toFixed(2)),
          taxes: {
            ...taxes,
            totalNonRecoverable: Number(taxesTotal.toFixed(2)),
            recoverableCredits: {
              ...recoverableCredits,
              total: Number(creditsTotal.toFixed(2)),
            },
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
      let productFreightServiceCost = 0; // serviço de frete do produto (sem impostos)
      let productFreightTaxes = 0; // impostos dos fretes do produto

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

      // Acumular impostos de frete do produto separadamente
      totalFreightTaxes += productFreightTaxes;

      const totalFreightService =
        totalRawMaterialFreightService + productFreightServiceCost;

      // 6. Cálculos finais - ESTE É O VALOR QUE SERÁ SALVO
      const priceWithoutTaxesAndFreight = totalRawMaterials;

      // CRÍTICO: Este é o valor que vai para o banco
      // NOVA REGRA: NÃO somar impostos não recuperáveis de MP ao preço salvo.
      // Fórmula: Base + Frete (serviço + impostos) - Créditos Recuperáveis
      const priceWithTaxesAndFreight =
        totalRawMaterials +
        totalFreightService +
        totalFreightTaxes -
        totalRecoverableCredits;

      // Overhead per unit is now stored on ProductGroup and applied at view/export,
      // not in price calculation. Keep 0 here to avoid double counting.
      const fixedCostOverhead = 0;

      const finalPriceWithOverhead = priceWithTaxesAndFreight + fixedCostOverhead;

      return {
        calculations: {
          rawMaterialsSubtotal: Number(totalRawMaterials.toFixed(2)),
          // Mostrar somente impostos não recuperáveis de MP para evitar dupla contagem
          taxesTotal: Number(totalNonRecoverableMpTaxes.toFixed(2)),
          recoverableCreditsTotal: Number(totalRecoverableCredits.toFixed(2)),
          // Total de fretes incluindo impostos para alinhar com o preview
          freightTotal: Number((totalFreightService + totalFreightTaxes).toFixed(2)),
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
              `${prm.rawMaterial.name} (${prm.quantity} ${prm.rawMaterial.measurementUnit})`,
          )
          .join('; ');

        const priceBase = Number(product.priceWithoutTaxesAndFreight) || 0;
        // Suporte a preço por cidade/UF no export
        const uf = (exportDto as any)?.filters?.uf as string | undefined;
        const city = (exportDto as any)?.filters?.city as string | undefined;

        // Calcular frete do produto para a localização, somando serviço e impostos
        let productFreightServiceForLocation = 0;
        let productFreightTaxesForLocation = 0;
        if (product.freights && product.freights.length > 0 && uf && city) {
          for (const f of product.freights as any[]) {
            if (
              f.destinationUf?.toUpperCase() === uf.toUpperCase() &&
              f.destinationCity?.toLowerCase() === city.toLowerCase()
            ) {
              const service = Number(f.unitPrice || 0);
              productFreightServiceForLocation += service;
              if (f.freightTaxes) {
                for (const ft of f.freightTaxes) {
                  const taxValue = (service * Number(ft.rate)) / 100;
                  productFreightTaxesForLocation += taxValue;
                }
              }
            }
          }
        }

        // Preço s/ overhead considerando localização: se uf/city fornecidos, ajustar;
        // caso contrário, usar campo salvo.
        let priceWithTaxes = Number(product.priceWithTaxesAndFreight) || 0;
        if (uf && city) {
          // Remontar preço com frete de produto específico da localização por cima do salvo:
          // O campo salvo já inclui fretes (MP + produto) genericamente. Para precisão,
          // poderíamos recomputar tudo, mas aqui somamos apenas o frete da localização
          // quando aplicável (fallback simples).
          priceWithTaxes =
            (Number(product.priceWithoutTaxesAndFreight) || 0) +
            productFreightServiceForLocation +
            productFreightTaxesForLocation;
        }
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
