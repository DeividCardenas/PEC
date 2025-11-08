/**
 * Controlador de Domiciliarios (RF009)
 * Gestión completa de repartidores/domiciliarios
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { sendSuccess, sendError } = require("../../helpers/responseHandler");
const { handlePrismaError } = require("../../helpers/responseHandler");

/**
 * Helper: Validar si el ID es válido
 */
const isValidId = (id) => {
  return !isNaN(id) && parseInt(id) > 0;
};

/**
 * Obtener todos los domiciliarios con paginación y búsqueda
 * GET /domiciliarios
 * Query params: page, limit, search, activo, disponible
 */
const ObtenerDomiciliarios = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      activo,
      disponible,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construir filtros
    const where = {};

    // Filtro de búsqueda
    if (search) {
      where.OR = [
        { nombres: { contains: search } },
        { apellidos: { contains: search } },
        { numero_identificacion: { contains: search } },
        { telefono: { contains: search } },
      ];
    }

    // Filtro por estado activo
    if (activo !== undefined && activo !== "") {
      where.activo = activo === "true" || activo === true;
    }

    // Filtro por disponibilidad
    if (disponible !== undefined && disponible !== "") {
      where.disponible = disponible === "true" || disponible === true;
    }

    // Obtener domiciliarios con paginación
    const [domiciliarios, total] = await Promise.all([
      prisma.domiciliario.findMany({
        where,
        skip,
        take,
        orderBy: [
          { apellidos: "asc" },
          { nombres: "asc" },
        ],
        include: {
          _count: {
            select: { rutas: true },
          },
        },
      }),
      prisma.domiciliario.count({ where }),
    ]);

    const totalPaginas = Math.ceil(total / take);

    return sendSuccess(res, {
      domiciliarios,
      paginacion: {
        paginaActual: parseInt(page),
        porPagina: take,
        total,
        totalPaginas,
      },
    });
  } catch (error) {
    console.error("Error al obtener domiciliarios:", error);
    return sendError(res, "Error al obtener los domiciliarios", 500);
  }
};

/**
 * Obtener un domiciliario por ID
 * GET /domiciliarios/:id
 */
const ObtenerDomiciliario = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return sendError(res, "ID de domiciliario inválido", 400);
    }

    const domiciliario = await prisma.domiciliario.findUnique({
      where: { id_domiciliario: parseInt(id) },
      include: {
        rutas: {
          where: { activo: true },
          orderBy: { fecha_creacion_ruta: "desc" },
          take: 10,
        },
        _count: {
          select: { rutas: true },
        },
      },
    });

    if (!domiciliario) {
      return sendError(res, "Domiciliario no encontrado", 404);
    }

    return sendSuccess(res, { domiciliario });
  } catch (error) {
    console.error("Error al obtener domiciliario:", error);
    return sendError(res, "Error al obtener el domiciliario", 500);
  }
};

/**
 * Crear un nuevo domiciliario
 * POST /domiciliarios
 */
const CrearDomiciliario = async (req, res) => {
  try {
    const {
      nombres,
      apellidos,
      numero_identificacion,
      telefono,
      email,
      tipo_vehiculo,
      placa_vehiculo,
      observaciones,
    } = req.body;

    // Validaciones requeridas
    if (!nombres || !apellidos || !numero_identificacion || !telefono) {
      return sendError(res, "Nombres, apellidos, identificación y teléfono son requeridos", 400);
    }

    // Verificar que el número de identificación no exista
    const domiciliarioExistente = await prisma.domiciliario.findUnique({
      where: { numero_identificacion },
    });

    if (domiciliarioExistente) {
      return sendError(res, "Ya existe un domiciliario con este número de identificación", 400);
    }

    // Crear domiciliario
    const domiciliario = await prisma.domiciliario.create({
      data: {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        numero_identificacion,
        telefono,
        email: email || null,
        tipo_vehiculo: tipo_vehiculo || null,
        placa_vehiculo: placa_vehiculo || null,
        observaciones: observaciones || null,
      },
    });

    return sendSuccess(res, { domiciliario }, 201, "Domiciliario creado exitosamente");
  } catch (error) {
    console.error("Error al crear domiciliario:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al crear el domiciliario", 500);
  }
};

