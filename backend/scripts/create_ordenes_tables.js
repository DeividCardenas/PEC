const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createOrdenesTables() {
  try {
    console.log('Creando tablas de órdenes de compra...\n');

    // 1. Crear tabla ordenes_compra
    console.log('1. Creando tabla ordenes_compra...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS ordenes_compra (
        id_orden_compra INT AUTO_INCREMENT PRIMARY KEY,
        numero_orden VARCHAR(191) UNIQUE NOT NULL,
        proveedor_id INT NOT NULL,
        creado_por INT NOT NULL,
        aprobado_por INT,
        fecha_orden DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        fecha_entrega_estimada DATETIME(3),
        fecha_aprobacion DATETIME(3),
        estado VARCHAR(191) DEFAULT 'pendiente',
        subtotal DECIMAL(65, 30) DEFAULT 0,
        impuestos DECIMAL(65, 30) DEFAULT 0,
        total DECIMAL(65, 30) DEFAULT 0,
        notas TEXT,
        motivo_rechazo TEXT,
        creado_en DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        actualizado_en DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        FOREIGN KEY (proveedor_id) REFERENCES proveedores(id_proveedor) ON DELETE CASCADE,
        FOREIGN KEY (creado_por) REFERENCES usuario(id_usuario),
        FOREIGN KEY (aprobado_por) REFERENCES usuario(id_usuario),
        INDEX idx_estado (estado),
        INDEX idx_proveedor (proveedor_id),
        INDEX idx_fecha_orden (fecha_orden)
      )
    `);
    console.log('✓ Tabla ordenes_compra creada\n');

    // 2. Crear tabla detalles_orden_compra
    console.log('2. Creando tabla detalles_orden_compra...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS detalles_orden_compra (
        id_detalle INT AUTO_INCREMENT PRIMARY KEY,
        orden_compra_id INT NOT NULL,
        producto_id INT NOT NULL,
        cantidad INT NOT NULL,
        precio_unitario DECIMAL(65, 30) NOT NULL,
        subtotal DECIMAL(65, 30) NOT NULL,
        creado_en DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        actualizado_en DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        FOREIGN KEY (orden_compra_id) REFERENCES ordenes_compra(id_orden_compra) ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES Producto(id_producto),
        INDEX idx_orden (orden_compra_id),
        INDEX idx_producto (producto_id)
      )
    `);
    console.log('✓ Tabla detalles_orden_compra creada\n');

    // 3. Crear tabla historial_ordenes_compra
    console.log('3. Creando tabla historial_ordenes_compra...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS historial_ordenes_compra (
        id_historial INT AUTO_INCREMENT PRIMARY KEY,
        orden_compra_id INT NOT NULL,
        estado_anterior VARCHAR(191),
        estado_nuevo VARCHAR(191) NOT NULL,
        tipo_cambio VARCHAR(191) DEFAULT 'estado',
        usuario_id INT,
        comentario TEXT,
        campos_modificados TEXT,
        creado_en DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        FOREIGN KEY (orden_compra_id) REFERENCES ordenes_compra(id_orden_compra) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario),
        INDEX idx_orden (orden_compra_id),
        INDEX idx_fecha (creado_en)
      )
    `);
    console.log('✓ Tabla historial_ordenes_compra creada\n');

    console.log('🎉 Todas las tablas de órdenes de compra creadas exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createOrdenesTables();
