const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedEntregas() {
  try {
    console.log('📦 Creando entregas de prueba...\n');

    // Obtener pacientes e IDs de usuarios
    const pacientes = await prisma.paciente.findMany({ take: 8 });

    if (pacientes.length === 0) {
      console.log('❌ No hay pacientes en la base de datos. Ejecuta seed_pacientes.js primero.');
      return;
    }

    console.log(`✓ Encontrados ${pacientes.length} pacientes\n`);

    // Crear entregas con diferentes estados
    const entregas = [
      {
        numero_pedido: 'ENT-2024-0001',
        id_paciente: pacientes[0].id_paciente,
        fecha_pedido: new Date('2024-11-10T09:00:00'),
        fecha_entrega_programada: new Date('2024-11-15T14:00:00'),
        fecha_entrega_real: new Date('2024-11-15T15:30:00'),
        estado: 'Entregado',
        direccion_entrega: pacientes[0].direccion,
        ciudad_entrega: pacientes[0].ciudad,
        departamento_entrega: pacientes[0].departamento,
        barrio_entrega: pacientes[0].barrio,
        observaciones: 'Entrega de medicamentos mensuales',
        observaciones_despacho: 'Paquete verificado y sellado',
        id_usuario_creador: 1,
        id_usuario_despachador: 2,
        total: 125000.00,
        activo: true,
        nombre_receptor: `${pacientes[0].nombres} ${pacientes[0].apellidos}`,
        identificacion_receptor: pacientes[0].numero_identificacion,
        observaciones_entrega: 'Entregado en buen estado',
        fecha_confirmacion_entrega: new Date('2024-11-15T15:30:00')
      },
      {
        numero_pedido: 'ENT-2024-0002',
        id_paciente: pacientes[1].id_paciente,
        fecha_pedido: new Date('2024-11-12T10:30:00'),
        fecha_entrega_programada: new Date('2024-11-16T10:00:00'),
        estado: 'Despachado',
        direccion_entrega: pacientes[1].direccion,
        ciudad_entrega: pacientes[1].ciudad,
        departamento_entrega: pacientes[1].departamento,
        barrio_entrega: pacientes[1].barrio,
        observaciones: 'Medicamentos refrigerados',
        observaciones_despacho: 'Mantener en cadena de frío',
        id_usuario_creador: 1,
        id_usuario_despachador: 2,
        total: 89500.00,
        activo: true
      },
      {
        numero_pedido: 'ENT-2024-0003',
        id_paciente: pacientes[2].id_paciente,
        fecha_pedido: new Date('2024-11-13T08:15:00'),
        fecha_entrega_programada: new Date('2024-11-17T16:00:00'),
        estado: 'En Preparación',
        direccion_entrega: pacientes[2].direccion,
        ciudad_entrega: pacientes[2].ciudad,
        departamento_entrega: pacientes[2].departamento,
        barrio_entrega: pacientes[2].barrio,
        observaciones: 'Incluye tratamiento especial',
        id_usuario_creador: 2,
        total: 234000.00,
        activo: true
      },
      {
        numero_pedido: 'ENT-2024-0004',
        id_paciente: pacientes[3].id_paciente,
        fecha_pedido: new Date('2024-11-13T11:00:00'),
        fecha_entrega_programada: new Date('2024-11-18T09:00:00'),
        estado: 'Pendiente de Despacho',
        direccion_entrega: pacientes[3].direccion,
        ciudad_entrega: pacientes[3].ciudad,
        departamento_entrega: pacientes[3].departamento,
        barrio_entrega: pacientes[3].barrio,
        observaciones: 'Urgente - Paciente crónico',
        id_usuario_creador: 1,
        total: 156700.00,
        activo: true
      },
      {
        numero_pedido: 'ENT-2024-0005',
        id_paciente: pacientes[4].id_paciente,
        fecha_pedido: new Date('2024-11-08T14:00:00'),
        fecha_entrega_programada: new Date('2024-11-12T11:00:00'),
        fecha_entrega_real: new Date('2024-11-12T10:45:00'),
        estado: 'Entregado',
        direccion_entrega: pacientes[4].direccion,
        ciudad_entrega: pacientes[4].ciudad,
        departamento_entrega: pacientes[4].departamento,
        barrio_entrega: pacientes[4].barrio,
        observaciones: 'Medicamentos controlados',
        observaciones_despacho: 'Requiere firma especial',
        id_usuario_creador: 2,
        id_usuario_despachador: 3,
        total: 445000.00,
        activo: true,
        nombre_receptor: `${pacientes[4].nombres} ${pacientes[4].apellidos}`,
        identificacion_receptor: pacientes[4].numero_identificacion,
        observaciones_entrega: 'Paciente firmó conforme',
        fecha_confirmacion_entrega: new Date('2024-11-12T10:45:00')
      },
      {
        numero_pedido: 'ENT-2024-0006',
        id_paciente: pacientes[5].id_paciente,
        fecha_pedido: new Date('2024-11-11T16:30:00'),
        fecha_entrega_programada: new Date('2024-11-14T15:00:00'),
        estado: 'Cancelado',
        direccion_entrega: pacientes[5].direccion,
        ciudad_entrega: pacientes[5].ciudad,
        departamento_entrega: pacientes[5].departamento,
        barrio_entrega: pacientes[5].barrio,
        observaciones: 'Paciente solicitó cancelación - Ya compró en farmacia',
        id_usuario_creador: 1,
        total: 67500.00,
        activo: false
      },
      {
        numero_pedido: 'ENT-2024-0007',
        id_paciente: pacientes[6].id_paciente,
        fecha_pedido: new Date('2024-11-14T09:00:00'),
        fecha_entrega_programada: new Date('2024-11-19T13:00:00'),
        estado: 'Pendiente de Despacho',
        direccion_entrega: pacientes[6].direccion,
        ciudad_entrega: pacientes[6].ciudad,
        departamento_entrega: pacientes[6].departamento,
        barrio_entrega: pacientes[6].barrio,
        observaciones: 'Entrega regular mensual',
        id_usuario_creador: 2,
        total: 178900.00,
        activo: true
      },
      {
        numero_pedido: 'ENT-2024-0008',
        id_paciente: pacientes[7].id_paciente,
        fecha_pedido: new Date('2024-11-14T11:30:00'),
        fecha_entrega_programada: new Date('2024-11-20T10:00:00'),
        estado: 'En Preparación',
        direccion_entrega: pacientes[7].direccion,
        ciudad_entrega: pacientes[7].ciudad,
        departamento_entrega: pacientes[7].departamento,
        barrio_entrega: pacientes[7].barrio,
        observaciones: 'Primera entrega - Paciente nuevo',
        id_usuario_creador: 1,
        total: 92300.00,
        activo: true
      },
      {
        numero_pedido: 'ENT-2024-0009',
        id_paciente: pacientes[0].id_paciente,
        fecha_pedido: new Date('2024-11-05T10:00:00'),
        fecha_entrega_programada: new Date('2024-11-08T14:00:00'),
        fecha_entrega_real: new Date('2024-11-08T14:20:00'),
        estado: 'Entregado',
        direccion_entrega: pacientes[0].direccion,
        ciudad_entrega: pacientes[0].ciudad,
        departamento_entrega: pacientes[0].departamento,
        barrio_entrega: pacientes[0].barrio,
        observaciones: 'Entrega anterior del mismo paciente',
        observaciones_despacho: 'Todo en orden',
        id_usuario_creador: 1,
        id_usuario_despachador: 2,
        total: 125000.00,
        activo: true,
        nombre_receptor: `${pacientes[0].nombres} ${pacientes[0].apellidos}`,
        identificacion_receptor: pacientes[0].numero_identificacion,
        observaciones_entrega: 'Sin novedad',
        fecha_confirmacion_entrega: new Date('2024-11-08T14:20:00')
      },
      {
        numero_pedido: 'ENT-2024-0010',
        id_paciente: pacientes[1].id_paciente,
        fecha_pedido: new Date('2024-11-14T13:00:00'),
        fecha_entrega_programada: new Date('2024-11-21T11:00:00'),
        estado: 'Despachado',
        direccion_entrega: pacientes[1].direccion,
        ciudad_entrega: pacientes[1].ciudad,
        departamento_entrega: pacientes[1].departamento,
        barrio_entrega: pacientes[1].barrio,
        observaciones: 'Medicamentos de control',
        observaciones_despacho: 'Verificar identidad del receptor',
        id_usuario_creador: 2,
        id_usuario_despachador: 3,
        total: 203450.00,
        activo: true
      }
    ];

    for (const entrega of entregas) {
      const created = await prisma.entrega.upsert({
        where: { numero_pedido: entrega.numero_pedido },
        update: entrega,
        create: entrega
      });
      console.log(`✓ Entrega: ${created.numero_pedido} - Estado: ${created.estado} - Total: $${created.total}`);
    }

    const count = await prisma.entrega.count();
    console.log(`\n✅ Total de entregas en BD: ${count}`);

    // Mostrar resumen por estado
    const estadisticas = await prisma.entrega.groupBy({
      by: ['estado'],
      _count: {
        id_entrega: true
      }
    });

    console.log('\n📊 Entregas por estado:');
    estadisticas.forEach(stat => {
      console.log(`   ${stat.estado}: ${stat._count.id_entrega}`);
    });

  } catch (error) {
    console.error('❌ Error al crear entregas:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

seedEntregas();
