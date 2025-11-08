/**
 * Controlador de Entregas (RF008)
 * Gestión completa de pedidos de entrega a pacientes con integración a inventario
 */

const { Prisma } = require("@prisma/client");
const prisma = require("../../config/database");
const { sendSuccess, sendError, handlePrismaError } = require("../../helpers/responseHandler");

/**
 * Helper: Validar si el ID es válido
 */
const isValidId = (id) => {
  return !isNaN(id) && parseInt(id) > 0;
};

/**
 * Helper: Generar número de pedido único
 * Formato: ENT-YYYY-NNNN
 */
const generarNumeroPedido = async () => {
  const year = new Date().getFullYear();
  const prefix = `ENT-${year}-`;

  // Obtener el último pedido del año
  const ultimaEntrega = await prisma.entrega.findFirst({
    where: {
      numero_pedido: {
        startsWith: prefix,
      },
    },
    orderBy: {
      numero_pedido: "desc",
    },
  });

  let siguiente = 1;
  if (ultimaEntrega) {
    const ultimoNumero = parseInt(ultimaEntrega.numero_pedido.split("-")[2]);
    siguiente = ultimoNumero + 1;
  }

  return `${prefix}${siguiente.toString().padStart(4, "0")}`;
};

/**
 * Obtener todas las entregas con paginación y búsqueda
 * GET /entregas
 * Query params: page, limit, search, estado, id_paciente, fecha_desde, fecha_hasta
 */
const ObtenerEntregas = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      estado,
      id_paciente,
      fecha_desde,
      fecha_hasta,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construir filtros
    const where = { activo: true };

    // Filtro de búsqueda por número de pedido
    if (search) {
      where.OR = [
        { numero_pedido: { contains: search } },
        {
          paciente: {
            OR: [
              { nombres: { contains: search } },
              { apellidos: { contains: search } },
              { numero_identificacion: { contains: search } },
            ],
          },
        },
      ];
    }

    // Filtro por estado
    if (estado) {
      where.estado = estado;
    }

    // Filtro por paciente
    if (id_paciente) {
      where.id_paciente = parseInt(id_paciente);
    }

    // Filtro por rango de fechas
    if (fecha_desde || fecha_hasta) {
      where.fecha_pedido = {};
      if (fecha_desde) {
        where.fecha_pedido.gte = new Date(fecha_desde);
      }
      if (fecha_hasta) {
        const fechaHastaFinal = new Date(fecha_hasta);
        fechaHastaFinal.setHours(23, 59, 59, 999);
        where.fecha_pedido.lte = fechaHastaFinal;
      }
    }

    // Obtener entregas con paginación
    const [entregas, total] = await Promise.all([
      prisma.entrega.findMany({
        where,
        skip,
        take,
        include: {
          paciente: {
            select: {
              id_paciente: true,
              nombres: true,
              apellidos: true,
              numero_identificacion: true,
              telefono_principal: true,
            },
          },
          usuario_creador: {
            select: {
              id_usuario: true,
              username: true,
              email: true,
            },
          },
          usuario_despachador: {
            select: {
              id_usuario: true,
              username: true,
              email: true,
            },
          },
          detalles: {
            include: {
              producto: {
                select: {
                  id_producto: true,
                  descripcion: true,
                  cum: true,
                  presentacion: true,
                },
              },
            },
          },
        },
        orderBy: {
          fecha_pedido: "desc",
        },
      }),
      prisma.entrega.count({ where }),
    ]);

    const totalPaginas = Math.ceil(total / take);

    return sendSuccess(res, {
      entregas,
      paginacion: {
        paginaActual: parseInt(page),
        porPagina: take,
        total,
        totalPaginas,
      },
    });
  } catch (error) {
    console.error("Error al obtener entregas:", error);
    return sendError(res, "Error al obtener las entregas", 500);
  }
};

/**
 * Obtener una entrega por ID
 * GET /entregas/:id
 */
const ObtenerEntrega = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return sendError(res, "ID de entrega inválido", 400);
    }

    const entrega = await prisma.entrega.findUnique({
      where: { id_entrega: parseInt(id) },
      include: {
        paciente: true,
        usuario_creador: {
          select: {
            id_usuario: true,
            username: true,
            email: true,
          },
        },
        usuario_despachador: {
          select: {
            id_usuario: true,
            username: true,
            email: true,
          },
        },
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });

    if (!entrega) {
      return sendError(res, "Entrega no encontrada", 404);
    }

    return sendSuccess(res, { entrega });
  } catch (error) {
    console.error("Error al obtener entrega:", error);
    return sendError(res, "Error al obtener la entrega", 500);
  }
};

