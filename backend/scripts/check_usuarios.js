const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsuarios() {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id_usuario: true,
        username: true,
        rol: true
      }
    });

    console.log('Usuarios disponibles:');
    usuarios.forEach(u => {
      console.log(`- ID: ${u.id_usuario}, Username: ${u.username}, Rol: ${u.rol}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsuarios();
