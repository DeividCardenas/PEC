/**
 * Controlador de Rutas (RF009)
 * Optimización de rutas de entrega para domiciliarios
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
 * Helper: Generar número de ruta único
 * Formato: RUTA-YYYY-NNNN
 */
const generarNumeroRuta = async () => {
  const year = new Date().getFullYear();
  const prefix = `RUTA-${year}-`;

  const ultimaRuta = await prisma.ruta.findFirst({
    where: {
      numero_ruta: {
        startsWith: prefix,
      },
    },
    orderBy: {
      numero_ruta: "desc",
    },
  });

  let siguiente = 1;
  if (ultimaRuta) {
    const ultimoNumero = parseInt(ultimaRuta.numero_ruta.split("-")[2]);
    siguiente = ultimoNumero + 1;
  }

  return `${prefix}${siguiente.toString().padStart(4, "0")}`;
};

/**
 * Algoritmo de optimización de rutas
 * Agrupa por ciudad y ordena entregas para minimizar distancia
 */
const optimizarRuta = (entregas) => {
  // Agrupar por ciudad y departamento
  const grupos = {};

  entregas.forEach((entrega) => {
    const clave = `${entrega.departamento_entrega}-${entrega.ciudad_entrega}`;
    if (!grupos[clave]) {
      grupos[clave] = [];
    }
    grupos[clave].push(entrega);
  });

  // Ordenar entregas dentro de cada grupo por dirección (aproximación simple)
  Object.keys(grupos).forEach((clave) => {
    grupos[clave].sort((a, b) => {
      // Ordenar por barrio primero, luego por dirección
      if (a.barrio_entrega && b.barrio_entrega) {
        const barrioCompare = a.barrio_entrega.localeCompare(b.barrio_entrega);
        if (barrioCompare !== 0) return barrioCompare;
      }
      return a.direccion_entrega.localeCompare(b.direccion_entrega);
    });
  });

  // Combinar grupos ordenados
  let rutaOptimizada = [];
  let orden = 1;

  // Ordenar grupos por departamento y ciudad
  const gruposOrdenados = Object.keys(grupos).sort();

  gruposOrdenados.forEach((clave) => {
    grupos[clave].forEach((entrega) => {
      rutaOptimizada.push({
        id_entrega: entrega.id_entrega,
        orden: orden++,
      });
    });
  });

  // Calcular distancia y tiempo estimados (aproximación)
  // En un sistema real, esto usaría APIs de mapas
  const numeroGrupos = gruposOrdenados.length;
  const totalEntregas = rutaOptimizada.length;

  // Estimación simple: 5 km por grupo + 2 km por entrega
  const distanciaEstimada = (numeroGrupos * 5) + (totalEntregas * 2);

  // Estimación simple: 15 min por grupo + 10 min por entrega
  const tiempoEstimado = (numeroGrupos * 15) + (totalEntregas * 10);

  return {
    entregasOrdenadas: rutaOptimizada,
    distanciaEstimada: parseFloat(distanciaEstimada.toFixed(2)),
    tiempoEstimado: Math.round(tiempoEstimado),
  };
};

/**
 * Obtener todas las rutas con paginación y filtros
 * GET /rutas
 */
