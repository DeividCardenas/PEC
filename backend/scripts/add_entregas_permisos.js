const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addEntregasPermisos() {
  try {
    console.log('Agregando permisos para Entregas...\n');

    // Permisos para entregas
    const permisosEntregas = [
      'ver_entregas',
      'crear_entregas',
      'editar_entregas',
      'despachar_entregas',
      'cancelar_entregas'
    ];

    // Crear o actualizar permisos
    for (const nombrePermiso of permisosEntregas) {
      const result = await prisma.permiso.upsert({
        where: { nombre: nombrePermiso },
        update: {},
        create: { nombre: nombrePermiso }
      });
      console.log(`✓ Permiso: ${nombrePermiso}`);
    }

    // Obtener el rol de Administrador
    const rolAdmin = await prisma.rol.findFirst({
      where: { nombre: 'Administrador' }
    });

    if (!rolAdmin) {
      console.log('\n❌ No se encontró el rol Administrador');
      return;
    }

    console.log(`\n✓ Rol Administrador encontrado: ${rolAdmin.nombre}`);

    // Asignar todos los permisos al rol Administrador
    for (const nombrePermiso of permisosEntregas) {
      const permisoObj = await prisma.permiso.findUnique({
        where: { nombre: nombrePermiso }
      });

      if (permisoObj) {
        await prisma.permisoOnRol.upsert({
          where: {
            id_rol_id_permiso: {
              id_rol: rolAdmin.id_rol,
              id_permiso: permisoObj.id_permiso
            }
          },
          update: {},
          create: {
            id_rol: rolAdmin.id_rol,
            id_permiso: permisoObj.id_permiso
          }
        });
        console.log(`✓ Permiso ${nombrePermiso} asignado a Administrador`);
      }
    }

    console.log('\n✅ Permisos de entregas configurados correctamente');
    console.log('\n⚠️  IMPORTANTE: Debes cerrar sesión y volver a iniciar sesión para que los nuevos permisos se apliquen.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

addEntregasPermisos();