/**
 * Actualizar un domiciliario
 * PUT /domiciliarios/:id
 */
const ActualizarDomiciliario = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombres,
      apellidos,
      numero_identificacion,
      telefono,
      email,
      tipo_vehiculo,
      placa_vehiculo,
      disponible,
      activo,
      observaciones,
    } = req.body;

    if (!isValidId(id)) {
      return sendError(res, "ID de domiciliario inválido", 400);
    }

    // Verificar que el domiciliario existe
    const domiciliarioExistente = await prisma.domiciliario.findUnique({
      where: { id_domiciliario: parseInt(id) },
    });

    if (!domiciliarioExistente) {
      return sendError(res, "Domiciliario no encontrado", 404);
    }

    // Si se está cambiando el número de identificación, verificar que no exista
    if (numero_identificacion && numero_identificacion !== domiciliarioExistente.numero_identificacion) {
      const domiciliarioConNumero = await prisma.domiciliario.findUnique({
        where: { numero_identificacion },
      });

      if (domiciliarioConNumero) {
        return sendError(res, "Ya existe un domiciliario con este número de identificación", 400);
      }
    }

    // Construir objeto de datos a actualizar
    const dataToUpdate = {};

    if (nombres) dataToUpdate.nombres = nombres.trim();
    if (apellidos) dataToUpdate.apellidos = apellidos.trim();
    if (numero_identificacion) dataToUpdate.numero_identificacion = numero_identificacion;
    if (telefono) dataToUpdate.telefono = telefono;
    if (email !== undefined) dataToUpdate.email = email || null;
    if (tipo_vehiculo !== undefined) dataToUpdate.tipo_vehiculo = tipo_vehiculo || null;
    if (placa_vehiculo !== undefined) dataToUpdate.placa_vehiculo = placa_vehiculo || null;
    if (disponible !== undefined) dataToUpdate.disponible = Boolean(disponible);
    if (activo !== undefined) dataToUpdate.activo = Boolean(activo);
    if (observaciones !== undefined) dataToUpdate.observaciones = observaciones || null;

    // Actualizar domiciliario
    const domiciliarioActualizado = await prisma.domiciliario.update({
      where: { id_domiciliario: parseInt(id) },
      data: dataToUpdate,
    });

    return sendSuccess(res, { domiciliario: domiciliarioActualizado }, 200, "Domiciliario actualizado exitosamente");
  } catch (error) {
    console.error("Error al actualizar domiciliario:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al actualizar el domiciliario", 500);
  }
};

/**
 * Eliminar un domiciliario (soft delete)
 * DELETE /domiciliarios/:id
 */
const EliminarDomiciliario = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return sendError(res, "ID de domiciliario inválido", 400);
    }

    // Verificar que el domiciliario existe
    const domiciliario = await prisma.domiciliario.findUnique({
      where: { id_domiciliario: parseInt(id) },
      include: {
        rutas: {
          where: {
            estado: { in: ["Pendiente", "En Curso"] },
            activo: true,
          },
        },
      },
    });

    if (!domiciliario) {
      return sendError(res, "Domiciliario no encontrado", 404);
    }

    // No permitir eliminar si tiene rutas activas
    if (domiciliario.rutas.length > 0) {
      return sendError(res, `No se puede eliminar el domiciliario porque tiene ${domiciliario.rutas.length} ruta(s) pendiente(s) o en curso`, 400);
    }

    // Soft delete: marcar como inactivo
    await prisma.domiciliario.update({
      where: { id_domiciliario: parseInt(id) },
      data: { activo: false, disponible: false },
    });

    return sendSuccess(res, null, 200, "Domiciliario desactivado exitosamente");
  } catch (error) {
    console.error("Error al eliminar domiciliario:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al eliminar el domiciliario", 500);
  }
};

