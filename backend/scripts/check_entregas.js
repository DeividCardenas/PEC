const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEntregas() {
  try {
    const count = await prisma.entrega.count();
    console.log('Total entregas en base de datos:', count);

    if (count > 0) {
      const entregas = await prisma.entrega.findMany({
        take: 5,
        include: {
          paciente: true,
          domiciliario: true
        }
      });
      console.log('\nPrimeras 5 entregas:');
      console.log(JSON.stringify(entregas, null, 2));
    } else {
      console.log('\n❌ No hay entregas en la base de datos');
      console.log('Necesitas crear un script de seed para poblar datos de prueba');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkEntregas();
