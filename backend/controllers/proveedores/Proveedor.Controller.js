/**
 * Controlador de Proveedores
 * Maneja CRUD completo de proveedores e historial de transacciones
 */

const { PrismaClient } = require('@prisma/client');
const { sendSuccess, sendError, handlePrismaError, parsePaginationParams, buildPagination } = require('../../helpers/responseHandler');
const { isValidId, isValidEmail, validateRequiredFields } = require('../../helpers/validationHelper');

const prisma = new PrismaClient();

/**
 * Obtener todos los proveedores con paginación y búsqueda
 */
const MostrarProveedores = async (req, res) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);
    const search = (req.query.search || '').trim();
    const activo = req.query.activo;

    // Construir filtro de búsqueda
    const where = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { laboratorio: { contains: search, mode: 'insensitive' } },
        { titular: { contains: search, mode: 'insensitive' } },
        { nit: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    // Obtener total y proveedores
    const [total, proveedores] = await Promise.all([
      prisma.proveedor.count({ where }),
      prisma.proveedor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { creado_en: 'desc' },
        include: {
          _count: {
            select: { transacciones: true }
          }
        }
      })
    ]);

    const paginacion = buildPagination(page, limit, total);

    return sendSuccess(res, {
      proveedores,
      ...paginacion
    });

  } catch (error) {
    console.error('Error en MostrarProveedores:', error);
    return handlePrismaError(res, error);
  }
};

/**
 * Obtener un proveedor específico por ID
 */
const MostrarProveedor = async (req, res) => {
  try {
    const { id_proveedor } = req.params;

    if (!isValidId(id_proveedor)) {
      return sendError(res, 'ID de proveedor inválido', 400);
    }

    const proveedor = await prisma.proveedor.findUnique({
      where: { id_proveedor: Number(id_proveedor) },
      include: {
        transacciones: {
          orderBy: { fecha_emision: 'desc' },
          take: 10 // Últimas 10 transacciones
        },
        _count: {
          select: { transacciones: true }
        }
      }
    });

    if (!proveedor) {
      return sendError(res, 'Proveedor no encontrado', 404);
    }

    // Calcular estadísticas
    const estadisticas = await prisma.transaccion.aggregate({
      where: { id_proveedor: Number(id_proveedor) },
      _sum: { monto: true },
      _count: true
    });

    return sendSuccess(res, {
      proveedor,
      estadisticas: {
        totalTransacciones: estadisticas._count,
        montoTotal: estadisticas._sum.monto || 0
      }
    });

  } catch (error) {
    console.error('Error en MostrarProveedor:', error);
    return handlePrismaError(res, error);
  }
};

/**
 * Crear un nuevo proveedor
 */
const CrearProveedor = async (req, res) => {
  try {
    const { nombre, laboratorio, tipo, titular, direccion, telefono, email, nit, ciudad, pais, notas } = req.body;

    // Validar campos requeridos
    const { valid, missing } = validateRequiredFields(req.body, ['nombre']);
    if (!valid) {
      return sendError(res, `Campos requeridos faltantes: ${missing.join(', ')}`, 400);
    }

    // Validar email si se proporciona
    if (email && !isValidEmail(email)) {
      return sendError(res, 'Formato de email inválido', 400);
    }

    // Crear proveedor
    const proveedor = await prisma.proveedor.create({
      data: {
        nombre: nombre.trim(),
        laboratorio: laboratorio?.trim() || null,
        tipo: tipo?.trim() || null,
        titular: titular?.trim() || null,
        direccion: direccion?.trim() || null,
        telefono: telefono?.trim() || null,
        email: email?.trim() || null,
        nit: nit?.trim() || null,
        ciudad: ciudad?.trim() || null,
        pais: pais?.trim() || null,
        notas: notas?.trim() || null,
      }
    });

    return sendSuccess(res, { proveedor }, 201, 'Proveedor creado exitosamente');

  } catch (error) {
    console.error('Error en CrearProveedor:', error);
    return handlePrismaError(res, error);
  }
};

/**
 * Editar un proveedor existente
 */
