import { Module } from '@nestjs/common';
import { FreightsService } from './freights.service';
import { FreightsController } from './freights.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FreightsController],
  providers: [FreightsService],
  exports: [FreightsService], // Exporta para outros módulos usarem se necessário
})
export class FreightsModule {}
