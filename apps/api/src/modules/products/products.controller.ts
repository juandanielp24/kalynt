import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto';
import { TenantGuard } from '@/common/guards/tenant.guard';

@Controller('products')
@UseGuards(TenantGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @Headers('x-tenant-id') tenantId: string,
    @Query() query: ProductQueryDto
  ) {
    return this.productsService.findAll(tenantId, query);
  }

  @Get(':id')
  async findOne(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ) {
    return this.productsService.findOne(tenantId, id);
  }

  @Post()
  async create(
    @Headers('x-tenant-id') tenantId: string,
    @Body() createDto: CreateProductDto
  ) {
    return this.productsService.create(tenantId, createDto);
  }

  @Put(':id')
  async update(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateProductDto
  ) {
    return this.productsService.update(tenantId, id, updateDto);
  }

  @Delete(':id')
  async remove(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ) {
    return this.productsService.remove(tenantId, id);
  }

  @Get(':id/stock')
  async getStock(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ) {
    return this.productsService.getStock(tenantId, id);
  }
}
