const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function describeProducto() {
  try {
    const result = await prisma.$queryRaw`DESCRIBE producto`;
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

describeProducto();
