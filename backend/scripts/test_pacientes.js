const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPacientes() {
  try {
    console.log('Probando pacientes...\n');

    const total = await prisma.paciente.count();
    console.log('Total pacientes:', total);

    if (total > 0) {
      const pacientes = await prisma.paciente.findMany({
        take: 3
      });
      console.log('\nPrimeros 3 pacientes:');
      console.log(JSON.stringify(pacientes, null, 2));
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPacientes();
