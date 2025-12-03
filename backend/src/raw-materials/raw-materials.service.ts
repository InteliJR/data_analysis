import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRawMaterialDto, RawMaterialLocationDto } from './dto/create-raw-material.dto';
import { UpdateRawMaterialDto } from './dto/update-raw-material.dto';
import { QueryRawMaterialDto } from './dto/query-raw-material.dto';
import { ExportRawMaterialDto } from './dto/export-raw-material.dto';
import { Currency, Prisma } from '@prisma/client';

type PrismaTx = Prisma.TransactionClient;
type PivotWithRelations = Prisma.RawMaterialLocationPivotGetPayload<{
  include: {
    location: true;
    freights: true;
    locationTaxes: { include: { tax: true } };
  };
}>;

const RAW_MATERIAL_DEFAULT_INCLUDE = {
  locations: {
    include: {
      location: true,
      freights: true,
      locationTaxes: {
        include: {
          tax: true,
        },
      },
    },
  },
} satisfies Prisma.RawMaterialInclude;

type RawMaterialWithRelations = Prisma.RawMaterialGetPayload<{
  include: typeof RAW_MATERIAL_DEFAULT_INCLUDE;
}>;

@Injectable()
export class RawMaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly allowedSortFields = new Set<keyof Prisma.RawMaterialOrderByWithRelationInput>([
    'code',
    'name',
    'measurementUnit',
    'inputGroup',
    'paymentTerm',
    'createdAt',
    'updatedAt',
  ]);

  private readonly defaultInclude = RAW_MATERIAL_DEFAULT_INCLUDE;

  async create(createRawMaterialDto: CreateRawMaterialDto, userId: string) {
    const code = createRawMaterialDto.code.toUpperCase();
    const existingCode = await this.prisma.rawMaterial.findUnique({ where: { code } });
    if (existingCode) {
      throw new ConflictException('Já existe uma matéria-prima com este código');
    }

    if (!createRawMaterialDto.locations || createRawMaterialDto.locations.length === 0) {
      throw new BadRequestException('Informe ao menos uma localização');
    }

    await this.ensureLocationsExist(createRawMaterialDto.locations.map((loc) => loc.locationId));

    const created = await this.prisma.$transaction(async (tx) => {
      const rawMaterial = await tx.rawMaterial.create({
        data: {
          code,
          name: createRawMaterialDto.name,
          description: createRawMaterialDto.description,
          measurementUnit: createRawMaterialDto.measurementUnit,
          inputGroup: createRawMaterialDto.inputGroup,
          paymentTerm: createRawMaterialDto.paymentTerm,
        },
      });

      await this.persistLocationPivots(tx, rawMaterial.id, createRawMaterialDto.locations, userId);
      await this.createChangeLog(rawMaterial.id, 'created', null, 'Matéria-prima criada', userId);

      return rawMaterial;
    });

    return this.findOne(created.id);
  }

  async findAll(query: QueryRawMaterialDto) {
    const {
      page = 1,
      limit = 10,
      search,
      measurementUnit,
      inputGroup,
      stateUf,
      city,
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
        inputGroup ? { inputGroup: { contains: inputGroup, mode: 'insensitive' } } : {},
        stateUf || city
          ? {
              locations: {
                some: {
                  location: {
                    AND: [stateUf ? { stateUf } : {}, city ? { city: { contains: city, mode: 'insensitive' } } : {}],
                  },
                },
              },
            }
          : {},
      ],
    };

    const normalizedSortBy = this.allowedSortFields.has(sortBy as any) ? sortBy : 'name';
    const orderBy: Prisma.RawMaterialOrderByWithRelationInput = {
      [normalizedSortBy]: sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.rawMaterial.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: this.defaultInclude,
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
      include: this.defaultInclude,
    });

    if (!rawMaterial) {
      throw new NotFoundException('Matéria-prima não encontrada');
    }

    return rawMaterial;
  }

  async update(id: string, updateDto: UpdateRawMaterialDto, userId: string) {
    const existing = await this.prisma.rawMaterial.findUnique({
      where: { id },
      include: this.defaultInclude,
    }) as RawMaterialWithRelations | null;

    if (!existing) {
      throw new NotFoundException('Matéria-prima não encontrada');
    }

    if (updateDto.code) {
      const codeExists = await this.prisma.rawMaterial.findFirst({
        where: {
          code: updateDto.code.toUpperCase(),
          NOT: { id },
        },
      });
      if (codeExists) {
        throw new ConflictException('Já existe uma matéria-prima com este código');
      }
    }

    await this.logChanges(existing, updateDto, userId);

    const data: Prisma.RawMaterialUpdateInput = {
      ...(updateDto.code && { code: updateDto.code.toUpperCase() }),
      ...(updateDto.name && { name: updateDto.name }),
      ...(updateDto.description !== undefined && { description: updateDto.description }),
      ...(updateDto.measurementUnit && { measurementUnit: updateDto.measurementUnit }),
      ...(updateDto.inputGroup !== undefined && { inputGroup: updateDto.inputGroup }),
      ...(updateDto.paymentTerm !== undefined && { paymentTerm: updateDto.paymentTerm }),
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.rawMaterial.update({ where: { id }, data });

      if (updateDto.locations) {
        await this.syncLocationPivots(tx, existing, updateDto.locations, userId);
      }
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);

    const productsUsing = await this.prisma.productRawMaterial.count({ where: { rawMaterialId: id } });
    if (productsUsing > 0) {
      throw new ConflictException('Esta matéria-prima está associada a produtos e não pode ser excluída');
    }

    await this.prisma.rawMaterial.delete({ where: { id } });
    return { message: 'Matéria-prima excluída com sucesso' };
  }

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
            select: { name: true, email: true },
          },
        },
      }),
      this.prisma.rawMaterialChangeLog.count({ where: { rawMaterialId: id } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  async getRecentChanges(limit: number = 10) {
    return this.prisma.rawMaterialChangeLog.findMany({
      take: limit,
      orderBy: { changedAt: 'desc' },
      include: {
        rawMaterial: { select: { name: true, code: true } },
        user: { select: { name: true, email: true } },
      },
    });
  }

  async export(exportDto: ExportRawMaterialDto) {
    const { limit = 500, sortBy = 'name', sortOrder = 'asc', filters } = exportDto;

    const where: Prisma.RawMaterialWhereInput = {
      AND: [
        filters?.search
          ? {
              OR: [
                { code: { contains: filters.search, mode: 'insensitive' } },
                { name: { contains: filters.search, mode: 'insensitive' } },
                { inputGroup: { contains: filters.search, mode: 'insensitive' } },
              ],
            }
          : {},
        filters?.measurementUnit ? { measurementUnit: filters.measurementUnit } : {},
        filters?.inputGroup
          ? { inputGroup: { contains: filters.inputGroup, mode: 'insensitive' } }
          : {},
      ],
    };

    const normalizedSortBy = this.allowedSortFields.has(sortBy as any) ? sortBy : 'name';

    const data = await this.prisma.rawMaterial.findMany({
      where,
      take: limit,
      orderBy: { [normalizedSortBy]: sortOrder },
      include: this.defaultInclude,
    });

    const formattedRows = data.flatMap((rawMaterial) => {
      if (!rawMaterial.locations.length) {
        return [
          {
            Código: rawMaterial.code,
            Nome: rawMaterial.name,
            'Unidade de Medida': rawMaterial.measurementUnit,
            'Grupo de Insumo': rawMaterial.inputGroup || '',
            'Prazo de Pagamento': `${rawMaterial.paymentTerm} dias`,
            Localização: '-',
            Moeda: '-',
            'Preço Base': '-',
            'Preço em BRL': '-',
            'Custo Final': '-',
            Fretes: '-',
            Impostos: '-',
          },
        ];
      }

      return rawMaterial.locations.map((pivot) => {
        const basePrice = Number(pivot.acquisitionPrice) + Number(pivot.additionalCost ?? 0);
        const freightTotal = pivot.freights.reduce((sum, f) => sum + Number(f.unitPrice), 0);
        const recoverableTaxes = pivot.locationTaxes
          .filter((t) => t.recoverable)
          .reduce((sum, t) => sum + basePrice * (Number(t.rate) / 100), 0);
        const finalPrice = basePrice + freightTotal - recoverableTaxes;

        return {
          Código: rawMaterial.code,
          Nome: rawMaterial.name,
          'Unidade de Medida': rawMaterial.measurementUnit,
          'Grupo de Insumo': rawMaterial.inputGroup || '',
          'Prazo de Pagamento': `${rawMaterial.paymentTerm} dias`,
          Localização: this.getLocationLabel(pivot.location),
          Moeda: pivot.currency,
          'Preço Base': basePrice.toFixed(2),
          'Preço em BRL': Number(pivot.priceConvertedBrl ?? basePrice).toFixed(2),
          'Custo Final': finalPrice.toFixed(2),
          Fretes: pivot.freights.map((f) => f.name).join('; '),
          Impostos: pivot.locationTaxes
            .map((tax) => `${tax.tax?.name ?? ''} (${tax.rate}%)${tax.recoverable ? ' [Recuperável]' : ''}`)
            .join('; '),
        };
      });
    });

    return this.generateCsv(formattedRows);
  }

  private async ensureLocationsExist(locationIds: string[]) {
    const uniqueIds = Array.from(new Set(locationIds));
    const count = await this.prisma.location.count({ where: { id: { in: uniqueIds } } });
    if (count !== uniqueIds.length) {
      throw new BadRequestException('Uma ou mais localizações não existem');
    }
  }

  private async persistLocationPivots(
    tx: PrismaTx,
    rawMaterialId: string,
    locations: RawMaterialLocationDto[],
    userId: string,
  ) {
    const locationRecords = await tx.location.findMany({
      where: { id: { in: Array.from(new Set(locations.map((loc) => loc.locationId))) } },
    });
    const locationMap = new Map(locationRecords.map((loc) => [loc.id, loc]));

    for (const loc of locations) {
      const location = locationMap.get(loc.locationId);
      if (!location) {
        throw new BadRequestException('Localização informada não foi encontrada');
      }

      await this.validateFreights(tx, loc.freightIds ?? []);
      this.ensureNoDuplicateTaxes(loc.taxes ?? []);

      const pivot = await tx.rawMaterialLocationPivot.create({
        data: {
          rawMaterialId,
          locationId: loc.locationId,
          acquisitionPrice: loc.acquisitionPrice,
          currency: loc.currency,
          priceConvertedBrl: this.computePriceInBrl(loc),
          additionalCost: loc.additionalCost ?? 0,
          freights: {
            connect: (loc.freightIds ?? []).map((id) => ({ id })),
          },
          locationTaxes: {
            create: await this.mapTaxesForPivot(tx, loc.taxes ?? []),
          },
        },
        include: this.defaultInclude.locations.include,
      });

      await this.logLocationSnapshot(rawMaterialId, location, pivot, 'created', userId);
    }
  }

  private async syncLocationPivots(
    tx: PrismaTx,
    existing: RawMaterialWithRelations,
    locations: RawMaterialLocationDto[],
    userId: string,
  ) {
    const incomingByLocation = new Map(locations.map((loc) => [loc.locationId, loc] as const));
    const existingByLocation = new Map(existing.locations.map((pivot) => [pivot.locationId, pivot] as const));

    await this.ensureLocationsExist(locations.map((loc) => loc.locationId));

    for (const pivot of existing.locations) {
      if (!incomingByLocation.has(pivot.locationId)) {
        await tx.rawMaterialLocationPivot.delete({ where: { id: pivot.id } });
        await this.logLocationFieldChange(
          existing.id,
          pivot.location,
          'removed',
          this.describePivot(pivot),
          null,
          userId,
        );
      }
    }

    for (const loc of locations) {
      await this.validateFreights(tx, loc.freightIds ?? []);
      this.ensureNoDuplicateTaxes(loc.taxes ?? []);

      const locationRecord = await tx.location.findUnique({ where: { id: loc.locationId } });
      if (!locationRecord) {
        throw new BadRequestException('Localização informada não foi encontrada');
      }

      const existingPivot = existingByLocation.get(loc.locationId);
      if (!existingPivot) {
        await this.persistLocationPivots(tx, existing.id, [loc], userId);
        continue;
      }

      const updatedPivot = await tx.rawMaterialLocationPivot.update({
        where: { id: existingPivot.id },
        data: {
          acquisitionPrice: loc.acquisitionPrice,
          currency: loc.currency,
          priceConvertedBrl: this.computePriceInBrl(loc),
          additionalCost: loc.additionalCost ?? 0,
          freights: {
            set: [],
            connect: (loc.freightIds ?? []).map((id) => ({ id })),
          },
          locationTaxes: {
            deleteMany: {},
            create: await this.mapTaxesForPivot(tx, loc.taxes ?? []),
          },
        },
        include: this.defaultInclude.locations.include,
      });

      await this.logPivotDifferences(existing.id, existingPivot, updatedPivot, userId);
    }
  }

  private async mapTaxesForPivot(tx: PrismaTx, taxes: RawMaterialLocationDto['taxes'] = []) {
    const mapped: { taxId: string; rate: number; recoverable: boolean }[] = [];

    for (const tax of taxes) {
      let taxId = tax?.taxId;
      if (!taxId && tax?.name) {
        const trimmedName = tax.name.trim();
        const existing = await tx.rawMaterialTax.findUnique({ where: { name: trimmedName } });
        if (existing) {
          taxId = existing.id;
        } else {
          const created = await tx.rawMaterialTax.create({
            data: {
              name: trimmedName,
              defaultRate: tax.rate,
              recoverable: tax.recoverable,
            },
          });
          taxId = created.id;
        }
      }

      if (!taxId) {
        throw new BadRequestException('Taxa inválida: informe taxId ou name');
      }

      mapped.push({ taxId, rate: tax.rate, recoverable: tax.recoverable });
    }

    return mapped;
  }

  private async validateFreights(tx: PrismaTx, freightIds: string[]) {
    if (!freightIds.length) return;
    const count = await tx.freight.count({ where: { id: { in: Array.from(new Set(freightIds)) } } });
    if (count !== new Set(freightIds).size) {
      throw new BadRequestException('Um ou mais fretes informados não existem');
    }
  }

  private ensureNoDuplicateTaxes(taxes: RawMaterialLocationDto['taxes'] = []) {
    const keys = taxes.map((tax) => (tax?.taxId || tax?.name || '').toLowerCase());
    if (keys.length !== new Set(keys).size) {
      throw new BadRequestException('Existem impostos duplicados na mesma localização');
    }
  }

  private computePriceInBrl(loc: RawMaterialLocationDto) {
    if (loc.currency === Currency.BRL) {
      return loc.acquisitionPrice;
    }
    if (loc.priceConvertedBrl === undefined || loc.priceConvertedBrl === null) {
      throw new BadRequestException('Informe priceConvertedBrl para moedas diferentes de BRL');
    }
    return loc.priceConvertedBrl;
  }

  private async createChangeLog(rawMaterialId: string, field: string, oldValue: string | null, newValue: string | null, userId: string) {
    await this.prisma.rawMaterialChangeLog.create({
      data: {
        rawMaterialId,
        field,
        oldValue,
        newValue,
        userId,
      },
    });
  }

  private async logChanges(existing: RawMaterialWithRelations, updateDto: UpdateRawMaterialDto, userId: string) {
    const fieldsToTrack: (keyof UpdateRawMaterialDto)[] = [
      'code',
      'name',
      'description',
      'measurementUnit',
      'inputGroup',
      'paymentTerm',
    ];

    for (const field of fieldsToTrack) {
      if (updateDto[field] === undefined) continue;
      const oldValue = existing[field as keyof typeof existing];
      const newValue = updateDto[field];
      if (String(oldValue ?? '') !== String(newValue ?? '')) {
        await this.createChangeLog(existing.id, field as string, oldValue ? String(oldValue) : null, newValue ? String(newValue) : null, userId);
      }
    }
  }

  private async logPivotDifferences(rawMaterialId: string, before: PivotWithRelations, after: PivotWithRelations, userId: string) {
    const fieldsToCompare: Array<keyof PivotWithRelations> = ['acquisitionPrice', 'currency', 'priceConvertedBrl', 'additionalCost'];
    for (const field of fieldsToCompare) {
      if (String(before[field] ?? '') !== String(after[field] ?? '')) {
        await this.logLocationFieldChange(
          rawMaterialId,
          after.location,
          field,
          String(before[field] ?? ''),
          String(after[field] ?? ''),
          userId,
        );
      }
    }

    const previousFreights = before.freights.map((f) => f.name).sort().join(', ');
    const nextFreights = after.freights.map((f) => f.name).sort().join(', ');
    if (previousFreights !== nextFreights) {
      await this.logLocationFieldChange(rawMaterialId, after.location, 'freights', previousFreights, nextFreights, userId);
    }

    const previousTaxes = before.locationTaxes
      .map((tax) => `${tax.tax?.name ?? ''} (${tax.rate}%)${tax.recoverable ? 'R' : 'NR'}`)
      .sort()
      .join(' | ');
    const nextTaxes = after.locationTaxes
      .map((tax) => `${tax.tax?.name ?? ''} (${tax.rate}%)${tax.recoverable ? 'R' : 'NR'}`)
      .sort()
      .join(' | ');
    if (previousTaxes !== nextTaxes) {
      await this.logLocationFieldChange(rawMaterialId, after.location, 'taxes', previousTaxes, nextTaxes, userId);
    }
  }

  private async logLocationSnapshot(
    rawMaterialId: string,
    location: PivotWithRelations['location'],
    pivot: PivotWithRelations,
    action: string,
    userId: string,
  ) {
    const description = this.describePivot(pivot);
    await this.logLocationFieldChange(rawMaterialId, location, action, null, description, userId);
  }

  private async logLocationFieldChange(
    rawMaterialId: string,
    location: Pick<PivotWithRelations['location'], 'id' | 'name' | 'city' | 'stateUf'>,
    field: string,
    oldValue: string | null,
    newValue: string | null,
    userId: string,
  ) {
    const label = this.getLocationLabel(location);
    await this.createChangeLog(rawMaterialId, `location:${label}:${field}`, oldValue, newValue, userId);
  }

  private describePivot(pivot: PivotWithRelations) {
    const freights = pivot.freights.map((f) => f.name).join(', ');
    const taxes = pivot.locationTaxes
      .map((tax) => `${tax.tax?.name ?? ''} (${tax.rate}%)${tax.recoverable ? 'R' : 'NR'}`)
      .join(', ');
    return `Preço=${pivot.acquisitionPrice} ${pivot.currency} | Custo Extra=${pivot.additionalCost} | Fretes=[${freights}] | Impostos=[${taxes}]`;
  }

  private getLocationLabel(location: Pick<PivotWithRelations['location'], 'name' | 'city' | 'stateUf'>) {
    if (location.name) {
      return location.name;
    }
    return `${location.city ?? ''}/${location.stateUf ?? ''}`.trim();
  }

  private generateCsv(rows: Record<string, string>[]) {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const csvRows = rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header] ?? '';
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(','),
    );
    return [headers.join(','), ...csvRows].join('\n');
  }
}
