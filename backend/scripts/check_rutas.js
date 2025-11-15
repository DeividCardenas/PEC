const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRutas() {
  try {
    const count = await prisma.ruta.count();
    console.log('Total rutas en base de datos:', count);

    if (count > 0) {
      const rutas = await prisma.ruta.findMany({
        take: 5,
        include: {
          domiciliario: true,
          usuario_creador: true
        }
      });
      console.log('\nPrimeras 5 rutas:');
      console.log(JSON.stringify(rutas, null, 2));
    } else {
      console.log('\n❌ No hay rutas en la base de datos');
      console.log('Necesitas crear un script de seed para poblar datos de prueba');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRutas();
