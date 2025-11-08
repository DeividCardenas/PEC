const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedOrdenesCompra() {
  try {
    console.log('🌱 Creando órdenes de compra de prueba...\n');

    // Obtener proveedores existentes
    const proveedores = await prisma.proveedor.findMany();
    if (proveedores.length === 0) {
      console.log('⚠️  No hay proveedores en la base de datos. Por favor ejecuta primero seed_proveedores_pasto.js');
      return;
    }

    // Obtener productos existentes
    const productos = await prisma.producto.findMany({
      take: 20
    });
    if (productos.length === 0) {
      console.log('⚠️  No hay productos en la base de datos. No se pueden crear órdenes.');
      return;
    }

    // Obtener usuarios existentes
    const usuarios = await prisma.usuario.findMany();
    if (usuarios.length === 0) {
      console.log('⚠️  No hay usuarios en la base de datos. Por favor ejecuta primero seed_users.js');
      return;
    }

    const adminUser = usuarios.find(u => u.email === 'admin@pec.com');
    const farmaceuticoUser = usuarios.find(u => u.email === 'farmaceutico@pec.com');
    const creadorPorDefecto = adminUser || usuarios[0];
    const aprobadorPorDefecto = farmaceuticoUser || usuarios[1] || usuarios[0];

    console.log(`👤 Usuario creador: ${creadorPorDefecto.email}`);
    console.log(`👤 Usuario aprobador: ${aprobadorPorDefecto.email}\n`);

    // Generar órdenes de compra
    const ordenes = [];
    const estadosPosibles = ['pendiente', 'aprobada', 'en_proceso', 'completada', 'rechazada'];

    for (let i = 1; i <= 15; i++) {
      const proveedor = proveedores[Math.floor(Math.random() * proveedores.length)];
      const estado = estadosPosibles[Math.floor(Math.random() * estadosPosibles.length)];

      // Fecha de orden (últimos 60 días)
      const diasAtras = Math.floor(Math.random() * 60);
      const fechaOrden = new Date();
      fechaOrden.setDate(fechaOrden.getDate() - diasAtras);

      // Fecha de entrega estimada (7-30 días después de la orden)
      const fechaEntrega = new Date(fechaOrden);
      fechaEntrega.setDate(fechaEntrega.getDate() + Math.floor(Math.random() * 23) + 7);

      const orden = {
        numero_orden: `OC-2024-${String(i).padStart(4, '0')}`,
        id_proveedor: proveedor.id_proveedor,
        id_creado_por: creadorPorDefecto.id_usuario,
        fecha_orden: fechaOrden,
        fecha_entrega_estimada: fechaEntrega,
        estado: estado,
        notas: `Orden de compra ${i} para reposición de inventario`,
      };

      // Si está aprobada, rechazada o completada, agregar datos adicionales
      if (estado !== 'pendiente') {
        orden.id_aprobado_por = aprobadorPorDefecto.id_usuario;
        orden.fecha_aprobacion = new Date(fechaOrden.getTime() + 24 * 60 * 60 * 1000); // 1 día después
      }

      if (estado === 'rechazada') {
        orden.motivo_rechazo = 'Precios no competitivos en el mercado actual';
      }

      ordenes.push(orden);
    }

    let created = 0;
    let createdDetails = 0;

    for (const ordenData of ordenes) {
      // Verificar si ya existe
      const existingOrden = await prisma.ordenCompra.findUnique({
        where: { numero_orden: ordenData.numero_orden }
      });

      if (!existingOrden) {
        // Crear la orden sin totales (se calcularán después)
        const orden = await prisma.ordenCompra.create({
          data: {
            ...ordenData,
            subtotal: 0,
            impuestos: 0,
            total: 0,
          }
        });

        // Agregar entre 2 y 8 productos a la orden
        const numProductos = Math.floor(Math.random() * 7) + 2;
        const productosSeleccionados = [];

        for (let j = 0; j < numProductos; j++) {
          const producto = productos[Math.floor(Math.random() * productos.length)];

          // Evitar duplicados en la misma orden
          if (productosSeleccionados.find(p => p.id_producto === producto.id_producto)) {
            continue;
          }

          const cantidad = Math.floor(Math.random() * 50) + 10; // Entre 10 y 60 unidades
          const precioUnitario = Number(producto.precio_unidad);
          const subtotal = cantidad * precioUnitario;

          await prisma.detalleOrdenCompra.create({
            data: {
              id_orden_compra: orden.id_orden_compra,
              id_producto: producto.id_producto,
              cantidad: cantidad,
              precio_unitario: precioUnitario,
              subtotal: subtotal,
            }
          });

          productosSeleccionados.push(producto);
          createdDetails++;
        }

        // Calcular totales
        const detalles = await prisma.detalleOrdenCompra.findMany({
          where: { id_orden_compra: orden.id_orden_compra }
        });

        const subtotal = detalles.reduce((sum, d) => sum + Number(d.subtotal), 0);
        const impuestos = subtotal * 0.19; // IVA 19% en Colombia
        const total = subtotal + impuestos;

        // Actualizar la orden con los totales
        await prisma.ordenCompra.update({
          where: { id_orden_compra: orden.id_orden_compra },
          data: {
            subtotal: subtotal,
            impuestos: impuestos,
            total: total,
          }
        });

        // Crear registro en historial
        await prisma.historialOrdenCompra.create({
          data: {
            id_orden_compra: orden.id_orden_compra,
            estado_anterior: null,
            estado_nuevo: ordenData.estado,
            tipo_cambio: 'estado',
            id_usuario: creadorPorDefecto.id_usuario,
            comentario: 'Orden de compra creada',
          }
        });

        console.log(`✅ ${orden.numero_orden} - ${ordenData.estado.toUpperCase()} - ${productosSeleccionados.length} productos - $${total.toLocaleString('es-CO')}`);
        created++;
      } else {
        console.log(`⚠️  Ya existe: ${ordenData.numero_orden}`);
      }
    }

    console.log('\n🎉 Seed de órdenes de compra completado!');
    console.log(`✅ Órdenes creadas: ${created}`);
    console.log(`📦 Detalles creados: ${createdDetails}`);
    console.log(`📍 Todas las órdenes son de proveedores de Pasto, Colombia\n`);

    // Mostrar resumen por estado
    const resumen = await prisma.ordenCompra.groupBy({
      by: ['estado'],
      _count: {
        id_orden_compra: true
      }
    });

    console.log('📊 Resumen por estado:');
    resumen.forEach(r => {
      console.log(`   ${r.estado}: ${r._count.id_orden_compra} órdenes`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedOrdenesCompra();
