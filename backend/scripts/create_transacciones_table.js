const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTransaccionesTable() {
  try {
    console.log('Creando tabla transacciones...');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS transacciones (
        id_transaccion INT AUTO_INCREMENT PRIMARY KEY,
        proveedor_id INT NOT NULL,
        tipo VARCHAR(191) NOT NULL,
        concepto VARCHAR(191) NOT NULL,
        monto DECIMAL(65, 30) NOT NULL,
        cantidad INT,
        numero_factura VARCHAR(191),
        fecha_emision DATE,
        fecha_vencimiento DATE,
        estado VARCHAR(191) DEFAULT 'pendiente',
        notas TEXT,
        fecha_creacion DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        fecha_actualizacion DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        FOREIGN KEY (proveedor_id) REFERENCES proveedores(id_proveedor) ON DELETE CASCADE
      )
    `);

    console.log('✓ Tabla transacciones creada exitosamente');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTransaccionesTable();
