// src/product-groups/product-groups.module.ts

import { Module } from '@nestjs/common';
import { ProductGroupsService } from './product-groups.service';
import { ProductGroupsController } from './product-groups.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductGroupsController],
  providers: [ProductGroupsService],
  exports: [ProductGroupsService],
})
export class ProductGroupsModule {}