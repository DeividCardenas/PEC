const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const usuarios = await prisma.usuario.findMany({
      include: {
        rol: true
      }
    });

    console.log('\n=== USUARIOS EN LA BASE DE DATOS ===\n');

    if (usuarios.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
    } else {
      usuarios.forEach(user => {
        console.log(`📧 Email: ${user.email}`);
        console.log(`👤 Username: ${user.username}`);
        console.log(`🔑 Rol: ${user.rol.nombre}`);
        console.log(`📅 Creado: ${user.createdAt}`);
        console.log('---');
      });
      console.log(`\nTotal usuarios: ${usuarios.length}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
