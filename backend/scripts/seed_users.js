const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seedUsers() {
  try {
    console.log('🌱 Creando usuarios de prueba...\n');

    // Crear roles si no existen
    const roles = [
      { nombre: 'Administrador' },
      { nombre: 'Farmaceutico' },
      { nombre: 'Auxiliar' },
      { nombre: 'Contador' }
    ];

    const createdRoles = [];
    for (const rolData of roles) {
      let rol = await prisma.rol.findUnique({ where: { nombre: rolData.nombre } });
      if (!rol) {
        rol = await prisma.rol.create({ data: rolData });
        console.log(`✅ Rol creado: ${rol.nombre}`);
      } else {
        console.log(`ℹ️  Rol existente: ${rol.nombre}`);
      }
      createdRoles.push(rol);
    }

    console.log('\n');

    // Crear usuarios de prueba
    const usuarios = [
      {
        username: 'admin',
        email: 'admin@pec.com',
        password: 'admin123',
        rol: 'Administrador'
      },
      {
        username: 'farmaceutico',
        email: 'farmaceutico@pec.com',
        password: 'farmaceutico123',
        rol: 'Farmaceutico'
      },
      {
        username: 'auxiliar',
        email: 'auxiliar@pec.com',
        password: 'auxiliar123',
        rol: 'Auxiliar'
      },
      {
        username: 'contador',
        email: 'contador@pec.com',
        password: 'contador123',
        rol: 'Contador'
      }
    ];

    for (const userData of usuarios) {
      const existingUser = await prisma.usuario.findUnique({
        where: { email: userData.email }
      });

      if (!existingUser) {
        const rol = createdRoles.find(r => r.nombre === userData.rol);
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const user = await prisma.usuario.create({
          data: {
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
            id_rol: rol.id_rol
          },
          include: {
            rol: true
          }
        });

        console.log(`✅ Usuario creado:`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔑 Password: ${userData.password}`);
        console.log(`   👤 Rol: ${user.rol.nombre}`);
        console.log('');
      } else {
        console.log(`⚠️  Usuario ya existe: ${userData.email}`);
      }
    }

    console.log('\n🎉 Seed de usuarios completado!\n');
    console.log('=== CREDENCIALES DE ACCESO ===');
    console.log('');
    console.log('👑 Administrador:');
    console.log('   Email: admin@pec.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('💊 Farmacéutico:');
    console.log('   Email: farmaceutico@pec.com');
    console.log('   Password: farmaceutico123');
    console.log('');
    console.log('🏥 Auxiliar:');
    console.log('   Email: auxiliar@pec.com');
    console.log('   Password: auxiliar123');
    console.log('');
    console.log('💰 Contador:');
    console.log('   Email: contador@pec.com');
    console.log('   Password: contador123');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();
