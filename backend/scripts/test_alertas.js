const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAlertas() {
  try {
    console.log('Probando consulta de alertas...\n');

    // Prueba 1: Consulta básica
    console.log('1. Consulta básica:');
    const result1 = await prisma.$queryRaw`
      SELECT p.id_producto, p.descripcion, p.stock_actual, p.stock_minimo
      FROM producto p
      WHERE p.stock_actual <= p.stock_minimo
      LIMIT 5
    `;
    console.log(JSON.stringify(result1, null, 2));

    // Prueba 2: Consulta con JOIN (corregida)
    console.log('\n2. Consulta con JOIN:');
    const result2 = await prisma.$queryRawUnsafe(`
      SELECT
        p.id_producto,
        p.cum,
        p.descripcion,
        p.stock_actual,
        p.stock_minimo,
        p.laboratorio_id,
        l.nombre as laboratorio_nombre
      FROM producto p
      LEFT JOIN laboratorio l ON p.laboratorio_id = l.id_laboratorio
      WHERE p.stock_actual <= p.stock_minimo
      ORDER BY p.stock_actual ASC
      LIMIT 5 OFFSET 0
    `);
    console.log(JSON.stringify(result2, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testAlertas();