const ObtenerRutas = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      estado,
      id_domiciliario,
      fecha_desde,
      fecha_hasta,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construir filtros
    const where = { activo: true };

    // Filtro de búsqueda por número de ruta
    if (search) {
      where.numero_ruta = { contains: search };
    }

    // Filtro por estado
    if (estado) {
      where.estado = estado;
    }

    // Filtro por domiciliario
    if (id_domiciliario) {
      where.id_domiciliario = parseInt(id_domiciliario);
    }

    // Filtro por rango de fechas
    if (fecha_desde || fecha_hasta) {
      where.fecha_programada = {};
      if (fecha_desde) {
        where.fecha_programada.gte = new Date(fecha_desde);
      }
      if (fecha_hasta) {
        const fechaHastaFinal = new Date(fecha_hasta);
        fechaHastaFinal.setHours(23, 59, 59, 999);
        where.fecha_programada.lte = fechaHastaFinal;
      }
    }

    // Obtener rutas con paginación
    const [rutas, total] = await Promise.all([
      prisma.ruta.findMany({
        where,
        skip,
        take,
        include: {
          domiciliario: true,
          usuario_creador: {
            select: {
              id_usuario: true,
              username: true,
              email: true,
            },
          },
          entregas: {
            include: {
              paciente: {
                select: {
                  id_paciente: true,
                  nombres: true,
                  apellidos: true,
                  telefono_principal: true,
                },
              },
            },
            orderBy: {
              orden_en_ruta: "asc",
            },
          },
          _count: {
            select: { entregas: true },
          },
        },
        orderBy: {
          fecha_creacion_ruta: "desc",
        },
      }),
      prisma.ruta.count({ where }),
    ]);

    const totalPaginas = Math.ceil(total / take);

    return sendSuccess(res, {
      rutas,
      paginacion: {
        paginaActual: parseInt(page),
        porPagina: take,
        total,
        totalPaginas,
      },
    });
  } catch (error) {
    console.error("Error al obtener rutas:", error);
    return sendError(res, "Error al obtener las rutas", 500);
  }
};

/**
 * Obtener una ruta por ID
 * GET /rutas/:id
 */
const ObtenerRuta = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return sendError(res, "ID de ruta inválido", 400);
    }

    const ruta = await prisma.ruta.findUnique({
      where: { id_ruta: parseInt(id) },
      include: {
        domiciliario: true,
        usuario_creador: {
          select: {
            id_usuario: true,
            username: true,
            email: true,
          },
        },
        entregas: {
          include: {
            paciente: true,
            detalles: {
              include: {
                producto: {
                  select: {
                    id_producto: true,
                    descripcion: true,
                    cum: true,
                  },
                },
              },
            },
          },
          orderBy: {
            orden_en_ruta: "asc",
          },
        },
      },
    });

    if (!ruta) {
      return sendError(res, "Ruta no encontrada", 404);
    }

    return sendSuccess(res, { ruta });
  } catch (error) {
    console.error("Error al obtener ruta:", error);
    return sendError(res, "Error al obtener la ruta", 500);
  }
};

/**
 * Crear una ruta optimizada
 * POST /rutas
 * Body: { id_domiciliario?, fecha_programada?, entregas_ids: [], observaciones? }
 */
