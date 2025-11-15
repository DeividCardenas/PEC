const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRelatedData() {
  try {
    const pacientesCount = await prisma.paciente.count();
    const domiciliariosCount = await prisma.domiciliario.count();

    console.log('Pacientes:', pacientesCount);
    console.log('Domiciliarios:', domiciliariosCount);

    if (pacientesCount > 0) {
      const pacientes = await prisma.paciente.findMany({ take: 3 });
      console.log('\nAlgunos pacientes:');
      pacientes.forEach(p => {
        console.log(`- ${p.nombre} ${p.apellido} (ID: ${p.id_paciente})`);
      });
    }

    if (domiciliariosCount > 0) {
      const domiciliarios = await prisma.domiciliario.findMany({ take: 3 });
      console.log('\nAlgunos domiciliarios:');
      domiciliarios.forEach(d => {
        console.log(`- ${d.nombre} ${d.apellido} (ID: ${d.id_domiciliario})`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRelatedData();
