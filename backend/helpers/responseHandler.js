/**
 * Utilidades para manejo consistente de respuestas HTTP
 * Centraliza la lógica de respuestas exitosas y errores
 */

/**
 * Envía una respuesta exitosa con formato consistente
 * @param {Object} res - Objeto response de Express
 * @param {*} data - Datos a enviar en la respuesta
 * @param {number} statusCode - Código de estado HTTP (default: 200)
 * @param {string} message - Mensaje opcional
 */
const sendSuccess = (res, data, statusCode = 200, message = null) => {
  const response = message ? { msg: message, data } : data;
  return res.status(statusCode).json(response);
};

/**
 * Envía una respuesta de error con formato consistente
 * @param {Object} res - Objeto response de Express
 * @param {string} message - Mensaje de error
 * @param {number} statusCode - Código de estado HTTP (default: 500)
 * @param {*} details - Detalles adicionales del error (solo en desarrollo)
 */
const sendError = (res, message, statusCode = 500, details = null) => {
  const response = { msg: message };

  // Solo en desarrollo enviar detalles
  if (process.env.NODE_ENV === 'development' && details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Maneja errores de Prisma de forma consistente
 * @param {Object} res - Objeto response de Express
 * @param {Error} error - Error capturado
 */
const handlePrismaError = (res, error) => {
  // Errores conocidos de Prisma
  if (error.code === 'P2002') {
    // Violación de constraint único
    const field = error.meta?.target?.[0] || 'campo';
    return sendError(res, `Ya existe un registro con ese ${field}.`, 409);
  }

  if (error.code === 'P2025') {
    // Registro no encontrado
    return sendError(res, 'Registro no encontrado.', 404);
  }

  if (error.code === 'P2003') {
    // Violación de foreign key
    return sendError(res, 'Referencia inválida a otro registro.', 400);
  }

  // Error genérico
  console.error('Error de Prisma:', error);
  return sendError(
    res,
    'Error al procesar la operación en la base de datos.',
    500,
    error.message
  );
};

/**
 * Construye objeto de paginación
 * @param {number} page - Página actual
 * @param {number} limit - Límite de resultados por página
 * @param {number} total - Total de registros
 * @returns {Object} Objeto con información de paginación
 */
const buildPagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);

  return {
    paginaActual: Number(page),
    totalPaginas: totalPages,
    tamanoPagina: Number(limit),
    total: total
  };
};

/**
 * Valida y parsea parámetros de paginación
 * @param {Object} query - Query params de la request
 * @returns {Object} Objeto con page y limit validados
 */
const parsePaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit) || 10)); // Máximo 100 por página

  return { page, limit, skip: (page - 1) * limit };
};

/**
 * Crea un error con status code
 * @param {string} message - Mensaje de error
 * @param {number} statusCode - Código de estado HTTP
 * @returns {Error} Error con propiedad statusCode
 */
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

module.exports = {
  sendSuccess,
  sendError,
  handlePrismaError,
  buildPagination,
  parsePaginationParams,
  createError
};