/**
 * Crear una nueva entrega
 * POST /entregas
 * Body: {
 *   id_paciente,
 *   fecha_entrega_programada,
 *   direccion_entrega, ciudad_entrega, departamento_entrega, barrio_entrega,
 *   observaciones, observaciones_direccion,
 *   productos: [{ id_producto, cantidad, precio_unitario, observaciones }]
 * }
 */
const CrearEntrega = async (req, res) => {
  try {
    const {
      id_paciente,
      fecha_entrega_programada,
      direccion_entrega,
      ciudad_entrega,
      departamento_entrega,
      barrio_entrega,
      observaciones_direccion,
      observaciones,
      productos,
    } = req.body;

    const id_usuario_creador = req.usuario.id_usuario;

    // Validaciones requeridas
    if (!id_paciente) {
      return sendError(res, "El paciente es requerido", 400);
    }

    if (!direccion_entrega || !ciudad_entrega || !departamento_entrega) {
      return sendError(res, "Dirección de entrega completa es requerida", 400);
    }

    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return sendError(res, "Debe incluir al menos un producto", 400);
    }

    // Verificar que el paciente existe y está activo
    const paciente = await prisma.paciente.findUnique({
      where: { id_paciente: parseInt(id_paciente) },
    });

    if (!paciente) {
      return sendError(res, "Paciente no encontrado", 404);
    }

    if (!paciente.activo) {
      return sendError(res, "El paciente no está activo", 400);
    }

    // Validar productos y stock disponible
    for (const item of productos) {
      if (!item.id_producto || !item.cantidad || item.cantidad <= 0) {
        return sendError(res, "Todos los productos deben tener ID y cantidad válida", 400);
      }

      const producto = await prisma.producto.findUnique({
        where: { id_producto: parseInt(item.id_producto) },
      });

      if (!producto) {
        return sendError(res, `Producto con ID ${item.id_producto} no encontrado`, 404);
      }

      if (producto.stock_actual < item.cantidad) {
        return sendError(
          res,
          `Stock insuficiente para ${producto.descripcion}. Disponible: ${producto.stock_actual}, Solicitado: ${item.cantidad}`,
          400
        );
      }

      if (!item.precio_unitario || item.precio_unitario <= 0) {
        return sendError(res, `El precio unitario del producto ${producto.descripcion} es requerido`, 400);
      }
    }

    // Generar número de pedido
    const numero_pedido = await generarNumeroPedido();

    // Calcular total
    let total = 0;
    productos.forEach((item) => {
      total += parseFloat(item.precio_unitario) * parseInt(item.cantidad);
    });

    // Crear entrega con detalles y descontar inventario en transacción
    const entrega = await prisma.$transaction(async (tx) => {
      // 1. Crear la entrega
      const nuevaEntrega = await tx.entrega.create({
        data: {
          numero_pedido,
          id_paciente: parseInt(id_paciente),
          fecha_entrega_programada: fecha_entrega_programada ? new Date(fecha_entrega_programada) : null,
          estado: "Pendiente de Despacho",
          direccion_entrega,
          ciudad_entrega,
          departamento_entrega,
          barrio_entrega: barrio_entrega || null,
          observaciones_direccion: observaciones_direccion || null,
          observaciones: observaciones || null,
          id_usuario_creador,
          total: parseFloat(total.toFixed(2)),
        },
      });

      // 2. Crear detalles de la entrega y descontar inventario
      for (const item of productos) {
        const subtotal = parseFloat(item.precio_unitario) * parseInt(item.cantidad);

        // Crear detalle
        await tx.detalleEntrega.create({
          data: {
            id_entrega: nuevaEntrega.id_entrega,
            id_producto: parseInt(item.id_producto),
            cantidad: parseInt(item.cantidad),
            precio_unitario: parseFloat(item.precio_unitario),
            subtotal: parseFloat(subtotal.toFixed(2)),
            observaciones: item.observaciones || null,
          },
        });

        // Descontar del inventario
        await tx.producto.update({
          where: { id_producto: parseInt(item.id_producto) },
          data: {
            stock_actual: {
              decrement: parseInt(item.cantidad),
            },
          },
        });

        // Registrar movimiento de inventario
        await tx.movimientoInventario.create({
          data: {
            id_producto: parseInt(item.id_producto),
            tipo_movimiento: "Salida",
            cantidad: parseInt(item.cantidad),
            motivo: `Entrega a paciente - Pedido ${numero_pedido}`,
            id_usuario: id_usuario_creador,
            documento_referencia: numero_pedido,
          },
        });
      }

      return nuevaEntrega;
    });

    // Obtener la entrega completa con sus relaciones
    const entregaCompleta = await prisma.entrega.findUnique({
      where: { id_entrega: entrega.id_entrega },
      include: {
        paciente: true,
        usuario_creador: {
          select: {
            id_usuario: true,
            username: true,
            email: true,
          },
        },
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });

    return sendSuccess(res, { entrega: entregaCompleta }, 201, "Entrega creada exitosamente");
  } catch (error) {
    console.error("Error al crear entrega:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al crear la entrega", 500);
  }
};

