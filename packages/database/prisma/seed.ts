import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Crear tenant de prueba
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Store',
      slug: 'demo',
      country: 'AR',
      cuit: '20-12345678-9',
      fiscalCondition: 'RI',
      currency: 'ARS',
      plan: 'pro',
      status: 'active',
    },
  });

  console.log('✅ Tenant creado:', tenant.slug);

  // Crear usuario owner
  const owner = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'owner@demo.com'
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'owner@demo.com',
      name: 'Demo Owner',
      role: 'owner',
      emailVerified: true,
    },
  });

  console.log('✅ Usuario owner creado:', owner.email);

  // Crear ubicación
  const location = await prisma.location.create({
    data: {
      tenantId: tenant.id,
      name: 'Sucursal Principal',
      type: 'store',
      address: 'Av. Corrientes 1234',
      city: 'CABA',
      province: 'Buenos Aires',
      isActive: true,
    },
  });

  console.log('✅ Ubicación creada:', location.name);

  // Crear categorías
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        tenantId: tenant.id,
        name: 'Alimentos',
        slug: 'alimentos',
      },
    }),
    prisma.category.create({
      data: {
        tenantId: tenant.id,
        name: 'Bebidas',
        slug: 'bebidas',
      },
    }),
    prisma.category.create({
      data: {
        tenantId: tenant.id,
        name: 'Limpieza',
        slug: 'limpieza',
      },
    }),
  ]);

  console.log('✅ Categorías creadas:', categories.length);

  // Crear productos de prueba
  const products = [
    {
      sku: 'PROD-001',
      barcode: '7790001234567',
      name: 'Leche Entera 1L',
      categoryId: categories[1].id,
      costCents: 80000, // $800
      priceCents: 120000, // $1200
      taxRate: 0.21,
    },
    {
      sku: 'PROD-002',
      barcode: '7790001234568',
      name: 'Pan Lactal',
      categoryId: categories[0].id,
      costCents: 150000,
      priceCents: 250000,
      taxRate: 0.21,
    },
    {
      sku: 'PROD-003',
      barcode: '7790001234569',
      name: 'Detergente 500ml',
      categoryId: categories[2].id,
      costCents: 200000,
      priceCents: 350000,
      taxRate: 0.21,
    },
  ];

  for (const productData of products) {
    const product = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        ...productData,
      },
    });

    // Crear stock inicial
    await prisma.stock.create({
      data: {
        tenantId: tenant.id,
        productId: product.id,
        locationId: location.id,
        quantity: 100,
        minQuantity: 10,
      },
    });

    console.log('✅ Producto creado:', product.name);
  }

  console.log('🎉 Seed completado!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
