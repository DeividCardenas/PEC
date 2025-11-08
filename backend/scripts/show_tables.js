const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showTables() {
  try {
    const tables = await prisma.$queryRaw`SHOW TABLES`;
    console.log('Tablas en la base de datos:');
    console.log(tables);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

showTables();