/**
 * Reactivar un domiciliario
 * PUT /domiciliarios/:id/reactivar
 */
const ReactivarDomiciliario = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return sendError(res, "ID de domiciliario inválido", 400);
    }

    // Verificar que el domiciliario existe
    const domiciliario = await prisma.domiciliario.findUnique({
      where: { id_domiciliario: parseInt(id) },
    });

    if (!domiciliario) {
      return sendError(res, "Domiciliario no encontrado", 404);
    }

    if (domiciliario.activo) {
      return sendError(res, "El domiciliario ya está activo", 400);
    }

    // Reactivar domiciliario
    const domiciliarioReactivado = await prisma.domiciliario.update({
      where: { id_domiciliario: parseInt(id) },
      data: { activo: true, disponible: true },
    });

    return sendSuccess(res, { domiciliario: domiciliarioReactivado }, 200, "Domiciliario reactivado exitosamente");
  } catch (error) {
    console.error("Error al reactivar domiciliario:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al reactivar el domiciliario", 500);
  }
};

/**
 * Obtener estadísticas de domiciliarios
 * GET /domiciliarios/estadisticas
 */
const ObtenerEstadisticasDomiciliarios = async (req, res) => {
  try {
    const [
      totalDomiciliarios,
      domiciliariosActivos,
      domiciliariosDisponibles,
      distribucionVehiculo,
    ] = await Promise.all([
      prisma.domiciliario.count(),
      prisma.domiciliario.count({ where: { activo: true } }),
      prisma.domiciliario.count({ where: { activo: true, disponible: true } }),
      prisma.domiciliario.groupBy({
        by: ["tipo_vehiculo"],
        _count: { tipo_vehiculo: true },
        where: { activo: true },
      }),
    ]);

    return sendSuccess(res, {
      estadisticas: {
        totalDomiciliarios,
        domiciliariosActivos,
        domiciliariosDisponibles,
        domiciliariosOcupados: domiciliariosActivos - domiciliariosDisponibles,
        distribucionVehiculo: distribucionVehiculo.map((v) => ({
          tipoVehiculo: v.tipo_vehiculo || "No especificado",
          cantidad: v._count.tipo_vehiculo,
        })),
      },
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return sendError(res, "Error al obtener las estadísticas", 500);
  }
};

/**
 * Cambiar disponibilidad de un domiciliario
 * PUT /domiciliarios/:id/disponibilidad
 */
const CambiarDisponibilidad = async (req, res) => {
  try {
    const { id } = req.params;
    const { disponible } = req.body;

    if (!isValidId(id)) {
      return sendError(res, "ID de domiciliario inválido", 400);
    }

    if (disponible === undefined) {
      return sendError(res, "El campo disponible es requerido", 400);
    }

    // Verificar que el domiciliario existe y está activo
    const domiciliario = await prisma.domiciliario.findUnique({
      where: { id_domiciliario: parseInt(id) },
    });

    if (!domiciliario) {
      return sendError(res, "Domiciliario no encontrado", 404);
    }

    if (!domiciliario.activo) {
      return sendError(res, "No se puede cambiar la disponibilidad de un domiciliario inactivo", 400);
    }

    // Actualizar disponibilidad
    const domiciliarioActualizado = await prisma.domiciliario.update({
      where: { id_domiciliario: parseInt(id) },
      data: { disponible: Boolean(disponible) },
    });

    const mensaje = disponible ? "Domiciliario marcado como disponible" : "Domiciliario marcado como no disponible";

    return sendSuccess(res, { domiciliario: domiciliarioActualizado }, 200, mensaje);
  } catch (error) {
    console.error("Error al cambiar disponibilidad:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al cambiar la disponibilidad", 500);
  }
};

module.exports = {
  ObtenerDomiciliarios,
  ObtenerDomiciliario,
  CrearDomiciliario,
  ActualizarDomiciliario,
  EliminarDomiciliario,
  ReactivarDomiciliario,
  ObtenerEstadisticasDomiciliarios,
  CambiarDisponibilidad,
};
