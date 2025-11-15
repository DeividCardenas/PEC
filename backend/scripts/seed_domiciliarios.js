const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedDomiciliarios() {
  try {
    console.log('🚴 Creando domiciliarios de prueba...\n');

    const domiciliarios = [
      {
        nombres: 'Carlos Andrés',
        apellidos: 'Rodríguez López',
        numero_identificacion: '1085678901',
        telefono: '3201234567',
        email: 'carlos.rodriguez@domiciliarios.com',
        tipo_vehiculo: 'Moto',
        placa_vehiculo: 'ABC123',
        activo: true,
        disponible: true,
        observaciones: 'Experiencia de 3 años en entregas médicas'
      },
      {
        nombres: 'María Fernanda',
        apellidos: 'González Pérez',
        numero_identificacion: '1085678902',
        telefono: '3209876543',
        email: 'maria.gonzalez@domiciliarios.com',
        tipo_vehiculo: 'Moto',
        placa_vehiculo: 'DEF456',
        activo: true,
        disponible: true,
        observaciones: 'Especializada en zona norte de Pasto'
      },
      {
        nombres: 'Juan Pablo',
        apellidos: 'Martínez Silva',
        numero_identificacion: '1085678903',
        telefono: '3215551234',
        email: 'juan.martinez@domiciliarios.com',
        tipo_vehiculo: 'Bicicleta',
        placa_vehiculo: null,
        activo: true,
        disponible: true,
        observaciones: 'Entregas ecológicas en el centro de la ciudad'
      },
      {
        nombres: 'Diana Carolina',
        apellidos: 'Ramírez Torres',
        numero_identificacion: '1085678904',
        telefono: '3187654321',
        email: 'diana.ramirez@domiciliarios.com',
        tipo_vehiculo: 'Moto',
        placa_vehiculo: 'GHI789',
        activo: true,
        disponible: false, // No disponible temporalmente
        observaciones: 'Cobertura en zona sur y oriente'
      },
      {
        nombres: 'Luis Eduardo',
        apellidos: 'Benavides Chaves',
        numero_identificacion: '1085678905',
        telefono: '3163334455',
        email: 'luis.benavides@domiciliarios.com',
        tipo_vehiculo: 'Auto',
        placa_vehiculo: 'JKL012',
        activo: true,
        disponible: true,
        observaciones: 'Vehículo para entregas grandes o múltiples paquetes'
      }
    ];

    for (const domiciliario of domiciliarios) {
      const created = await prisma.domiciliario.upsert({
        where: { numero_identificacion: domiciliario.numero_identificacion },
        update: domiciliario,
        create: domiciliario
      });
      console.log(`✓ Domiciliario: ${created.nombres} ${created.apellidos} - ${created.tipo_vehiculo}`);
    }

    const count = await prisma.domiciliario.count();
    console.log(`\n✅ Total de domiciliarios en BD: ${count}`);

  } catch (error) {
    console.error('❌ Error al crear domiciliarios:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDomiciliarios();
