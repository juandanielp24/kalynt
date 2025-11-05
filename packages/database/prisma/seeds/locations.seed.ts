import { PrismaClient, LocationType } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedLocations(tenantId: string, managerId?: string) {
  console.log('🏢 Seeding locations...');

  // Crear 3 ubicaciones de demostración
  const locations = [
    {
      name: 'Sucursal Centro',
      code: 'SUC001',
      type: LocationType.STORE,
      address: 'Av. Corrientes 1234',
      city: 'CABA',
      province: 'Buenos Aires',
      country: 'AR',
      postalCode: '1043',
      phone: '+54 11 4321-1234',
      email: 'centro@demo.com',
      isWarehouse: false,
      managerId: managerId,
      openingHours: {
        monday: { open: '09:00', close: '19:00', closed: false },
        tuesday: { open: '09:00', close: '19:00', closed: false },
        wednesday: { open: '09:00', close: '19:00', closed: false },
        thursday: { open: '09:00', close: '19:00', closed: false },
        friday: { open: '09:00', close: '20:00', closed: false },
        saturday: { open: '10:00', close: '18:00', closed: false },
        sunday: { open: '11:00', close: '15:00', closed: false },
      },
      maxCapacity: 5000,
      isActive: true,
    },
    {
      name: 'Sucursal Palermo',
      code: 'SUC002',
      type: LocationType.STORE,
      address: 'Av. Santa Fe 3456',
      city: 'CABA',
      province: 'Buenos Aires',
      country: 'AR',
      postalCode: '1425',
      phone: '+54 11 4321-5678',
      email: 'palermo@demo.com',
      isWarehouse: false,
      openingHours: {
        monday: { open: '10:00', close: '20:00', closed: false },
        tuesday: { open: '10:00', close: '20:00', closed: false },
        wednesday: { open: '10:00', close: '20:00', closed: false },
        thursday: { open: '10:00', close: '20:00', closed: false },
        friday: { open: '10:00', close: '21:00', closed: false },
        saturday: { open: '10:00', close: '21:00', closed: false },
        sunday: { open: '12:00', close: '18:00', closed: false },
      },
      maxCapacity: 4000,
      isActive: true,
    },
    {
      name: 'Depósito Central',
      code: 'DEP001',
      type: LocationType.WAREHOUSE,
      address: 'Av. Warnes 2500',
      city: 'CABA',
      province: 'Buenos Aires',
      country: 'AR',
      postalCode: '1427',
      phone: '+54 11 4321-9999',
      email: 'deposito@demo.com',
      isWarehouse: true,
      openingHours: {
        monday: { open: '08:00', close: '17:00', closed: false },
        tuesday: { open: '08:00', close: '17:00', closed: false },
        wednesday: { open: '08:00', close: '17:00', closed: false },
        thursday: { open: '08:00', close: '17:00', closed: false },
        friday: { open: '08:00', close: '17:00', closed: false },
        saturday: { open: '08:00', close: '13:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true },
      },
      maxCapacity: 20000,
      isActive: true,
    },
  ];

  const createdLocations = [];

  for (const locationData of locations) {
    const location = await prisma.location.upsert({
      where: {
        tenantId_code: {
          tenantId: tenantId,
          code: locationData.code,
        },
      },
      update: {},
      create: {
        tenantId: tenantId,
        ...locationData,
      },
    });

    console.log(`  ✅ ${location.name} (${location.code})`);
    createdLocations.push(location);
  }

  console.log(`✅ Created ${createdLocations.length} locations`);
  return createdLocations;
}
