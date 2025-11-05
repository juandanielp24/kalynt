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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto, BulkUpdatePricesDto } from './dto';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { RequirePermission } from '@/rbac/decorators/require-permission.decorator';
import { AuditLog } from '@/rbac/interceptors/audit-log.interceptor';
import { PermissionResource, PermissionAction } from '@prisma/client';

@ApiTags('Products')
@Controller('products')
@UseGuards(TenantGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequirePermission(PermissionResource.PRODUCTS, PermissionAction.READ)
  async findAll(
    @Headers('x-tenant-id') tenantId: string,
    @Query() query: ProductQueryDto
  ) {
    return this.productsService.findAll(tenantId, query);
  }

  // Specific routes must come before parameterized routes
  @Get('export')
  @RequirePermission(PermissionResource.PRODUCTS, PermissionAction.READ)
  @AuditLog({ action: 'EXECUTE', entity: 'PRODUCT', description: 'Exported products to Excel' })
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
  @RequirePermission(PermissionResource.PRODUCTS, PermissionAction.READ)
  async findByBarcode(
    @Headers('x-tenant-id') tenantId: string,
    @Param('barcode') barcode: string
  ) {
    return this.productsService.findByBarcode(tenantId, barcode);
  }

  @Get(':id')
  @RequirePermission(PermissionResource.PRODUCTS, PermissionAction.READ)
  async findOne(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ) {
    return this.productsService.findOne(tenantId, id);
  }

  @Get(':id/stock')
  @RequirePermission(PermissionResource.STOCK, PermissionAction.READ)
  async getStock(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ) {
    return this.productsService.getStock(tenantId, id);
  }

  @Post()
  @RequirePermission(PermissionResource.PRODUCTS, PermissionAction.CREATE)
  @AuditLog({ action: 'CREATE', entity: 'PRODUCT', description: 'Created new product' })
  async create(
    @Headers('x-tenant-id') tenantId: string,
    @Body() createDto: CreateProductDto
  ) {
    return this.productsService.create(tenantId, createDto);
  }

  @Post('bulk-update-prices')
  @RequirePermission(PermissionResource.PRODUCTS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'PRODUCT', description: 'Bulk updated product prices' })
  async bulkUpdatePrices(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: BulkUpdatePricesDto
  ) {
    return this.productsService.bulkUpdatePrices(tenantId, dto.products);
  }

  @Post('import')
  @RequirePermission(PermissionResource.PRODUCTS, PermissionAction.CREATE)
  @AuditLog({ action: 'CREATE', entity: 'PRODUCT', description: 'Imported products from Excel' })
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
  @RequirePermission(PermissionResource.PRODUCTS, PermissionAction.CREATE)
  @AuditLog({ action: 'CREATE', entity: 'PRODUCT', description: 'Duplicated product' })
  async duplicateProduct(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ) {
    return this.productsService.duplicate(tenantId, id);
  }

  @Put(':id')
  @RequirePermission(PermissionResource.PRODUCTS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'PRODUCT', description: 'Updated product' })
  async update(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateProductDto
  ) {
    return this.productsService.update(tenantId, id, updateDto);
  }

  @Patch(':id/toggle-active')
  @RequirePermission(PermissionResource.PRODUCTS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'PRODUCT', description: 'Toggled product active status' })
  async toggleActive(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ) {
    return this.productsService.toggleActive(tenantId, id);
  }

  @Delete(':id')
  @RequirePermission(PermissionResource.PRODUCTS, PermissionAction.DELETE)
  @AuditLog({ action: 'DELETE', entity: 'PRODUCT', description: 'Deleted product' })
  async remove(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ) {
    return this.productsService.remove(tenantId, id);
  }
}
