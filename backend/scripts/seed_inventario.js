const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedInventario() {
  try {
    console.log('🌱 Actualizando productos con datos de inventario...\n');

    // Obtener todos los productos existentes
    const productos = await prisma.producto.findMany();

    if (productos.length === 0) {
      console.log('⚠️  No hay productos en la base de datos. Por favor ejecuta primero el seed principal.');
      return;
    }

    console.log(`📦 Encontrados ${productos.length} productos para actualizar\n`);

    let updated = 0;

    for (const producto of productos) {
      // Generar valores de inventario aleatorios pero realistas
      const stock_minimo = Math.floor(Math.random() * 50) + 10; // Entre 10 y 60
      const stock_maximo = stock_minimo + Math.floor(Math.random() * 200) + 50; // Entre stock_minimo+50 y stock_minimo+250

      // El 30% de productos tendrán stock bajo (para generar alertas)
      let stock_actual;
      if (Math.random() < 0.3) {
        // Stock bajo o crítico (0 a stock_minimo)
        stock_actual = Math.floor(Math.random() * stock_minimo);
      } else {
        // Stock normal (entre stock_minimo y stock_maximo)
        stock_actual = stock_minimo + Math.floor(Math.random() * (stock_maximo - stock_minimo));
      }

      await prisma.producto.update({
        where: { id_producto: producto.id_producto },
        data: {
          stock_actual,
          stock_minimo,
          stock_maximo,
          unidad_medida: 'unidad', // Todas las unidades en "unidad" por simplicidad
        }
      });

      updated++;

      if (updated % 50 === 0) {
        console.log(`✅ Actualizados ${updated} productos...`);
      }
    }

    console.log(`\n✅ Total de productos actualizados: ${updated}`);

    // Crear algunos movimientos de inventario de ejemplo
    console.log('\n🔄 Creando movimientos de inventario de ejemplo...\n');

    // Obtener un usuario existente para los movimientos
    const usuarios = await prisma.usuario.findMany({ take: 1 });
    const usuarioId = usuarios.length > 0 ? usuarios[0].id_usuario : null;

    // Tomar una muestra de productos para crear movimientos
    const productosParaMovimientos = productos.slice(0, Math.min(20, productos.length));
    let movimientosCreados = 0;

    for (const producto of productosParaMovimientos) {
      // Obtener el producto actualizado con los nuevos valores de stock
      const productoActualizado = await prisma.producto.findUnique({
        where: { id_producto: producto.id_producto }
      });

      if (!productoActualizado) continue;

      // Crear 2-5 movimientos por producto
      const numMovimientos = Math.floor(Math.random() * 4) + 2;

      for (let i = 0; i < numMovimientos; i++) {
        const tiposMovimiento = ['entrada', 'salida', 'ajuste', 'devolucion'];
        const tipo_movimiento = tiposMovimiento[Math.floor(Math.random() * tiposMovimiento.length)];

        // Cantidad del movimiento
        let cantidad;
        if (tipo_movimiento === 'entrada' || tipo_movimiento === 'devolucion') {
          cantidad = Math.floor(Math.random() * 50) + 5; // Positivo para entradas
        } else {
          cantidad = -(Math.floor(Math.random() * 20) + 1); // Negativo para salidas
        }

        // Simular stock anterior
        const stock_anterior = Math.max(0, productoActualizado.stock_actual - cantidad);
        const stock_nuevo = productoActualizado.stock_actual;

        // Fecha del movimiento (últimos 30 días)
        const diasAtras = Math.floor(Math.random() * 30);
        const fechaMovimiento = new Date();
        fechaMovimiento.setDate(fechaMovimiento.getDate() - diasAtras);

        const motivos = {
          entrada: 'Recepción de orden de compra',
          salida: 'Dispensación a paciente',
          ajuste: 'Ajuste por inventario físico',
          devolucion: 'Devolución de producto no conforme'
        };

        await prisma.movimientoInventario.create({
          data: {
            id_producto: producto.id_producto,
            tipo_movimiento,
            cantidad,
            stock_anterior,
            stock_nuevo,
            id_usuario: usuarioId,
            motivo: motivos[tipo_movimiento],
            creado_en: fechaMovimiento,
          }
        });

        movimientosCreados++;
      }
    }

    console.log(`✅ Movimientos de inventario creados: ${movimientosCreados}`);

    // Mostrar estadísticas finales
    console.log('\n📊 ESTADÍSTICAS DE INVENTARIO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const totalProductos = await prisma.producto.count();
    console.log(`📦 Total de productos: ${totalProductos}`);

    const productosConStock = await prisma.producto.count({
      where: { stock_actual: { gt: 0 } }
    });
    console.log(`✅ Productos con stock: ${productosConStock}`);

    const productosSinStock = await prisma.producto.count({
      where: { stock_actual: 0 }
    });
    console.log(`⚠️  Productos sin stock: ${productosSinStock}`);

    // Productos con stock bajo (usando queryRaw para comparar dos columnas)
    const productosStockBajoResult = await prisma.$queryRaw`
      SELECT COUNT(*) as total
      FROM producto
      WHERE stock_actual <= stock_minimo
    `;
    const productosStockBajo = Number(productosStockBajoResult[0]?.total || 0);
    console.log(`🔴 Productos con stock bajo: ${productosStockBajo}`);

    const totalMovimientos = await prisma.movimientoInventario.count();
    console.log(`🔄 Total de movimientos: ${totalMovimientos}`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✨ ¡Seed de inventario completado exitosamente!\n');

  } catch (error) {
    console.error('❌ Error al crear datos de inventario:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el seed
seedInventario()
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });