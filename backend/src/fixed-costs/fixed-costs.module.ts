// src/fixed-costs/fixed-costs.module.ts

import { Module } from '@nestjs/common';
import { FixedCostsService } from './fixed-costs.service';
import { FixedCostsController } from './fixed-costs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FixedCostsController],
  providers: [FixedCostsService],
  exports: [FixedCostsService],
})
export class FixedCostsModule {}