// src/freights/freights.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFreightDto } from './dto/create-freight.dto';
import { UpdateFreightDto } from './dto/update-freight.dto';
import { QueryFreightDto } from './dto/query-freight.dto';
import { ExportFreightDto } from './dto/export-freight.dto';
import { Currency, FreightOperationType } from '@prisma/client';

@Injectable()
export class FreightsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo frete com impostos opcionais
   */
  async create(createFreightDto: CreateFreightDto) {
    try {
      // 1. Verifica se já existe um frete com este nome
      const existingName = await this.prisma.freight.findFirst({
        where: { name: createFreightDto.name },
      });

      if (existingName) {
        throw new ConflictException('Já existe um frete com este nome');
      }

      // 2. Validar impostos (verificar duplicados na lista enviada)
      if (
        createFreightDto.freightTaxes &&
        createFreightDto.freightTaxes.length > 0
      ) {
        this.validateTaxList(createFreightDto.freightTaxes);
      }

      // 3. Processar impostos: SEMPRE usar connect para impostos com ID
      const taxesToConnect: string[] = [];
      const taxesToCreate: any[] = [];

      for (const tax of createFreightDto.freightTaxes || []) {
        if (tax.id) {
          // Imposto existente - apenas conectar
          const exists = await this.prisma.freightTax.findUnique({
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
          const existing = await this.prisma.freightTax.findUnique({
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
          });
        }
      }

      // 4. Cria o frete
      const freight = await this.prisma.freight.create({
        data: {
          name: createFreightDto.name,
          description: createFreightDto.description,
          unitPrice: createFreightDto.unitPrice,
          currency: createFreightDto.currency,
          originUf: createFreightDto.originUf.toUpperCase(),
          originCity: createFreightDto.originCity,
          destinationUf: createFreightDto.destinationUf.toUpperCase(),
          destinationCity: createFreightDto.destinationCity,
          cargoType: createFreightDto.cargoType,
          operationType: createFreightDto.operationType,
          freightTaxes: {
            // Conecta impostos existentes
            connect: taxesToConnect.map((id) => ({ id })),
            // Cria novos impostos
            create: taxesToCreate,
          },
        },
        include: {
          freightTaxes: {
            select: {
              id: true,
              name: true,
              rate: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      return freight;
    } catch (error: any) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      if (error?.code === 'P2002') {
        throw new ConflictException(
          'Já existe um frete com esse nome ou dados únicos',
        );
      }
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao criar frete: ${message}`);
    }
  }

  /**
   * Lista fretes com paginação, filtros e ordenação
   */
  async findAll(query: QueryFreightDto) {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const sortBy = query.sortBy || 'createdAt';
      const sortOrder = query.sortOrder || 'desc';
      const { search, currency, operationType, originUf, destinationUf } =
        query;

      // Configurar filtros
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { originCity: { contains: search, mode: 'insensitive' } },
          { destinationCity: { contains: search, mode: 'insensitive' } },
          { cargoType: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (currency) {
        where.currency = currency;
      }

      if (operationType) {
        where.operationType = operationType;
      }

      if (originUf) {
        where.originUf = {
          contains: originUf.toUpperCase(),
          mode: 'insensitive',
        };
      }

      if (destinationUf) {
        where.destinationUf = {
          contains: destinationUf.toUpperCase(),
          mode: 'insensitive',
        };
      }

      const skip = (page - 1) * limit;

      // Buscar dados e total em paralelo
      const [data, total] = await Promise.all([
        this.prisma.freight.findMany({
          where,
          include: {
            freightTaxes: {
              select: {
                id: true,
                name: true,
                rate: true,
              },
            },
            _count: {
              select: {
                rawMaterialLocations: true,
                products: true,
              },
            },
          },
          orderBy: {
            [sortBy]: sortOrder,
          },
          skip,
          take: limit,
        }),
        this.prisma.freight.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error: any) {
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao buscar fretes: ${message}`);
    }
  }

  /**
   * Busca um frete específico por ID
   */
  async findOne(id: string) {
    try {
      const freight = await this.prisma.freight.findUnique({
        where: { id },
        include: {
          freightTaxes: {
            select: {
              id: true,
              name: true,
              rate: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          rawMaterialLocations: {
            select: {
              id: true,
              rawMaterial: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
              location: {
                select: {
                  id: true,
                  name: true,
                  stateUf: true,
                  city: true,
                },
              },
            },
          },
          products: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          _count: {
            select: {
              rawMaterialLocations: true,
              products: true,
            },
          },
        },
      });

      if (!freight) {
        throw new NotFoundException(`Frete com ID "${id}" não encontrado`);
      }

      return freight;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao buscar frete: ${message}`);
    }
  }

  /**
   * Atualiza um frete existente
   */
  async update(id: string, updateFreightDto: UpdateFreightDto) {
    try {
      // Verifica se existe
      const existing = await this.findOne(id);

      // Validação de nome único
      if (updateFreightDto.name && updateFreightDto.name !== existing.name) {
        const nameExists = await this.prisma.freight.findFirst({
          where: {
            name: updateFreightDto.name,
            NOT: { id },
          },
        });
        if (nameExists) {
          throw new ConflictException('Já existe um frete com este nome');
        }
      }

      const { freightTaxes, ...freightData } = updateFreightDto;

      // Normaliza UFs para maiúsculas se fornecidos
      if (freightData.originUf) {
        freightData.originUf = freightData.originUf.toUpperCase();
      }
      if (freightData.destinationUf) {
        freightData.destinationUf = freightData.destinationUf.toUpperCase();
      }

      // Transação para garantir consistência
      const updatedFreight = await this.prisma.$transaction(async (prisma) => {
        // 1. Atualiza dados do frete
        await prisma.freight.update({
          where: { id },
          data: freightData,
        });

        // 2. Gerencia impostos (se fornecidos)
        if (freightTaxes && freightTaxes.length > 0) {
          // Validar impostos
          this.validateTaxList(freightTaxes);

          const taxesToConnect: string[] = [];
          const taxesToCreate: any[] = [];

          // Processar impostos do DTO
          for (const tax of freightTaxes) {
            if (tax.id) {
              // Imposto existente - atualizar dados se necessário
              const existingTax = await prisma.freightTax.findUnique({
                where: { id: tax.id },
              });

              if (!existingTax) {
                throw new BadRequestException(
                  `Imposto com ID ${tax.id} não encontrado`,
                );
              }

              // Atualiza o imposto se os dados mudaram
              await prisma.freightTax.update({
                where: { id: tax.id },
                data: {
                  name: tax.name.trim(),
                  rate: tax.rate,
                },
              });

              taxesToConnect.push(tax.id);
            } else {
              // Novo imposto
              const existingTax = await prisma.freightTax.findUnique({
                where: { name: tax.name.trim() },
              });

              if (existingTax) {
                throw new ConflictException(
                  `Já existe um imposto com o nome "${tax.name}". Selecione o imposto existente da lista.`,
                );
              }

              taxesToCreate.push({
                name: tax.name.trim(),
                rate: tax.rate,
              });
            }
          }

          // IMPORTANTE: Usar 'set' para substituir completamente a lista de impostos
          await prisma.freight.update({
            where: { id },
            data: {
              freightTaxes: {
                set: taxesToConnect.map((taxId) => ({ id: taxId })),
                create: taxesToCreate,
              },
            },
          });
        }

        // 3. Retorna o frete atualizado
        return prisma.freight.findUnique({
          where: { id },
          include: {
            freightTaxes: {
              select: {
                id: true,
                name: true,
                rate: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        });
      });

      return updatedFreight;
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      if (error?.code === 'P2002') {
        throw new ConflictException(
          'Já existe um frete com esses dados únicos',
        );
      }
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao atualizar frete: ${message}`);
    }
  }

  /**
   * Remove um frete (verifica dependências)
   */
  async remove(id: string) {
    try {
      const freight = await this.findOne(id);

      // Verifica se há matérias-primas usando este frete (RELAÇÃO N:M)
      const rawMaterialLocationsCount =
        await this.prisma.rawMaterialLocationPivot.count({
          where: {
            freights: {
              some: { id },
            },
          },
        });

      if (rawMaterialLocationsCount > 0) {
        throw new BadRequestException(
          `Não é possível remover este frete. Existem ${rawMaterialLocationsCount} associação(ões) de matéria-prima/localização utilizando este frete.`,
        );
      }

      // Verifica se há produtos usando este frete (RELAÇÃO N:M)
      const productsCount = await this.prisma.product.count({
        where: {
          freights: {
            some: { id: id },
          },
        },
      });

      if (productsCount > 0) {
        throw new BadRequestException(
          `Não é possível remover este frete. Existem ${productsCount} produto(s) associado(s).`,
        );
      }

      // Delete cascade remove a relação na tabela pivô
      await this.prisma.freight.delete({
        where: { id },
      });

      return {
        message: `Frete "${freight.name}" removido com sucesso`,
        id,
      };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao remover frete: ${message}`);
    }
  }

  /**
   * Exporta fretes em formato CSV
   */
  async exportToCSV(exportDto: ExportFreightDto): Promise<string> {
    try {
      const { limit, sortBy, sortOrder, filters } = exportDto;

      // Configurar filtros
      const where: any = {};

      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { originCity: { contains: filters.search, mode: 'insensitive' } },
          {
            destinationCity: { contains: filters.search, mode: 'insensitive' },
          },
          { cargoType: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters?.currency) {
        where.currency = filters.currency;
      }

      if (filters?.operationType) {
        where.operationType = filters.operationType;
      }

      if (filters?.originUf) {
        where.originUf = {
          contains: filters.originUf.toUpperCase(),
          mode: 'insensitive',
        };
      }

      if (filters?.destinationUf) {
        where.destinationUf = {
          contains: filters.destinationUf.toUpperCase(),
          mode: 'insensitive',
        };
      }

      // Buscar dados
      const freights = await this.prisma.freight.findMany({
        where,
        include: {
          freightTaxes: {
            select: {
              name: true,
              rate: true,
            },
          },
        },
        orderBy: {
          [sortBy || 'name']: sortOrder || 'asc',
        },
        take: limit || 1000,
      });

      // Montar CSV
      const headers = [
        'ID',
        'Nome',
        'Descrição',
        'Preço Unitário',
        'Moeda',
        'UF Origem',
        'Cidade Origem',
        'UF Destino',
        'Cidade Destino',
        'Tipo de Carga',
        'Tipo de Operação',
        'Impostos',
      ];

      const csvLines = [headers.join(',')];

      // Função para escapar campos CSV
      const escapeCsvField = (field: any): string => {
        if (field === null || field === undefined) return '';
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Adicionar linhas de dados
      for (const freight of freights) {
        const taxesStr = freight.freightTaxes
          .map((tax) => `${tax.name} (${tax.rate}%)`)
          .join('; ');

        const row = [
          escapeCsvField(freight.id),
          escapeCsvField(freight.name),
          escapeCsvField(freight.description || ''),
          escapeCsvField(freight.unitPrice.toFixed(2)),
          escapeCsvField(freight.currency),
          escapeCsvField(freight.originUf),
          escapeCsvField(freight.originCity),
          escapeCsvField(freight.destinationUf),
          escapeCsvField(freight.destinationCity),
          escapeCsvField(freight.cargoType),
          escapeCsvField(freight.operationType),
          escapeCsvField(taxesStr),
        ];

        csvLines.push(row.join(','));
      }

      return csvLines.join('\n');
    } catch (error: any) {
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao exportar fretes: ${message}`);
    }
  }

  /**
   * Retorna estatísticas dos fretes
   */
  async getStatistics() {
    const [total, byCurrency, byOperationType, avgPrice] = await Promise.all([
      this.prisma.freight.count(),
      this.prisma.freight.groupBy({
        by: ['currency'],
        _count: true,
      }),
      this.prisma.freight.groupBy({
        by: ['operationType'],
        _count: true,
      }),
      this.prisma.freight.aggregate({
        _avg: {
          unitPrice: true,
        },
        _min: {
          unitPrice: true,
        },
        _max: {
          unitPrice: true,
        },
      }),
    ]);

    return {
      total,
      byCurrency,
      byOperationType,
      prices: {
        average: avgPrice._avg.unitPrice,
        min: avgPrice._min.unitPrice,
        max: avgPrice._max.unitPrice,
      },
    };
  }

  /**
   * Deleta um imposto específico de um frete
   */
  async deleteFreightTax(freightId: string, taxId: string) {
    try {
      // Verifica se o frete existe
      await this.findOne(freightId);

      // Verifica se o imposto pertence ao frete (CORREÇÃO N:M)
      const tax = await this.prisma.freightTax.findFirst({
        where: {
          id: taxId,
          freights: {
            some: { id: freightId },
          },
        },
      });

      if (!tax) {
        throw new NotFoundException(
          'Imposto não encontrado ou não pertence a este frete',
        );
      }

      // Desconecta o imposto deste frete (não deleta o imposto)
      await this.prisma.freight.update({
        where: { id: freightId },
        data: {
          freightTaxes: {
            disconnect: { id: taxId },
          },
        },
      });

      return {
        message: 'Imposto removido do frete com sucesso',
        taxId,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const message = error?.message || 'Erro desconhecido';
      throw new BadRequestException(`Erro ao remover imposto: ${message}`);
    }
  }

  /**
   * VALIDAÇÃO DE IMPOSTOS
   */
  private validateTaxList(taxes: any[] | undefined): void {
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
}
