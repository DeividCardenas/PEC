const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedInventarioSimple() {
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

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✨ ¡Seed de inventario completado exitosamente!\n');
    console.log('💡 NOTA: Las tablas de movimientos de inventario no existen aún.');
    console.log('   Para crearlas, ejecuta las migraciones de Prisma.\n');

  } catch (error) {
    console.error('❌ Error al crear datos de inventario:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el seed
seedInventarioSimple()
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });