import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { PrismaClient } from '@retail/database';

@Module({
  controllers: [InventoryController],
  providers: [
    InventoryService,
    {
      provide: 'PRISMA',
      useValue: new PrismaClient(),
    },
  ],
  exports: [InventoryService],
})
export class InventoryModule {}