/**
 * Actualizar una entrega
 * PUT /entregas/:id
 * Solo permite actualizar campos básicos, no los productos
 */
const ActualizarEntrega = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fecha_entrega_programada,
      direccion_entrega,
      ciudad_entrega,
      departamento_entrega,
      barrio_entrega,
      observaciones_direccion,
      observaciones,
    } = req.body;

    if (!isValidId(id)) {
      return sendError(res, "ID de entrega inválido", 400);
    }

    // Verificar que la entrega existe
    const entregaExistente = await prisma.entrega.findUnique({
      where: { id_entrega: parseInt(id) },
    });

    if (!entregaExistente) {
      return sendError(res, "Entrega no encontrada", 404);
    }

    // No permitir actualizar entregas canceladas o entregadas
    if (["Cancelado", "Entregado"].includes(entregaExistente.estado)) {
      return sendError(res, `No se puede actualizar una entrega en estado ${entregaExistente.estado}`, 400);
    }

    // Construir objeto de datos a actualizar
    const dataToUpdate = {};

    if (fecha_entrega_programada !== undefined) {
      dataToUpdate.fecha_entrega_programada = fecha_entrega_programada ? new Date(fecha_entrega_programada) : null;
    }
    if (direccion_entrega) dataToUpdate.direccion_entrega = direccion_entrega;
    if (ciudad_entrega) dataToUpdate.ciudad_entrega = ciudad_entrega;
    if (departamento_entrega) dataToUpdate.departamento_entrega = departamento_entrega;
    if (barrio_entrega !== undefined) dataToUpdate.barrio_entrega = barrio_entrega || null;
    if (observaciones_direccion !== undefined) dataToUpdate.observaciones_direccion = observaciones_direccion || null;
    if (observaciones !== undefined) dataToUpdate.observaciones = observaciones || null;

    // Actualizar entrega
    const entregaActualizada = await prisma.entrega.update({
      where: { id_entrega: parseInt(id) },
      data: dataToUpdate,
      include: {
        paciente: true,
        usuario_creador: {
          select: {
            id_usuario: true,
            username: true,
            email: true,
          },
        },
        usuario_despachador: {
          select: {
            id_usuario: true,
            username: true,
            email: true,
          },
        },
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });

    return sendSuccess(res, { entrega: entregaActualizada }, 200, "Entrega actualizada exitosamente");
  } catch (error) {
    console.error("Error al actualizar entrega:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al actualizar la entrega", 500);
  }
};

/**
 * Cambiar estado de una entrega
 * PUT /entregas/:id/estado
 * Body: { nuevo_estado, observaciones_despacho }
 * Estados válidos: Pendiente de Despacho, En Preparación, Despachado, Entregado
 */