const CrearRuta = async (req, res) => {
  try {
    const {
      id_domiciliario,
      fecha_programada,
      entregas_ids,
      observaciones,
    } = req.body;

    const id_usuario_creador = req.usuario.id_usuario;

    // Validaciones
    if (!entregas_ids || !Array.isArray(entregas_ids) || entregas_ids.length === 0) {
      return sendError(res, "Debe incluir al menos una entrega", 400);
    }

    // Si se asigna domiciliario, verificar que existe y está disponible
    if (id_domiciliario) {
      const domiciliario = await prisma.domiciliario.findUnique({
        where: { id_domiciliario: parseInt(id_domiciliario) },
      });

      if (!domiciliario) {
        return sendError(res, "Domiciliario no encontrado", 404);
      }

      if (!domiciliario.activo) {
        return sendError(res, "El domiciliario no está activo", 400);
      }

      if (!domiciliario.disponible) {
        return sendError(res, "El domiciliario no está disponible", 400);
      }
    }

    // Obtener las entregas y validar
    const entregas = await prisma.entrega.findMany({
      where: {
        id_entrega: { in: entregas_ids.map((id) => parseInt(id)) },
        activo: true,
      },
    });

    if (entregas.length !== entregas_ids.length) {
      return sendError(res, "Una o más entregas no fueron encontradas", 404);
    }

    // Validar que todas las entregas estén en estado válido
    const entregasInvalidas = entregas.filter(
      (e) => !["Pendiente de Despacho", "En Preparación"].includes(e.estado)
    );

    if (entregasInvalidas.length > 0) {
      return sendError(
        res,
        `${entregasInvalidas.length} entrega(s) no están en estado válido para asignar a ruta. Solo se pueden asignar entregas en estado "Pendiente de Despacho" o "En Preparación"`,
        400
      );
    }

    // Validar que las entregas no estén ya asignadas a otra ruta
    const entregasYaAsignadas = entregas.filter((e) => e.id_ruta !== null);

    if (entregasYaAsignadas.length > 0) {
      return sendError(
        res,
        `${entregasYaAsignadas.length} entrega(s) ya están asignadas a otra ruta`,
        400
      );
    }

    // Optimizar la ruta
    const { entregasOrdenadas, distanciaEstimada, tiempoEstimado } = optimizarRuta(entregas);

    // Generar número de ruta
    const numero_ruta = await generarNumeroRuta();

    // Crear ruta y asignar entregas en transacción
    const ruta = await prisma.$transaction(async (tx) => {
      // 1. Crear la ruta
      const nuevaRuta = await tx.ruta.create({
        data: {
          numero_ruta,
          id_domiciliario: id_domiciliario ? parseInt(id_domiciliario) : null,
          id_usuario_creador,
          fecha_programada: fecha_programada ? new Date(fecha_programada) : null,
          distancia_total_km: distanciaEstimada,
          tiempo_estimado_min: tiempoEstimado,
          observaciones: observaciones || null,
        },
      });

      // 2. Asignar entregas a la ruta con su orden
      for (const item of entregasOrdenadas) {
        await tx.entrega.update({
          where: { id_entrega: item.id_entrega },
          data: {
            id_ruta: nuevaRuta.id_ruta,
            orden_en_ruta: item.orden,
            estado: "En Preparación", // Cambiar estado automáticamente
          },
        });
      }

      // 3. Si se asignó domiciliario, marcarlo como no disponible
      if (id_domiciliario) {
        await tx.domiciliario.update({
          where: { id_domiciliario: parseInt(id_domiciliario) },
          data: { disponible: false },
        });
      }

      return nuevaRuta;
    });

    // Obtener la ruta completa con sus relaciones
    const rutaCompleta = await prisma.ruta.findUnique({
      where: { id_ruta: ruta.id_ruta },
      include: {
        domiciliario: true,
        usuario_creador: {
          select: {
            id_usuario: true,
            username: true,
            email: true,
          },
        },
        entregas: {
          include: {
            paciente: {
              select: {
                id_paciente: true,
                nombres: true,
                apellidos: true,
              },
            },
          },
          orderBy: {
            orden_en_ruta: "asc",
          },
        },
      },
    });

    return sendSuccess(res, { ruta: rutaCompleta }, 201, "Ruta creada y optimizada exitosamente");
  } catch (error) {
    console.error("Error al crear ruta:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al crear la ruta", 500);
  }
};

/**
 * Asignar domiciliario a una ruta
 * PUT /rutas/:id/asignar-domiciliario
 * Body: { id_domiciliario }
 */