const EditarProveedor = async (req, res) => {
  try {
    const { id_proveedor } = req.params;
    const { nombre, laboratorio, tipo, titular, direccion, telefono, email, nit, ciudad, pais, activo, notas } = req.body;

    if (!isValidId(id_proveedor)) {
      return sendError(res, 'ID de proveedor inválido', 400);
    }

    // Validar email si se proporciona
    if (email && !isValidEmail(email)) {
      return sendError(res, 'Formato de email inválido', 400);
    }

    // Preparar datos para actualizar (solo campos proporcionados)
    const dataToUpdate = {};
    if (nombre !== undefined) dataToUpdate.nombre = nombre.trim();
    if (laboratorio !== undefined) dataToUpdate.laboratorio = laboratorio?.trim() || null;
    if (tipo !== undefined) dataToUpdate.tipo = tipo?.trim() || null;
    if (titular !== undefined) dataToUpdate.titular = titular?.trim() || null;
    if (direccion !== undefined) dataToUpdate.direccion = direccion?.trim() || null;
    if (telefono !== undefined) dataToUpdate.telefono = telefono?.trim() || null;
    if (email !== undefined) dataToUpdate.email = email?.trim() || null;
    if (nit !== undefined) dataToUpdate.nit = nit?.trim() || null;
    if (ciudad !== undefined) dataToUpdate.ciudad = ciudad?.trim() || null;
    if (pais !== undefined) dataToUpdate.pais = pais?.trim() || null;
    if (activo !== undefined) dataToUpdate.activo = activo;
    if (notas !== undefined) dataToUpdate.notas = notas?.trim() || null;

    const proveedor = await prisma.proveedor.update({
      where: { id_proveedor: Number(id_proveedor) },
      data: dataToUpdate
    });

    return sendSuccess(res, { proveedor }, 200, 'Proveedor actualizado exitosamente');

  } catch (error) {
    console.error('Error en EditarProveedor:', error);
    return handlePrismaError(res, error);
  }
};

/**
 * Eliminar un proveedor
 */
const EliminarProveedor = async (req, res) => {
  try {
    const { id_proveedor } = req.params;

    if (!isValidId(id_proveedor)) {
      return sendError(res, 'ID de proveedor inválido', 400);
    }

    await prisma.proveedor.delete({
      where: { id_proveedor: Number(id_proveedor) }
    });

    return sendSuccess(res, null, 200, 'Proveedor eliminado exitosamente');

  } catch (error) {
    console.error('Error en EliminarProveedor:', error);
    return handlePrismaError(res, error);
  }
};

// ==================== TRANSACCIONES ====================

/**
 * Obtener historial de transacciones de un proveedor
 */
const MostrarTransacciones = async (req, res) => {
  try {
    const { id_proveedor } = req.params;
    const { page, limit, skip } = parsePaginationParams(req.query);
    const tipo = req.query.tipo;
    const estado = req.query.estado;

    if (!isValidId(id_proveedor)) {
      return sendError(res, 'ID de proveedor inválido', 400);
    }

    // Verificar que el proveedor existe
    const proveedorExiste = await prisma.proveedor.findUnique({
      where: { id_proveedor: Number(id_proveedor) }
    });

    if (!proveedorExiste) {
      return sendError(res, 'Proveedor no encontrado', 404);
    }

    // Construir filtro
    const where = { id_proveedor: Number(id_proveedor) };
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;

    // Obtener transacciones
    const [total, transacciones] = await Promise.all([
      prisma.transaccion.count({ where }),
      prisma.transaccion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fecha_emision: 'desc' }
      })
    ]);

    const paginacion = buildPagination(page, limit, total);

    // Calcular totales
    const totales = await prisma.transaccion.aggregate({
      where: { id_proveedor: Number(id_proveedor) },
      _sum: { monto: true },
      _count: true
    });

    return sendSuccess(res, {
      transacciones,
      ...paginacion,
      totales: {
        total: totales._count,
        montoTotal: totales._sum.monto || 0
      }
    });

  } catch (error) {
    console.error('Error en MostrarTransacciones:', error);
    return handlePrismaError(res, error);
  }
};

/**
 * Crear una nueva transacción
 */
