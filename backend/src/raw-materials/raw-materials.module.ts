// src/raw-materials/raw-materials.module.ts

import { Module } from '@nestjs/common';
import { RawMaterialsService } from './raw-materials.service';
import { RawMaterialsController } from './raw-materials.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [PrismaModule, ExportModule],
  controllers: [RawMaterialsController],
  providers: [RawMaterialsService],
  exports: [RawMaterialsService],
})
export class RawMaterialsModule {}