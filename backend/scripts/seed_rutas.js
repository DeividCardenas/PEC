const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedRutas() {
  try {
    console.log('🗺️  Creando rutas de prueba...\n');

    // Obtener domiciliarios disponibles
    const domiciliarios = await prisma.domiciliario.findMany({
      where: { activo: true }
    });

    if (domiciliarios.length === 0) {
      console.log('❌ No hay domiciliarios en la base de datos. Ejecuta seed_domiciliarios.js primero.');
      return;
    }

    console.log(`✓ Encontrados ${domiciliarios.length} domiciliarios\n`);

    // Obtener entregas disponibles para asignar a rutas
    const entregasDisponibles = await prisma.entrega.findMany({
      where: {
        estado: {
          in: ['Pendiente de Despacho', 'Despachado', 'En Preparación']
        },
        activo: true
      },
      orderBy: {
        fecha_pedido: 'asc'
      }
    });

    if (entregasDisponibles.length === 0) {
      console.log('❌ No hay entregas disponibles. Ejecuta seed_entregas.js primero.');
      return;
    }

    console.log(`✓ Encontradas ${entregasDisponibles.length} entregas disponibles\n`);

    // Obtener usuario administrador para crear las rutas
    const usuarioCreador = await prisma.usuario.findFirst({
      where: { username: 'admin' }
    });

    if (!usuarioCreador) {
      console.log('❌ No se encontró el usuario administrador.');
      return;
    }

    console.log(`✓ Usuario creador: ${usuarioCreador.username}\n`);

    // Crear rutas con diferentes estados
    const rutas = [];

    // Ruta 1: Completada - 3 entregas, zona norte
    rutas.push({
      numero_ruta: `RUTA-2024-${String(1).padStart(4, '0')}`,
      id_domiciliario: domiciliarios[0].id_domiciliario,
      id_usuario_creador: usuarioCreador.id_usuario,
      fecha_creacion_ruta: new Date('2024-11-10T08:00:00'),
      fecha_programada: new Date('2024-11-12T09:00:00'),
      fecha_inicio: new Date('2024-11-12T09:15:00'),
      fecha_finalizacion: new Date('2024-11-12T12:30:00'),
      estado: 'Completada',
      distancia_total_km: '15.8',
      tiempo_estimado_min: 90,
      observaciones: 'Ruta completada sin novedad',
      activo: true,
      entregas_ids: entregasDisponibles.slice(0, 3).map(e => e.id_entrega)
    });

    // Ruta 2: En Curso - 2 entregas
    rutas.push({
      numero_ruta: `RUTA-2024-${String(2).padStart(4, '0')}`,
      id_domiciliario: domiciliarios[1]?.id_domiciliario || domiciliarios[0].id_domiciliario,
      id_usuario_creador: usuarioCreador.id_usuario,
      fecha_creacion_ruta: new Date('2024-11-14T07:30:00'),
      fecha_programada: new Date('2024-11-14T10:00:00'),
      fecha_inicio: new Date('2024-11-14T10:05:00'),
      estado: 'En Curso',
      distancia_total_km: '8.5',
      tiempo_estimado_min: 45,
      observaciones: 'Ruta en progreso - zona centro',
      activo: true,
      entregas_ids: entregasDisponibles.slice(3, 5).map(e => e.id_entrega)
    });

    // Ruta 3: Pendiente - 4 entregas
    rutas.push({
      numero_ruta: `RUTA-2024-${String(3).padStart(4, '0')}`,
      id_domiciliario: domiciliarios[2]?.id_domiciliario || domiciliarios[0].id_domiciliario,
      id_usuario_creador: usuarioCreador.id_usuario,
      fecha_creacion_ruta: new Date('2024-11-14T09:00:00'),
      fecha_programada: new Date('2024-11-15T08:00:00'),
      estado: 'Pendiente',
      distancia_total_km: '12.3',
      tiempo_estimado_min: 75,
      observaciones: 'Ruta programada para mañana - zona sur',
      activo: true,
      entregas_ids: entregasDisponibles.slice(5, 8).length > 0
        ? entregasDisponibles.slice(5, 8).map(e => e.id_entrega)
        : [entregasDisponibles[0].id_entrega]
    });

    // Ruta 4: Cancelada
    rutas.push({
      numero_ruta: `RUTA-2024-${String(4).padStart(4, '0')}`,
      id_domiciliario: null,
      id_usuario_creador: usuarioCreador.id_usuario,
      fecha_creacion_ruta: new Date('2024-11-11T14:00:00'),
      fecha_programada: new Date('2024-11-13T10:00:00'),
      estado: 'Cancelada',
      distancia_total_km: '6.2',
      tiempo_estimado_min: 40,
      observaciones: 'Ruta cancelada por condiciones climáticas',
      motivo_cancelacion: 'Lluvia intensa en la zona - imposible realizar entregas',
      activo: false,
      entregas_ids: []
    });

    // Ruta 5: Pendiente - sin domiciliario asignado
    rutas.push({
      numero_ruta: `RUTA-2024-${String(5).padStart(4, '0')}`,
      id_domiciliario: null,
      id_usuario_creador: usuarioCreador.id_usuario,
      fecha_creacion_ruta: new Date('2024-11-14T11:00:00'),
      fecha_programada: new Date('2024-11-16T09:00:00'),
      estado: 'Pendiente',
      distancia_total_km: '9.7',
      tiempo_estimado_min: 60,
      observaciones: 'Esperando asignación de domiciliario',
      activo: true,
      entregas_ids: entregasDisponibles.slice(0, 2).map(e => e.id_entrega)
    });

    // Crear cada ruta en la base de datos
    for (const [index, rutaData] of rutas.entries()) {
      const { entregas_ids, ...dataRuta } = rutaData;

      // Crear la ruta
      const ruta = await prisma.ruta.upsert({
        where: { numero_ruta: rutaData.numero_ruta },
        update: dataRuta,
        create: dataRuta
      });

      console.log(`✓ Ruta: ${ruta.numero_ruta} - Estado: ${ruta.estado} - Distancia: ${ruta.distancia_total_km || 'N/A'} km`);

      // Asignar entregas a la ruta si tiene entregas
      if (entregas_ids && entregas_ids.length > 0) {
        for (let i = 0; i < entregas_ids.length; i++) {
          try {
            await prisma.entrega.update({
              where: { id_entrega: entregas_ids[i] },
              data: {
                id_ruta: ruta.id_ruta,
                orden_en_ruta: i + 1,
                estado: ruta.estado === 'Completada' ? 'Entregado' :
                        ruta.estado === 'En Curso' ? 'Despachado' :
                        'Pendiente de Despacho'
              }
            });
          } catch (error) {
            // Si la entrega ya está asignada, continuar
            console.log(`  ⚠ Entrega ${entregas_ids[i]} ya asignada a otra ruta`);
          }
        }
        console.log(`  → Asignadas ${entregas_ids.length} entregas a la ruta`);
      }
    }

    // Actualizar disponibilidad de domiciliarios
    // Los que tienen rutas en curso no están disponibles
    for (const domiciliario of domiciliarios) {
      const rutasEnCurso = await prisma.ruta.count({
        where: {
          id_domiciliario: domiciliario.id_domiciliario,
          estado: 'En Curso'
        }
      });

      if (rutasEnCurso > 0) {
        await prisma.domiciliario.update({
          where: { id_domiciliario: domiciliario.id_domiciliario },
          data: { disponible: false }
        });
        console.log(`✓ Domiciliario ${domiciliario.nombres} marcado como ocupado`);
      }
    }

    const count = await prisma.ruta.count();
    console.log(`\n✅ Total de rutas en BD: ${count}`);

    // Mostrar estadísticas
    const estadisticas = await prisma.ruta.groupBy({
      by: ['estado'],
      _count: {
        id_ruta: true
      }
    });

    console.log('\n📊 Rutas por estado:');
    estadisticas.forEach(stat => {
      console.log(`   ${stat.estado}: ${stat._count.id_ruta}`);
    });

  } catch (error) {
    console.error('❌ Error al crear rutas:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

seedRutas();