const CrearTransaccion = async (req, res) => {
  try {
    const { id_proveedor } = req.params;
    const { tipo, concepto, monto, cantidad, numero_factura, fecha_emision, fecha_vencimiento, estado, notas } = req.body;

    if (!isValidId(id_proveedor)) {
      return sendError(res, 'ID de proveedor inválido', 400);
    }

    // Validar campos requeridos
    const { valid, missing } = validateRequiredFields(req.body, ['tipo', 'concepto', 'monto']);
    if (!valid) {
      return sendError(res, `Campos requeridos faltantes: ${missing.join(', ')}`, 400);
    }

    // Verificar que el proveedor existe
    const proveedorExiste = await prisma.proveedor.findUnique({
      where: { id_proveedor: Number(id_proveedor) }
    });

    if (!proveedorExiste) {
      return sendError(res, 'Proveedor no encontrado', 404);
    }

    // Crear transacción
    const transaccion = await prisma.transaccion.create({
      data: {
        id_proveedor: Number(id_proveedor),
        tipo,
        concepto,
        monto: parseFloat(monto),
        cantidad: cantidad ? parseInt(cantidad) : null,
        numero_factura,
        fecha_emision: fecha_emision ? new Date(fecha_emision) : new Date(),
        fecha_vencimiento: fecha_vencimiento ? new Date(fecha_vencimiento) : null,
        estado: estado || 'pendiente',
        notas
      }
    });

    return sendSuccess(res, { transaccion }, 201, 'Transacción creada exitosamente');

  } catch (error) {
    console.error('Error en CrearTransaccion:', error);
    return handlePrismaError(res, error);
  }
};

/**
 * Actualizar una transacción
 */
const EditarTransaccion = async (req, res) => {
  try {
    const { id_transaccion } = req.params;
    const { tipo, concepto, monto, cantidad, numero_factura, fecha_emision, fecha_vencimiento, estado, notas } = req.body;

    if (!isValidId(id_transaccion)) {
      return sendError(res, 'ID de transacción inválido', 400);
    }

    // Preparar datos para actualizar
    const dataToUpdate = {};
    if (tipo !== undefined) dataToUpdate.tipo = tipo;
    if (concepto !== undefined) dataToUpdate.concepto = concepto;
    if (monto !== undefined) dataToUpdate.monto = parseFloat(monto);
    if (cantidad !== undefined) dataToUpdate.cantidad = cantidad ? parseInt(cantidad) : null;
    if (numero_factura !== undefined) dataToUpdate.numero_factura = numero_factura;
    if (fecha_emision !== undefined) dataToUpdate.fecha_emision = new Date(fecha_emision);
    if (fecha_vencimiento !== undefined) dataToUpdate.fecha_vencimiento = fecha_vencimiento ? new Date(fecha_vencimiento) : null;
    if (estado !== undefined) dataToUpdate.estado = estado;
    if (notas !== undefined) dataToUpdate.notas = notas;

    const transaccion = await prisma.transaccion.update({
      where: { id_transaccion: Number(id_transaccion) },
      data: dataToUpdate
    });

    return sendSuccess(res, { transaccion }, 200, 'Transacción actualizada exitosamente');

  } catch (error) {
    console.error('Error en EditarTransaccion:', error);
    return handlePrismaError(res, error);
  }
};

/**
 * Eliminar una transacción
 */
const EliminarTransaccion = async (req, res) => {
  try {
    const { id_transaccion } = req.params;

    if (!isValidId(id_transaccion)) {
      return sendError(res, 'ID de transacción inválido', 400);
    }

    await prisma.transaccion.delete({
      where: { id_transaccion: Number(id_transaccion) }
    });

    return sendSuccess(res, null, 200, 'Transacción eliminada exitosamente');

  } catch (error) {
    console.error('Error en EliminarTransaccion:', error);
    return handlePrismaError(res, error);
  }
};

module.exports = {
  // Proveedores
  MostrarProveedores,
  MostrarProveedor,
  CrearProveedor,
  EditarProveedor,
  EliminarProveedor,
  // Transacciones
  MostrarTransacciones,
  CrearTransaccion,
  EditarTransaccion,
  EliminarTransaccion
};
