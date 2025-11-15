/**
 * Controlador de Pacientes (RF007)
 * Gestión completa de pacientes/clientes para el módulo de entregas
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { sendSuccess, sendError, handlePrismaError } = require("../../helpers/responseHandler");

/**
 * Helper: Validar si el ID es válido
 */
const isValidId = (id) => {
  return !isNaN(id) && parseInt(id) > 0;
};

/**
 * Obtener todos los pacientes con paginación y búsqueda
 * GET /pacientes
 * Query params: page, limit, search, activo
 */
const ObtenerPacientes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      activo,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construir filtros
    const where = {};

    // Filtro de búsqueda por nombre, apellido o identificación
    if (search) {
      where.OR = [
        { nombres: { contains: search } },
        { apellidos: { contains: search } },
        { numero_identificacion: { contains: search } },
        { telefono_principal: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // Filtro por estado activo
    if (activo !== undefined && activo !== "") {
      where.activo = activo === "true" || activo === true;
    }

    // Obtener pacientes con paginación
    const [pacientes, total] = await Promise.all([
      prisma.paciente.findMany({
        where,
        skip,
        take,
        orderBy: [
          { apellidos: "asc" },
          { nombres: "asc" },
        ],
      }),
      prisma.paciente.count({ where }),
    ]);

    const totalPaginas = Math.ceil(total / take);

    return sendSuccess(res, {
      pacientes,
      paginacion: {
        paginaActual: parseInt(page),
        porPagina: take,
        total,
        totalPaginas,
      },
    });
  } catch (error) {
    console.error("Error al obtener pacientes:", error);
    return sendError(res, "Error al obtener los pacientes", 500);
  }
};

/**
 * Obtener un paciente por ID
 * GET /pacientes/:id
 */
const ObtenerPaciente = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return sendError(res, "ID de paciente inválido", 400);
    }

    const paciente = await prisma.paciente.findUnique({
      where: { id_paciente: parseInt(id) },
    });

    if (!paciente) {
      return sendError(res, "Paciente no encontrado", 404);
    }

    return sendSuccess(res, { paciente });
  } catch (error) {
    console.error("Error al obtener paciente:", error);
    return sendError(res, "Error al obtener el paciente", 500);
  }
};

/**
 * Crear un nuevo paciente
 * POST /pacientes
 * Body: { tipo_identificacion, numero_identificacion, nombres, apellidos, telefono_principal, direccion, ciudad, departamento, ... }
 */
const CrearPaciente = async (req, res) => {
  try {
    const {
      tipo_identificacion,
      numero_identificacion,
      nombres,
      apellidos,
      fecha_nacimiento,
      genero,
      telefono_principal,
      telefono_secundario,
      email,
      direccion,
      ciudad,
      departamento,
      codigo_postal,
      barrio,
      eps,
      tipo_afiliacion,
      observaciones,
    } = req.body;

    // Validaciones requeridas
    if (!tipo_identificacion || !numero_identificacion || !nombres || !apellidos) {
      return sendError(res, "Tipo de identificación, número de identificación, nombres y apellidos son requeridos", 400);
    }

    if (!telefono_principal) {
      return sendError(res, "El teléfono principal es requerido", 400);
    }

    if (!direccion || !ciudad || !departamento) {
      return sendError(res, "Dirección, ciudad y departamento son requeridos", 400);
    }

    // Verificar que el número de identificación no exista
    const pacienteExistente = await prisma.paciente.findUnique({
      where: { numero_identificacion },
    });

    if (pacienteExistente) {
      return sendError(res, "Ya existe un paciente con este número de identificación", 400);
    }

    // Validar tipo de identificación
    const tiposValidos = ["CC", "TI", "CE", "Pasaporte", "RC", "NIT"];
    if (!tiposValidos.includes(tipo_identificacion)) {
      return sendError(res, `Tipo de identificación inválido. Valores válidos: ${tiposValidos.join(", ")}`, 400);
    }

    // Crear paciente
    const paciente = await prisma.paciente.create({
      data: {
        tipo_identificacion,
        numero_identificacion,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
        genero: genero || null,
        telefono_principal,
        telefono_secundario: telefono_secundario || null,
        email: email || null,
        direccion: direccion.trim(),
        ciudad: ciudad.trim(),
        departamento: departamento.trim(),
        codigo_postal: codigo_postal || null,
        barrio: barrio || null,
        eps: eps || null,
        tipo_afiliacion: tipo_afiliacion || null,
        observaciones: observaciones || null,
      },
    });

    return sendSuccess(res, { paciente }, 201, "Paciente creado exitosamente");
  } catch (error) {
    console.error("Error al crear paciente:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al crear el paciente", 500);
  }
};

