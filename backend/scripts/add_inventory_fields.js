const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addInventoryFields() {
  try {
    console.log('Agregando campos de inventario a la tabla Producto...');

    // Verificar qué columnas existen
    const columns = await prisma.$queryRawUnsafe(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'PEC'
        AND TABLE_NAME = 'Producto'
        AND COLUMN_NAME IN ('stock_actual', 'stock_minimo', 'stock_maximo', 'unidad_medida')
    `);

    const existingColumns = new Set(columns.map(col => col.COLUMN_NAME));
    console.log('Columnas existentes:', existingColumns);

    if (!existingColumns.has('stock_actual')) {
      await prisma.$executeRawUnsafe(`ALTER TABLE Producto ADD COLUMN stock_actual INT NOT NULL DEFAULT 0`);
      console.log('✓ stock_actual agregado');
    } else {
      console.log('- stock_actual ya existe');
    }

    if (!existingColumns.has('stock_minimo')) {
      await prisma.$executeRawUnsafe(`ALTER TABLE Producto ADD COLUMN stock_minimo INT NOT NULL DEFAULT 0`);
      console.log('✓ stock_minimo agregado');
    } else {
      console.log('- stock_minimo ya existe');
    }

    if (!existingColumns.has('stock_maximo')) {
      await prisma.$executeRawUnsafe(`ALTER TABLE Producto ADD COLUMN stock_maximo INT NULL`);
      console.log('✓ stock_maximo agregado');
    } else {
      console.log('- stock_maximo ya existe');
    }

    if (!existingColumns.has('unidad_medida')) {
      await prisma.$executeRawUnsafe(`ALTER TABLE Producto ADD COLUMN unidad_medida VARCHAR(191) NOT NULL DEFAULT 'unidad'`);
      console.log('✓ unidad_medida agregado');
    } else {
      console.log('- unidad_medida ya existe');
    }

    console.log('\n✓ Campos de inventario procesados exitosamente');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addInventoryFields();