const AsignarDomiciliario = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_domiciliario } = req.body;

    if (!isValidId(id)) {
      return sendError(res, "ID de ruta inválido", 400);
    }

    if (!id_domiciliario) {
      return sendError(res, "ID de domiciliario es requerido", 400);
    }

    // Verificar que la ruta existe
    const ruta = await prisma.ruta.findUnique({
      where: { id_ruta: parseInt(id) },
      include: { domiciliario: true },
    });

    if (!ruta) {
      return sendError(res, "Ruta no encontrada", 404);
    }

    if (ruta.estado !== "Pendiente") {
      return sendError(res, "Solo se pueden asignar domiciliarios a rutas pendientes", 400);
    }

    // Verificar que el domiciliario existe y está disponible
    const domiciliario = await prisma.domiciliario.findUnique({
      where: { id_domiciliario: parseInt(id_domiciliario) },
    });

    if (!domiciliario) {
      return sendError(res, "Domiciliario no encontrado", 404);
    }

    if (!domiciliario.activo || !domiciliario.disponible) {
      return sendError(res, "El domiciliario no está activo o no está disponible", 400);
    }

    // Asignar domiciliario en transacción
    await prisma.$transaction(async (tx) => {
      // Actualizar ruta
      await tx.ruta.update({
        where: { id_ruta: parseInt(id) },
        data: { id_domiciliario: parseInt(id_domiciliario) },
      });

      // Marcar domiciliario como no disponible
      await tx.domiciliario.update({
        where: { id_domiciliario: parseInt(id_domiciliario) },
        data: { disponible: false },
      });

      // Si había un domiciliario anterior, liberarlo
      if (ruta.id_domiciliario) {
        await tx.domiciliario.update({
          where: { id_domiciliario: ruta.id_domiciliario },
          data: { disponible: true },
        });
      }
    });

    // Obtener ruta actualizada
    const rutaActualizada = await prisma.ruta.findUnique({
      where: { id_ruta: parseInt(id) },
      include: {
        domiciliario: true,
        entregas: {
          include: {
            paciente: true,
          },
          orderBy: {
            orden_en_ruta: "asc",
          },
        },
      },
    });

    return sendSuccess(res, { ruta: rutaActualizada }, 200, "Domiciliario asignado exitosamente");
  } catch (error) {
    console.error("Error al asignar domiciliario:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al asignar el domiciliario", 500);
  }
};

/**
 * Cambiar estado de una ruta
 * PUT /rutas/:id/estado
 * Body: { nuevo_estado }
 */
const CambiarEstadoRuta = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevo_estado } = req.body;

    if (!isValidId(id)) {
      return sendError(res, "ID de ruta inválido", 400);
    }

    if (!nuevo_estado) {
      return sendError(res, "El nuevo estado es requerido", 400);
    }

    // Estados válidos
    const estadosValidos = ["Pendiente", "En Curso", "Completada", "Cancelada"];
    if (!estadosValidos.includes(nuevo_estado)) {
      return sendError(res, `Estado inválido. Estados válidos: ${estadosValidos.join(", ")}`, 400);
    }

    // Verificar que la ruta existe
    const ruta = await prisma.ruta.findUnique({
      where: { id_ruta: parseInt(id) },
      include: {
        domiciliario: true,
        entregas: true,
      },
    });

    if (!ruta) {
      return sendError(res, "Ruta no encontrada", 404);
    }

    // Validaciones de flujo de estados
    if (ruta.estado === "Completada" || ruta.estado === "Cancelada") {
      return sendError(res, "No se puede cambiar el estado de una ruta completada o cancelada", 400);
    }

    if (nuevo_estado === "En Curso" && !ruta.id_domiciliario) {
      return sendError(res, "No se puede iniciar una ruta sin domiciliario asignado", 400);
    }

    const dataToUpdate = { estado: nuevo_estado };

    // Si se marca como En Curso, registrar fecha de inicio
    if (nuevo_estado === "En Curso" && !ruta.fecha_inicio) {
      dataToUpdate.fecha_inicio = new Date();
    }

    // Si se marca como Completada, registrar fecha de finalización
    if (nuevo_estado === "Completada") {
      dataToUpdate.fecha_finalizacion = new Date();

      // Marcar todas las entregas como Despachado
      await prisma.entrega.updateMany({
        where: { id_ruta: parseInt(id) },
        data: { estado: "Despachado" },
      });

      // Liberar domiciliario
      if (ruta.id_domiciliario) {
        await prisma.domiciliario.update({
          where: { id_domiciliario: ruta.id_domiciliario },
          data: { disponible: true },
        });
      }
    }

    // Actualizar estado
    const rutaActualizada = await prisma.ruta.update({
      where: { id_ruta: parseInt(id) },
      data: dataToUpdate,
      include: {
        domiciliario: true,
        entregas: {
          include: {
            paciente: true,
          },
          orderBy: {
            orden_en_ruta: "asc",
          },
        },
      },
    });

    return sendSuccess(res, { ruta: rutaActualizada }, 200, `Estado cambiado a ${nuevo_estado} exitosamente`);
  } catch (error) {
    console.error("Error al cambiar estado de ruta:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al cambiar el estado de la ruta", 500);
  }
};