/**
 * Actualizar un paciente
 * PUT /pacientes/:id
 * Body: { campos a actualizar }
 */
const ActualizarPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tipo_identificacion,
      numero_identificacion,
      nombres,
      apellidos,
      fecha_nacimiento,
      genero,
      telefono_principal,
      telefono_secundario,
      email,
      direccion,
      ciudad,
      departamento,
      codigo_postal,
      barrio,
      eps,
      tipo_afiliacion,
      observaciones,
      activo,
    } = req.body;

    if (!isValidId(id)) {
      return sendError(res, "ID de paciente inválido", 400);
    }

    // Verificar que el paciente existe
    const pacienteExistente = await prisma.paciente.findUnique({
      where: { id_paciente: parseInt(id) },
    });

    if (!pacienteExistente) {
      return sendError(res, "Paciente no encontrado", 404);
    }

    // Si se está cambiando el número de identificación, verificar que no exista
    if (numero_identificacion && numero_identificacion !== pacienteExistente.numero_identificacion) {
      const pacienteConNumero = await prisma.paciente.findUnique({
        where: { numero_identificacion },
      });

      if (pacienteConNumero) {
        return sendError(res, "Ya existe un paciente con este número de identificación", 400);
      }
    }

    // Validar tipo de identificación si se proporciona
    if (tipo_identificacion) {
      const tiposValidos = ["CC", "TI", "CE", "Pasaporte", "RC", "NIT"];
      if (!tiposValidos.includes(tipo_identificacion)) {
        return sendError(res, `Tipo de identificación inválido. Valores válidos: ${tiposValidos.join(", ")}`, 400);
      }
    }

    // Construir objeto de datos a actualizar
    const dataToUpdate = {};

    if (tipo_identificacion) dataToUpdate.tipo_identificacion = tipo_identificacion;
    if (numero_identificacion) dataToUpdate.numero_identificacion = numero_identificacion;
    if (nombres) dataToUpdate.nombres = nombres.trim();
    if (apellidos) dataToUpdate.apellidos = apellidos.trim();
    if (fecha_nacimiento !== undefined) {
      dataToUpdate.fecha_nacimiento = fecha_nacimiento ? new Date(fecha_nacimiento) : null;
    }
    if (genero !== undefined) dataToUpdate.genero = genero || null;
    if (telefono_principal) dataToUpdate.telefono_principal = telefono_principal;
    if (telefono_secundario !== undefined) dataToUpdate.telefono_secundario = telefono_secundario || null;
    if (email !== undefined) dataToUpdate.email = email || null;
    if (direccion) dataToUpdate.direccion = direccion.trim();
    if (ciudad) dataToUpdate.ciudad = ciudad.trim();
    if (departamento) dataToUpdate.departamento = departamento.trim();
    if (codigo_postal !== undefined) dataToUpdate.codigo_postal = codigo_postal || null;
    if (barrio !== undefined) dataToUpdate.barrio = barrio || null;
    if (eps !== undefined) dataToUpdate.eps = eps || null;
    if (tipo_afiliacion !== undefined) dataToUpdate.tipo_afiliacion = tipo_afiliacion || null;
    if (observaciones !== undefined) dataToUpdate.observaciones = observaciones || null;
    if (activo !== undefined) dataToUpdate.activo = Boolean(activo);

    // Actualizar paciente
    const pacienteActualizado = await prisma.paciente.update({
      where: { id_paciente: parseInt(id) },
      data: dataToUpdate,
    });

    return sendSuccess(res, { paciente: pacienteActualizado }, 200, "Paciente actualizado exitosamente");
  } catch (error) {
    console.error("Error al actualizar paciente:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al actualizar el paciente", 500);
  }
};

