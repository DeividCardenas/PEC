/**
 * Singleton de PrismaClient
 *
 * Evita la creación de múltiples instancias de PrismaClient,
 * lo que optimiza las conexiones a la base de datos.
 *
 * Uso:
 * const prisma = require('../config/database');
 */

const { PrismaClient } = require('@prisma/client');

// Variable global para almacenar la instancia única
let prismaInstance = null;

/**
 * Obtiene la instancia única de PrismaClient
 * @returns {PrismaClient} Instancia de Prisma
 */
function getPrismaInstance() {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    });

    // Manejar desconexión limpia al cerrar la aplicación
    process.on('beforeExit', async () => {
      await prismaInstance.$disconnect();
    });
  }

  return prismaInstance;
}

// Exportar la instancia única
module.exports = getPrismaInstance();