const CambiarEstadoEntrega = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevo_estado, observaciones_despacho } = req.body;

    if (!isValidId(id)) {
      return sendError(res, "ID de entrega inválido", 400);
    }

    if (!nuevo_estado) {
      return sendError(res, "El nuevo estado es requerido", 400);
    }

    // Estados válidos
    const estadosValidos = ["Pendiente de Despacho", "En Preparación", "Despachado", "Entregado"];
    if (!estadosValidos.includes(nuevo_estado)) {
      return sendError(res, `Estado inválido. Estados válidos: ${estadosValidos.join(", ")}`, 400);
    }

    // Verificar que la entrega existe
    const entrega = await prisma.entrega.findUnique({
      where: { id_entrega: parseInt(id) },
    });

    if (!entrega) {
      return sendError(res, "Entrega no encontrada", 404);
    }

    // No permitir cambiar estado de entregas canceladas
    if (entrega.estado === "Cancelado") {
      return sendError(res, "No se puede cambiar el estado de una entrega cancelada", 400);
    }

    // Validaciones de flujo de estados
    if (entrega.estado === "Entregado") {
      return sendError(res, "No se puede cambiar el estado de una entrega ya entregada", 400);
    }

    const id_usuario = req.usuario.id_usuario;
    const dataToUpdate = { estado: nuevo_estado };

    // Si se marca como despachado, registrar despachador
    if (nuevo_estado === "Despachado" && !entrega.id_usuario_despachador) {
      dataToUpdate.id_usuario_despachador = id_usuario;
    }

    // Si se marca como entregado, registrar fecha de entrega
    if (nuevo_estado === "Entregado" && !entrega.fecha_entrega_real) {
      dataToUpdate.fecha_entrega_real = new Date();
      if (!entrega.id_usuario_despachador) {
        dataToUpdate.id_usuario_despachador = id_usuario;
      }
    }

    // Agregar observaciones de despacho si se proporcionan
    if (observaciones_despacho) {
      dataToUpdate.observaciones_despacho = observaciones_despacho;
    }

    // Actualizar estado
    const entregaActualizada = await prisma.entrega.update({
      where: { id_entrega: parseInt(id) },
      data: dataToUpdate,
      include: {
        paciente: true,
        usuario_creador: {
          select: {
            id_usuario: true,
            username: true,
            email: true,
          },
        },
        usuario_despachador: {
          select: {
            id_usuario: true,
            username: true,
            email: true,
          },
        },
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });

    return sendSuccess(res, { entrega: entregaActualizada }, 200, `Estado cambiado a ${nuevo_estado} exitosamente`);
  } catch (error) {
    console.error("Error al cambiar estado de entrega:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al cambiar el estado de la entrega", 500);
  }
};

/**
 * Cancelar una entrega y devolver inventario
 * PUT /entregas/:id/cancelar
 * Body: { motivo }
 */
const CancelarEntrega = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    if (!isValidId(id)) {
      return sendError(res, "ID de entrega inválido", 400);
    }

    if (!motivo || motivo.trim() === "") {
      return sendError(res, "El motivo de cancelación es requerido", 400);
    }

    // Verificar que la entrega existe
    const entrega = await prisma.entrega.findUnique({
      where: { id_entrega: parseInt(id) },
      include: {
        detalles: true,
      },
    });

    if (!entrega) {
      return sendError(res, "Entrega no encontrada", 404);
    }

    // No permitir cancelar entregas ya canceladas o entregadas
    if (entrega.estado === "Cancelado") {
      return sendError(res, "La entrega ya está cancelada", 400);
    }

    if (entrega.estado === "Entregado") {
      return sendError(res, "No se puede cancelar una entrega ya entregada", 400);
    }

    const id_usuario = req.usuario.id_usuario;

    // Cancelar entrega y devolver inventario en transacción
    const entregaCancelada = await prisma.$transaction(async (tx) => {
      // 1. Devolver productos al inventario
      for (const detalle of entrega.detalles) {
        await tx.producto.update({
          where: { id_producto: detalle.id_producto },
          data: {
            stock_actual: {
              increment: detalle.cantidad,
            },
          },
        });

        // Registrar movimiento de inventario
        await tx.movimientoInventario.create({
          data: {
            id_producto: detalle.id_producto,
            tipo_movimiento: "Entrada",
            cantidad: detalle.cantidad,
            motivo: `Cancelación de entrega - Pedido ${entrega.numero_pedido}: ${motivo}`,
            id_usuario,
            documento_referencia: entrega.numero_pedido,
          },
        });
      }

      // 2. Actualizar estado de la entrega
      const entregaActualizada = await tx.entrega.update({
        where: { id_entrega: parseInt(id) },
        data: {
          estado: "Cancelado",
          observaciones: entrega.observaciones
            ? `${entrega.observaciones}\n\nCANCELADO: ${motivo}`
            : `CANCELADO: ${motivo}`,
        },
      });

      return entregaActualizada;
    });

    // Obtener la entrega completa
    const entregaCompleta = await prisma.entrega.findUnique({
      where: { id_entrega: entregaCancelada.id_entrega },
      include: {
        paciente: true,
        usuario_creador: {
          select: {
            id_usuario: true,
            username: true,
            email: true,
          },
        },
        usuario_despachador: {
          select: {
            id_usuario: true,
            username: true,
            email: true,
          },
        },
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });

    return sendSuccess(res, { entrega: entregaCompleta }, 200, "Entrega cancelada exitosamente e inventario devuelto");
  } catch (error) {
    console.error("Error al cancelar entrega:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al cancelar la entrega", 500);
  }
};