/**
 * Eliminar un paciente (soft delete - cambiar a inactivo)
 * DELETE /pacientes/:id
 */
const EliminarPaciente = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return sendError(res, "ID de paciente inválido", 400);
    }

    // Verificar que el paciente existe
    const paciente = await prisma.paciente.findUnique({
      where: { id_paciente: parseInt(id) },
    });

    if (!paciente) {
      return sendError(res, "Paciente no encontrado", 404);
    }

    // Soft delete: marcar como inactivo en lugar de eliminar
    await prisma.paciente.update({
      where: { id_paciente: parseInt(id) },
      data: { activo: false },
    });

    return sendSuccess(res, null, 200, "Paciente desactivado exitosamente");
  } catch (error) {
    console.error("Error al eliminar paciente:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al eliminar el paciente", 500);
  }
};

/**
 * Reactivar un paciente
 * PUT /pacientes/:id/reactivar
 */
const ReactivarPaciente = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return sendError(res, "ID de paciente inválido", 400);
    }

    // Verificar que el paciente existe
    const paciente = await prisma.paciente.findUnique({
      where: { id_paciente: parseInt(id) },
    });

    if (!paciente) {
      return sendError(res, "Paciente no encontrado", 404);
    }

    if (paciente.activo) {
      return sendError(res, "El paciente ya está activo", 400);
    }

    // Reactivar paciente
    const pacienteReactivado = await prisma.paciente.update({
      where: { id_paciente: parseInt(id) },
      data: { activo: true },
    });

    return sendSuccess(res, { paciente: pacienteReactivado }, 200, "Paciente reactivado exitosamente");
  } catch (error) {
    console.error("Error al reactivar paciente:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al reactivar el paciente", 500);
  }
};

/**
 * Obtener estadísticas de pacientes
 * GET /pacientes/estadisticas
 */
const ObtenerEstadisticasPacientes = async (req, res) => {
  try {
    const [
      totalPacientes,
      pacientesActivos,
      pacientesInactivos,
      distribucionGenero,
      distribucionEPS,
    ] = await Promise.all([
      prisma.paciente.count(),
      prisma.paciente.count({ where: { activo: true } }),
      prisma.paciente.count({ where: { activo: false } }),
      prisma.paciente.groupBy({
        by: ["genero"],
        _count: { genero: true },
      }),
      prisma.paciente.groupBy({
        by: ["eps"],
        _count: { eps: true },
        where: { eps: { not: null } },
        orderBy: { _count: { eps: "desc" } },
        take: 10,
      }),
    ]);

    return sendSuccess(res, {
      estadisticas: {
        totalPacientes,
        pacientesActivos,
        pacientesInactivos,
        distribucionGenero: distribucionGenero.map((g) => ({
          genero: g.genero || "No especificado",
          cantidad: g._count.genero,
        })),
        topEPS: distribucionEPS.map((e) => ({
          eps: e.eps,
          cantidad: e._count.eps,
        })),
      },
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return sendError(res, "Error al obtener las estadísticas", 500);
  }
};

/**
 * Buscar paciente por número de identificación
 * GET /pacientes/buscar/:numero_identificacion
 */
const BuscarPorIdentificacion = async (req, res) => {
  try {
    const { numero_identificacion } = req.params;

    if (!numero_identificacion) {
      return sendError(res, "Número de identificación requerido", 400);
    }

    const paciente = await prisma.paciente.findUnique({
      where: { numero_identificacion },
    });

    if (!paciente) {
      return sendError(res, "Paciente no encontrado", 404);
    }

    return sendSuccess(res, { paciente });
  } catch (error) {
    console.error("Error al buscar paciente:", error);
    return sendError(res, "Error al buscar el paciente", 500);
  }
};

module.exports = {
  ObtenerPacientes,
  ObtenerPaciente,
  CrearPaciente,
  ActualizarPaciente,
  EliminarPaciente,
  ReactivarPaciente,
  ObtenerEstadisticasPacientes,
  BuscarPorIdentificacion,
};
