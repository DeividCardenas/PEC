const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createProveedoresTable() {
  try {
    console.log('Creando tabla proveedores...');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS proveedores (
        id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(191) NOT NULL,
        laboratorio VARCHAR(191),
        tipo VARCHAR(191),
        titular VARCHAR(191),
        direccion VARCHAR(191),
        telefono VARCHAR(191),
        email VARCHAR(191),
        nit VARCHAR(191) UNIQUE,
        ciudad VARCHAR(191),
        pais VARCHAR(191),
        activo BOOLEAN DEFAULT TRUE,
        notas TEXT,
        creado_en DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        actualizado_en DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      )
    `);

    console.log('✓ Tabla proveedores creada exitosamente');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createProveedoresTable();