/**
 * Obtener estadísticas de entregas
 * GET /entregas/estadisticas
 */
const ObtenerEstadisticasEntregas = async (req, res) => {
  try {
    const [
      totalEntregas,
      entregasPendientes,
      entregasEnPreparacion,
      entregasDespachadas,
      entregasEntregadas,
      entregasCanceladas,
      distribucionEstado,
      entregasPorMes,
      valorTotalEntregas,
    ] = await Promise.all([
      prisma.entrega.count({ where: { activo: true } }),
      prisma.entrega.count({ where: { estado: "Pendiente de Despacho", activo: true } }),
      prisma.entrega.count({ where: { estado: "En Preparación", activo: true } }),
      prisma.entrega.count({ where: { estado: "Despachado", activo: true } }),
      prisma.entrega.count({ where: { estado: "Entregado", activo: true } }),
      prisma.entrega.count({ where: { estado: "Cancelado", activo: true } }),
      prisma.entrega.groupBy({
        by: ["estado"],
        _count: { estado: true },
        where: { activo: true },
      }),
      prisma.$queryRaw(Prisma.sql`
        SELECT
          DATE_FORMAT(fecha_pedido, '%Y-%m') as mes,
          COUNT(*) as cantidad,
          SUM(total) as valor_total
        FROM entregas
        WHERE activo = 1
          AND fecha_pedido >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(fecha_pedido, '%Y-%m')
        ORDER BY mes DESC
        LIMIT 12
      `),
      prisma.entrega.aggregate({
        _sum: {
          total: true,
        },
        where: { activo: true, estado: { not: "Cancelado" } },
      }),
    ]);

    return sendSuccess(res, {
      estadisticas: {
        totalEntregas,
        entregasPendientes,
        entregasEnPreparacion,
        entregasDespachadas,
        entregasEntregadas,
        entregasCanceladas,
        distribucionEstado: distribucionEstado.map((e) => ({
          estado: e.estado,
          cantidad: e._count.estado,
        })),
        entregasPorMes: entregasPorMes.map((e) => ({
          mes: e.mes,
          cantidad: Number(e.cantidad),
          valorTotal: parseFloat(e.valor_total || 0),
        })),
        valorTotal: parseFloat(valorTotalEntregas._sum.total || 0),
      },
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return sendError(res, "Error al obtener las estadísticas", 500);
  }
};

/**
 * Obtener entregas de un paciente específico
 * GET /entregas/paciente/:id_paciente
 */
const ObtenerEntregasPorPaciente = async (req, res) => {
  try {
    const { id_paciente } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidId(id_paciente)) {
      return sendError(res, "ID de paciente inválido", 400);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [entregas, total] = await Promise.all([
      prisma.entrega.findMany({
        where: {
          id_paciente: parseInt(id_paciente),
          activo: true,
        },
        skip,
        take,
        include: {
          usuario_creador: {
            select: {
              id_usuario: true,
              username: true,
              email: true,
            },
          },
          usuario_despachador: {
            select: {
              id_usuario: true,
              username: true,
              email: true,
            },
          },
          detalles: {
            include: {
              producto: {
                select: {
                  id_producto: true,
                  descripcion: true,
                  cum: true,
                  presentacion: true,
                },
              },
            },
          },
        },
        orderBy: {
          fecha_pedido: "desc",
        },
      }),
      prisma.entrega.count({
        where: {
          id_paciente: parseInt(id_paciente),
          activo: true,
        },
      }),
    ]);

    const totalPaginas = Math.ceil(total / take);

    return sendSuccess(res, {
      entregas,
      paginacion: {
        paginaActual: parseInt(page),
        porPagina: take,
        total,
        totalPaginas,
      },
    });
  } catch (error) {
    console.error("Error al obtener entregas por paciente:", error);
    return sendError(res, "Error al obtener las entregas del paciente", 500);
  }
};

module.exports = {
  ObtenerEntregas,
  ObtenerEntrega,
  CrearEntrega,
  ActualizarEntrega,
  CambiarEstadoEntrega,
  CancelarEntrega,
  ObtenerEstadisticasEntregas,
  ObtenerEntregasPorPaciente,
};