/**
 * Cancelar una ruta
 * PUT /rutas/:id/cancelar
 * Body: { motivo }
 */
const CancelarRuta = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    if (!isValidId(id)) {
      return sendError(res, "ID de ruta inválido", 400);
    }

    if (!motivo || motivo.trim() === "") {
      return sendError(res, "El motivo de cancelación es requerido", 400);
    }

    // Verificar que la ruta existe
    const ruta = await prisma.ruta.findUnique({
      where: { id_ruta: parseInt(id) },
      include: {
        entregas: true,
        domiciliario: true,
      },
    });

    if (!ruta) {
      return sendError(res, "Ruta no encontrada", 404);
    }

    if (ruta.estado === "Completada") {
      return sendError(res, "No se puede cancelar una ruta completada", 400);
    }

    if (ruta.estado === "Cancelada") {
      return sendError(res, "La ruta ya está cancelada", 400);
    }

    // Cancelar ruta y liberar entregas en transacción
    await prisma.$transaction(async (tx) => {
      // 1. Actualizar estado de la ruta
      await tx.ruta.update({
        where: { id_ruta: parseInt(id) },
        data: {
          estado: "Cancelada",
          observaciones: ruta.observaciones
            ? `${ruta.observaciones}\n\nCANCELADA: ${motivo}`
            : `CANCELADA: ${motivo}`,
        },
      });

      // 2. Liberar entregas (quitarlas de la ruta)
      await tx.entrega.updateMany({
        where: { id_ruta: parseInt(id) },
        data: {
          id_ruta: null,
          orden_en_ruta: null,
          estado: "Pendiente de Despacho", // Volver a estado inicial
        },
      });

      // 3. Liberar domiciliario si estaba asignado
      if (ruta.id_domiciliario) {
        await tx.domiciliario.update({
          where: { id_domiciliario: ruta.id_domiciliario },
          data: { disponible: true },
        });
      }
    });

    // Obtener ruta cancelada
    const rutaCancelada = await prisma.ruta.findUnique({
      where: { id_ruta: parseInt(id) },
      include: {
        domiciliario: true,
      },
    });

    return sendSuccess(res, { ruta: rutaCancelada }, 200, "Ruta cancelada exitosamente");
  } catch (error) {
    console.error("Error al cancelar ruta:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al cancelar la ruta", 500);
  }
};

/**
 * Obtener estadísticas de rutas
 * GET /rutas/estadisticas
 */
const ObtenerEstadisticasRutas = async (req, res) => {
  try {
    const [
      totalRutas,
      rutasPendientes,
      rutasEnCurso,
      rutasCompletadas,
      rutasCanceladas,
      distribucionEstado,
    ] = await Promise.all([
      prisma.ruta.count({ where: { activo: true } }),
      prisma.ruta.count({ where: { estado: "Pendiente", activo: true } }),
      prisma.ruta.count({ where: { estado: "En Curso", activo: true } }),
      prisma.ruta.count({ where: { estado: "Completada", activo: true } }),
      prisma.ruta.count({ where: { estado: "Cancelada", activo: true } }),
      prisma.ruta.groupBy({
        by: ["estado"],
        _count: { estado: true },
        where: { activo: true },
      }),
    ]);

    return sendSuccess(res, {
      estadisticas: {
        totalRutas,
        rutasPendientes,
        rutasEnCurso,
        rutasCompletadas,
        rutasCanceladas,
        distribucionEstado: distribucionEstado.map((e) => ({
          estado: e.estado,
          cantidad: e._count.estado,
        })),
      },
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return sendError(res, "Error al obtener las estadísticas", 500);
  }
};

module.exports = {
  ObtenerRutas,
  ObtenerRuta,
  CrearRuta,
  AsignarDomiciliario,
  CambiarEstadoRuta,
  CancelarRuta,
  ObtenerEstadisticasRutas,
};
