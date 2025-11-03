import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@retail/database';

@Injectable()
export class TenantsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return tenant;
  }
}
