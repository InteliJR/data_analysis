import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  DefaultValuePipe,
  ParseIntPipe,
  Header,
  BadRequestException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateProductFullDto } from './dto/create-product-full.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CalculatePriceDto } from './dto/calculate-price.dto';
import { ExportProductsDto } from './dto/export-products.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExternalTokenGuard } from '../common/guards/external-token.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  create(@Body() createProductDto: CreateProductDto, @Req() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;

    if (!userId) {
      throw new BadRequestException('Usuário não identificado no token');
    }

    return this.productsService.create(createProductDto, userId);
  }

  @Post('full-create')
  @HttpCode(HttpStatus.CREATED)
  // Permite acesso por token externo (sem exigir JWT). Ainda valida role via RolesGuard.
  @UseGuards(ExternalTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  createFull(@Body() dto: CreateProductFullDto, @Req() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    if (!userId) {
      throw new BadRequestException('Usuário não identificado no token');
    }
    return this.productsService.createFull(dto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('search') search?: string,
    @Query('productGroupId') productGroupId?: string,
    @Query('sortBy', new DefaultValuePipe('code')) sortBy?: string,
    @Query('sortOrder', new DefaultValuePipe('asc')) sortOrder?: 'asc' | 'desc',
  ) {
    return this.productsService.findAll({
      page,
      limit,
      search,
      productGroupId,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post('calculate-price')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  calculatePrice(@Body() calculatePriceDto: CalculatePriceDto) {
    return this.productsService.calculateProductPrice(calculatePriceDto);
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header(
    'Content-Disposition',
    `attachment; filename="produtos-${new Date().toISOString().split('T')[0]}.csv"`,
  )
  async exportProducts(@Body() exportDto: ExportProductsDto) {
    return this.productsService.exportProducts(exportDto);
  }
}