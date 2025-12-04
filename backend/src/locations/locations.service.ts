import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { QueryLocationDto } from './dto/query-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLocationDto, userId: string) {
    const normalizedName = dto.name.trim();
    const normalizedCountry = (dto.country || 'BR').toUpperCase();
    const normalizedState = dto.stateUf.toUpperCase();
    const normalizedCity = dto.city.trim();

    await this.ensureUniqueName(normalizedName);

    const location = await this.prisma.location.create({
      data: {
        name: normalizedName,
        country: normalizedCountry,
        stateUf: normalizedState,
        city: normalizedCity,
      },
    });

    await this.createChangeLog(location.id, userId, 'created', null, `${location.name} - ${location.city}/${location.stateUf}`);
    return location;
  }

  async findAll(query: QueryLocationDto) {
    const { page = 1, limit = 10, search, stateUf, city } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.LocationWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        stateUf ? { stateUf: stateUf.toUpperCase() } : {},
        city ? { city: { contains: city, mode: 'insensitive' } } : {},
      ],
    };

    const [data, total] = await Promise.all([
      this.prisma.location.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.location.count({ where }),
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
    const location = await this.prisma.location.findUnique({ where: { id } });
    if (!location) {
      throw new NotFoundException('Localização não encontrada');
    }
    return location;
  }

  async update(id: string, dto: UpdateLocationDto, userId: string) {
    const existing = await this.findOne(id);

    if (!dto.name && !dto.city && !dto.stateUf && !dto.country) {
      throw new BadRequestException('Nenhuma alteração informada');
    }

    const data: Prisma.LocationUpdateInput = {};

    if (dto.name) {
      const normalizedName = dto.name.trim();
      await this.ensureUniqueName(normalizedName, id);
      data.name = normalizedName;
    }

    if (dto.city) {
      data.city = dto.city.trim();
    }

    if (dto.stateUf) {
      data.stateUf = dto.stateUf.toUpperCase();
    }

    if (dto.country) {
      data.country = dto.country.toUpperCase();
    }

    const updated = await this.prisma.location.update({
      where: { id },
      data,
    });

    await this.logDifferences(existing, updated, userId);
    return updated;
  }

  async remove(id: string, _userId: string) {
    await this.findOne(id);

    try {
      const deleted = await this.prisma.location.delete({ where: { id } });
      return deleted;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException('Não é possível remover a localização pois ela está associada a uma matéria-prima.');
      }
      throw error;
    }
  }

  async getChangeLogs(id: string, page: number = 1, limit: number = 20) {
    await this.findOne(id);

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.locationChangeLog.findMany({
        where: { locationId: id },
        skip,
        take: limit,
        orderBy: { changedAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
      this.prisma.locationChangeLog.count({ where: { locationId: id } }),
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

  private async logDifferences(
    before: Prisma.LocationGetPayload<{}>,
    after: Prisma.LocationGetPayload<{}>,
    userId: string,
  ) {
    const fields: Array<keyof Prisma.LocationGetPayload<{}>> = ['name', 'city', 'stateUf', 'country'];

    for (const field of fields) {
      const oldValue = before[field];
      const newValue = after[field];
      if (String(oldValue ?? '') !== String(newValue ?? '')) {
        await this.createChangeLog(after.id, userId, field as string, String(oldValue ?? ''), String(newValue ?? ''));
      }
    }
  }

  private async createChangeLog(locationId: string, userId: string, field: string, oldValue: string | null, newValue: string | null) {
    await this.prisma.locationChangeLog.create({
      data: {
        locationId,
        field,
        oldValue,
        newValue,
        userId,
      },
    });
  }

  private async ensureUniqueName(name: string, excludeId?: string) {
    if (!name) {
      return;
    }

    const conditions: Prisma.LocationWhereInput[] = [
      { name: { equals: name, mode: 'insensitive' } },
    ];

    if (excludeId) {
      conditions.push({ id: { not: excludeId } });
    }

    const existing = await this.prisma.location.findFirst({
      where: {
        AND: conditions,
      },
    });

    if (existing) {
      throw new BadRequestException('Já existe uma localização com esse nome');
    }
  }
}
