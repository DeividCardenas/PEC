const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testReportes() {
  try {
    console.log('Probando consulta de reportes...\n');

    // Prueba 1: Contar órdenes de compra
    console.log('1. Total de órdenes de compra:');
    const totalOrdenes = await prisma.ordenCompra.count();
    console.log(`Total: ${totalOrdenes}`);

    // Prueba 2: Obtener algunas órdenes
    console.log('\n2. Primeras 3 órdenes:');
    const ordenes = await prisma.ordenCompra.findMany({
      take: 3,
      include: {
        proveedor: true,
        detalles: {
          include: {
            producto: {
              include: {
                laboratorio: true,
              },
            },
          },
        },
      },
    });
    console.log(JSON.stringify(ordenes, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testReportes();
