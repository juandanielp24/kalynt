import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto, BulkUpdatePricesDto } from './dto';
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

  // Specific routes must come before parameterized routes
  @Get('export')
  async exportProducts(
    @Headers('x-tenant-id') tenantId: string,
    @Query() filters: any,
    @Res() res: Response
  ) {
    const buffer = await this.productsService.exportToExcel(tenantId, filters);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="productos-${new Date().toISOString()}.xlsx"`
    );
    res.send(buffer);
  }

  @Get('barcode/:barcode')
  async findByBarcode(
    @Headers('x-tenant-id') tenantId: string,
    @Param('barcode') barcode: string
  ) {
    return this.productsService.findByBarcode(tenantId, barcode);
  }

  @Get(':id')
  async findOne(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ) {
    return this.productsService.findOne(tenantId, id);
  }

  @Get(':id/stock')
  async getStock(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ) {
    return this.productsService.getStock(tenantId, id);
  }

  @Post()
  async create(
    @Headers('x-tenant-id') tenantId: string,
    @Body() createDto: CreateProductDto
  ) {
    return this.productsService.create(tenantId, createDto);
  }

  @Post('bulk-update-prices')
  async bulkUpdatePrices(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: BulkUpdatePricesDto
  ) {
    return this.productsService.bulkUpdatePrices(tenantId, dto.products);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importProducts(
    @Headers('x-tenant-id') tenantId: string,
    @Body('locationId') locationId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.productsService.importFromExcel(
      tenantId,
      file.buffer,
      locationId
    );
  }

  @Post(':id/duplicate')
  async duplicateProduct(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ) {
    return this.productsService.duplicate(tenantId, id);
  }

  @Put(':id')
  async update(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateProductDto
  ) {
    return this.productsService.update(tenantId, id, updateDto);
  }

  @Patch(':id/toggle-active')
  async toggleActive(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ) {
    return this.productsService.toggleActive(tenantId, id);
  }

  @Delete(':id')
  async remove(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ) {
    return this.productsService.remove(tenantId, id);
  }
}
