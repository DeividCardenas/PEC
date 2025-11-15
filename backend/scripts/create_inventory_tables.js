const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createInventoryTables() {
  try {
    console.log('📋 Creando tablas de inventario...\n');

    // Crear tabla de movimientos de inventario si no existe
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`movimientos_inventario\` (
        \`id_movimiento\` INT NOT NULL AUTO_INCREMENT,
        \`producto_id\` INT NOT NULL,
        \`tipo_movimiento\` VARCHAR(191) NOT NULL,
        \`cantidad\` INT NOT NULL,
        \`stock_anterior\` INT NOT NULL,
        \`stock_nuevo\` INT NOT NULL,
        \`orden_compra_id\` INT NULL,
        \`usuario_id\` INT NULL,
        \`motivo\` TEXT NULL,
        \`numero_referencia\` VARCHAR(191) NULL,
        \`creado_en\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id_movimiento\`),
        INDEX \`movimientos_inventario_producto_id_idx\` (\`producto_id\`),
        INDEX \`movimientos_inventario_usuario_id_idx\` (\`usuario_id\`),
        INDEX \`movimientos_inventario_orden_compra_id_idx\` (\`orden_compra_id\`),
        CONSTRAINT \`movimientos_inventario_producto_id_fkey\` FOREIGN KEY (\`producto_id\`) REFERENCES \`producto\` (\`id_producto\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`movimientos_inventario_usuario_id_fkey\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuario\` (\`id_usuario\`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT \`movimientos_inventario_orden_compra_id_fkey\` FOREIGN KEY (\`orden_compra_id\`) REFERENCES \`ordenes_compra\` (\`id_orden_compra\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    console.log('✅ Tabla movimientos_inventario creada exitosamente');

    // Crear otras tablas del sistema si no existen

    // Tabla de pacientes
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`pacientes\` (
        \`id_paciente\` INT NOT NULL AUTO_INCREMENT,
        \`tipo_identificacion\` VARCHAR(20) NOT NULL,
        \`numero_identificacion\` VARCHAR(191) NOT NULL,
        \`nombres\` VARCHAR(100) NOT NULL,
        \`apellidos\` VARCHAR(100) NOT NULL,
        \`fecha_nacimiento\` DATETIME(3) NULL,
        \`genero\` VARCHAR(20) NULL,
        \`telefono_principal\` VARCHAR(20) NOT NULL,
        \`telefono_secundario\` VARCHAR(20) NULL,
        \`email\` VARCHAR(100) NULL,
        \`direccion\` VARCHAR(255) NOT NULL,
        \`ciudad\` VARCHAR(100) NOT NULL,
        \`departamento\` VARCHAR(100) NOT NULL,
        \`codigo_postal\` VARCHAR(20) NULL,
        \`barrio\` VARCHAR(100) NULL,
        \`eps\` VARCHAR(100) NULL,
        \`tipo_afiliacion\` VARCHAR(50) NULL,
        \`observaciones\` TEXT NULL,
        \`activo\` BOOLEAN NOT NULL DEFAULT true,
        \`fecha_creacion\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`fecha_actualizacion\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id_paciente\`),
        UNIQUE INDEX \`pacientes_numero_identificacion_key\` (\`numero_identificacion\`),
        INDEX \`pacientes_numero_identificacion_idx\` (\`numero_identificacion\`),
        INDEX \`pacientes_nombres_apellidos_idx\` (\`nombres\`, \`apellidos\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    console.log('✅ Tabla pacientes creada exitosamente');

    // Tabla de domiciliarios
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`domiciliarios\` (
        \`id_domiciliario\` INT NOT NULL AUTO_INCREMENT,
        \`nombres\` VARCHAR(100) NOT NULL,
        \`apellidos\` VARCHAR(100) NOT NULL,
        \`numero_identificacion\` VARCHAR(191) NOT NULL,
        \`telefono\` VARCHAR(20) NOT NULL,
        \`email\` VARCHAR(100) NULL,
        \`tipo_vehiculo\` VARCHAR(50) NULL,
        \`placa_vehiculo\` VARCHAR(20) NULL,
        \`activo\` BOOLEAN NOT NULL DEFAULT true,
        \`disponible\` BOOLEAN NOT NULL DEFAULT true,
        \`latitud_actual\` DECIMAL(10, 8) NULL,
        \`longitud_actual\` DECIMAL(11, 8) NULL,
        \`ultima_actualizacion_ubicacion\` DATETIME(3) NULL,
        \`observaciones\` TEXT NULL,
        \`fecha_creacion\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`fecha_actualizacion\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id_domiciliario\`),
        UNIQUE INDEX \`domiciliarios_numero_identificacion_key\` (\`numero_identificacion\`),
        INDEX \`domiciliarios_numero_identificacion_idx\` (\`numero_identificacion\`),
        INDEX \`domiciliarios_activo_disponible_idx\` (\`activo\`, \`disponible\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    console.log('✅ Tabla domiciliarios creada exitosamente');

    // Tabla de rutas
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`rutas\` (
        \`id_ruta\` INT NOT NULL AUTO_INCREMENT,
        \`numero_ruta\` VARCHAR(50) NOT NULL,
        \`domiciliario_id\` INT NULL,
        \`usuario_creador_id\` INT NOT NULL,
        \`fecha_creacion_ruta\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`fecha_programada\` DATETIME(3) NULL,
        \`fecha_inicio\` DATETIME(3) NULL,
        \`fecha_finalizacion\` DATETIME(3) NULL,
        \`estado\` VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
        \`distancia_total_km\` DECIMAL(10, 2) NULL,
        \`tiempo_estimado_min\` INT NULL,
        \`observaciones\` TEXT NULL,
        \`motivo_cancelacion\` TEXT NULL,
        \`activo\` BOOLEAN NOT NULL DEFAULT true,
        \`fecha_creacion\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`fecha_actualizacion\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id_ruta\`),
        UNIQUE INDEX \`rutas_numero_ruta_key\` (\`numero_ruta\`),
        INDEX \`rutas_numero_ruta_idx\` (\`numero_ruta\`),
        INDEX \`rutas_domiciliario_id_idx\` (\`domiciliario_id\`),
        INDEX \`rutas_estado_idx\` (\`estado\`),
        INDEX \`rutas_fecha_programada_idx\` (\`fecha_programada\`),
        CONSTRAINT \`rutas_domiciliario_id_fkey\` FOREIGN KEY (\`domiciliario_id\`) REFERENCES \`domiciliarios\` (\`id_domiciliario\`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT \`rutas_usuario_creador_id_fkey\` FOREIGN KEY (\`usuario_creador_id\`) REFERENCES \`usuario\` (\`id_usuario\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    console.log('✅ Tabla rutas creada exitosamente');

    // Tabla de entregas
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`entregas\` (
        \`id_entrega\` INT NOT NULL AUTO_INCREMENT,
        \`numero_pedido\` VARCHAR(50) NOT NULL,
        \`paciente_id\` INT NOT NULL,
        \`fecha_pedido\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`fecha_entrega_programada\` DATETIME(3) NULL,
        \`fecha_entrega_real\` DATETIME(3) NULL,
        \`estado\` VARCHAR(50) NOT NULL DEFAULT 'Pendiente de Despacho',
        \`direccion_entrega\` VARCHAR(255) NOT NULL,
        \`ciudad_entrega\` VARCHAR(100) NOT NULL,
        \`departamento_entrega\` VARCHAR(100) NOT NULL,
        \`barrio_entrega\` VARCHAR(100) NULL,
        \`observaciones_direccion\` TEXT NULL,
        \`observaciones\` TEXT NULL,
        \`observaciones_despacho\` TEXT NULL,
        \`usuario_creador_id\` INT NOT NULL,
        \`usuario_despachador_id\` INT NULL,
        \`total\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        \`activo\` BOOLEAN NOT NULL DEFAULT true,
        \`ruta_id\` INT NULL,
        \`orden_en_ruta\` INT NULL,
        \`firma_entrega\` VARCHAR(255) NULL,
        \`foto_entrega\` VARCHAR(255) NULL,
        \`nombre_receptor\` VARCHAR(200) NULL,
        \`identificacion_receptor\` VARCHAR(50) NULL,
        \`observaciones_entrega\` TEXT NULL,
        \`fecha_confirmacion_entrega\` DATETIME(3) NULL,
        \`fecha_creacion\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`fecha_actualizacion\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id_entrega\`),
        UNIQUE INDEX \`entregas_numero_pedido_key\` (\`numero_pedido\`),
        INDEX \`entregas_numero_pedido_idx\` (\`numero_pedido\`),
        INDEX \`entregas_paciente_id_idx\` (\`paciente_id\`),
        INDEX \`entregas_estado_idx\` (\`estado\`),
        INDEX \`entregas_fecha_pedido_idx\` (\`fecha_pedido\`),
        INDEX \`entregas_ruta_id_idx\` (\`ruta_id\`),
        CONSTRAINT \`entregas_paciente_id_fkey\` FOREIGN KEY (\`paciente_id\`) REFERENCES \`pacientes\` (\`id_paciente\`) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`entregas_usuario_creador_id_fkey\` FOREIGN KEY (\`usuario_creador_id\`) REFERENCES \`usuario\` (\`id_usuario\`) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`entregas_usuario_despachador_id_fkey\` FOREIGN KEY (\`usuario_despachador_id\`) REFERENCES \`usuario\` (\`id_usuario\`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT \`entregas_ruta_id_fkey\` FOREIGN KEY (\`ruta_id\`) REFERENCES \`rutas\` (\`id_ruta\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    console.log('✅ Tabla entregas creada exitosamente');

    // Tabla de detalles de entrega
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`detalles_entrega\` (
        \`id_detalle_entrega\` INT NOT NULL AUTO_INCREMENT,
        \`entrega_id\` INT NOT NULL,
        \`producto_id\` INT NOT NULL,
        \`cantidad\` INT NOT NULL,
        \`precio_unitario\` DECIMAL(10, 2) NOT NULL,
        \`subtotal\` DECIMAL(12, 2) NOT NULL,
        \`observaciones\` TEXT NULL,
        \`fecha_creacion\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`fecha_actualizacion\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id_detalle_entrega\`),
        INDEX \`detalles_entrega_entrega_id_idx\` (\`entrega_id\`),
        INDEX \`detalles_entrega_producto_id_idx\` (\`producto_id\`),
        CONSTRAINT \`detalles_entrega_entrega_id_fkey\` FOREIGN KEY (\`entrega_id\`) REFERENCES \`entregas\` (\`id_entrega\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`detalles_entrega_producto_id_fkey\` FOREIGN KEY (\`producto_id\`) REFERENCES \`producto\` (\`id_producto\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    console.log('✅ Tabla detalles_entrega creada exitosamente');

    console.log('\n✨ Todas las tablas de inventario y entregas fueron creadas exitosamente!\n');

  } catch (error) {
    console.error('❌ Error al crear tablas:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createInventoryTables()
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
