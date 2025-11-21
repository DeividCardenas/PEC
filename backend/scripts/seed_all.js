const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const prisma = new PrismaClient();

/**
 * Script maestro para ejecutar todos los seeders en el orden correcto
 * Orden de ejecución:
 * 1. seed_full.js - Datos básicos (laboratorios, empresas, EPS, tarifarios, productos)
 * 2. seed_users.js - Usuarios y roles
 * 3. seed_domiciliarios.js - Domiciliarios
 * 4. seed_pacientes.js - Pacientes
 * 5. seed_proveedores_pasto.js - Proveedores
 * 6. seed_ordenes_compra.js - Órdenes de compra
 * 7. seed_inventario.js o seed_inventario_simple.js - Inventario
 * 8. seed_entregas.js - Entregas
 * 9. seed_rutas.js - Rutas
 */

const SEEDERS = [
  { name: 'Datos básicos (Laboratorios, Empresas, EPS, Tarifarios, Productos)', script: 'seed_full.js' },
  { name: 'Usuarios y Roles', script: 'seed_users.js' },
  { name: 'Domiciliarios', script: 'seed_domiciliarios.js' },
  { name: 'Pacientes', script: 'seed_pacientes.js' },
  { name: 'Proveedores', script: 'seed_proveedores_pasto.js' },
  { name: 'Órdenes de Compra', script: 'seed_ordenes_compra.js' },
  { name: 'Inventario Simple', script: 'seed_inventario_simple.js' },
  { name: 'Entregas', script: 'seed_entregas.js' },
  { name: 'Rutas', script: 'seed_rutas.js' }
];

async function runSeeder(seeder) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🌱 Ejecutando: ${seeder.name}`);
  console.log(`   Archivo: ${seeder.script}`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    execSync(`node scripts/${seeder.script}`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`\n✅ ${seeder.name} completado exitosamente\n`);
    return { success: true, name: seeder.name };
  } catch (error) {
    console.error(`\n❌ Error en ${seeder.name}:`);
    console.error(error.message);
    return { success: false, name: seeder.name, error: error.message };
  }
}

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    SEEDING COMPLETO DE BASE DE DATOS                       ║');
  console.log('║                                  PEC System                                ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const startTime = Date.now();
  const results = [];

  for (const seeder of SEEDERS) {
    const result = await runSeeder(seeder);
    results.push(result);

    // Pequeña pausa entre seeders
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Resumen final
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                         RESUMEN DE SEEDING                                 ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    if (!result.success && result.error) {
      console.log(`   └─ Error: ${result.error}`);
    }
  });

  console.log('\n');
  console.log(`📊 Total: ${results.length} seeders`);
  console.log(`✅ Exitosos: ${successful}`);
  console.log(`❌ Fallidos: ${failed}`);
  console.log(`⏱️  Tiempo total: ${duration}s`);
  console.log('\n');

  // Mostrar estadísticas de la base de datos
  try {
    console.log('╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                     ESTADÍSTICAS DE BASE DE DATOS                          ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝');
    console.log('\n');

    const stats = {
      usuarios: await prisma.usuario.count(),
      roles: await prisma.rol.count(),
      laboratorios: await prisma.laboratorio.count(),
      empresas: await prisma.empresa.count(),
      eps: await prisma.ePS.count(),
      tarifarios: await prisma.tarifario.count(),
      productos: await prisma.producto.count(),
      proveedores: await prisma.proveedor.count(),
      ordenesCompra: await prisma.ordenCompra.count(),
      pacientes: await prisma.paciente.count(),
      domiciliarios: await prisma.domiciliario.count(),
      entregas: await prisma.entrega.count(),
      rutas: await prisma.ruta.count()
    };

    console.log(`👤 Usuarios:           ${stats.usuarios}`);
    console.log(`🎭 Roles:              ${stats.roles}`);
    console.log(`🔬 Laboratorios:       ${stats.laboratorios}`);
    console.log(`🏢 Empresas:           ${stats.empresas}`);
    console.log(`🏥 EPS:                ${stats.eps}`);
    console.log(`💰 Tarifarios:         ${stats.tarifarios}`);
    console.log(`💊 Productos:          ${stats.productos}`);
    console.log(`📦 Proveedores:        ${stats.proveedores}`);
    console.log(`📋 Órdenes de Compra:  ${stats.ordenesCompra}`);
    console.log(`🧑 Pacientes:          ${stats.pacientes}`);
    console.log(`🚴 Domiciliarios:      ${stats.domiciliarios}`);
    console.log(`📮 Entregas:           ${stats.entregas}`);
    console.log(`🗺️  Rutas:             ${stats.rutas}`);

    console.log('\n');
  } catch (error) {
    console.error('⚠️  No se pudieron obtener las estadísticas:', error.message);
  }

  if (failed > 0) {
    console.log('⚠️  Algunos seeders fallaron. Revisa los errores arriba.\n');
    process.exit(1);
  } else {
    console.log('🎉 ¡Todos los seeders se ejecutaron exitosamente!\n');
    console.log('📌 Puedes iniciar sesión con las siguientes credenciales:\n');
    console.log('   👑 Administrador:');
    console.log('      Email: admin@pec.com');
    console.log('      Password: admin123\n');
    console.log('   💊 Farmacéutico:');
    console.log('      Email: farmaceutico@pec.com');
    console.log('      Password: farmaceutico123\n');
  }
}

main()
  .catch(e => {
    console.error('\n❌ Error fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
