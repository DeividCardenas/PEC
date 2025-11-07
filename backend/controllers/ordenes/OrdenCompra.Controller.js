const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const {
  sendSuccess,
  sendError,
  handlePrismaError,
} = require("../../helpers/responseHandler");
const {
  parsePaginationParams,
  buildPagination,
} = require("../../helpers/responseHandler");
const { isValidId, isValidEmail } = require("../../helpers/validationHelper");

/**
 * Generar número de orden único (formato: OC-YYYY-NNNN)
 */
const generarNumeroOrden = async () => {
  const year = new Date().getFullYear();
  const prefix = `OC-${year}-`;

  // Buscar la última orden del año actual
  const ultimaOrden = await prisma.ordenCompra.findFirst({
    where: {
      numero_orden: {
        startsWith: prefix,
      },
    },
    orderBy: {
      numero_orden: "desc",
    },
  });

  let nextNumber = 1;
  if (ultimaOrden) {
    const lastNumber = parseInt(ultimaOrden.numero_orden.split("-")[2]);
    nextNumber = lastNumber + 1;
  }

  const numeroOrden = `${prefix}${String(nextNumber).padStart(4, "0")}`;
  return numeroOrden;
};

/**
 * Listar órdenes de compra con paginación y filtros
 * GET /ordenes-compra
 * Query params: page, limit, search, estado, id_proveedor, fecha_desde, fecha_hasta
 */
const MostrarOrdenes = async (req, res) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);
    const { search, estado, id_proveedor, fecha_desde, fecha_hasta } =
      req.query;

    // Construir filtros
    const where = {};

    if (search) {
      where.OR = [
        { numero_orden: { contains: search } },
        { proveedor: { nombre: { contains: search } } },
        { notas: { contains: search } },
      ];
    }

    if (estado) {
      where.estado = estado;
    }

    if (id_proveedor) {
      where.id_proveedor = parseInt(id_proveedor);
    }

    if (fecha_desde || fecha_hasta) {
      where.fecha_orden = {};
      if (fecha_desde) {
        where.fecha_orden.gte = new Date(fecha_desde);
      }
      if (fecha_hasta) {
        where.fecha_orden.lte = new Date(fecha_hasta);
      }
    }

    // Ejecutar consultas en paralelo
    const [total, ordenes] = await Promise.all([
      prisma.ordenCompra.count({ where }),
      prisma.ordenCompra.findMany({
        where,
        skip,
        take: limit,
        include: {
          proveedor: {
            select: {
              id_proveedor: true,
              nombre: true,
              nit: true,
              telefono: true,
              email: true,
            },
          },
          creado_por: {
            select: {
              id_usuario: true,
              username: true,
              email: true,
            },
          },
          aprobado_por: {
            select: {
              id_usuario: true,
              username: true,
              email: true,
            },
          },
          _count: {
            select: {
              detalles: true,
            },
          },
        },
        orderBy: {
          fecha_orden: "desc",
        },
      }),
    ]);

    return sendSuccess(res, {
      ordenes,
      ...buildPagination(page, limit, total),
    });
  } catch (error) {
    console.error("Error al obtener órdenes de compra:", error);
    return sendError(res, "Error al obtener las órdenes de compra", 500);
  }
};

/**
 * Obtener una orden de compra específica con todos sus detalles
 * GET /ordenes-compra/:id_orden_compra
 */
const MostrarOrden = async (req, res) => {
  try {
    const { id_orden_compra } = req.params;

    if (!isValidId(id_orden_compra)) {
      return sendError(res, "ID de orden inválido", 400);
    }

    const orden = await prisma.ordenCompra.findUnique({
      where: { id_orden_compra: parseInt(id_orden_compra) },
      include: {
        proveedor: true,
        creado_por: {
          select: {
            id_usuario: true,
            username: true,
            email: true,
          },
        },
        aprobado_por: {
          select: {
            id_usuario: true,
            username: true,
            email: true,
          },
        },
        detalles: {
          include: {
            producto: {
              include: {
                laboratorio: {
                  select: {
                    id_laboratorio: true,
                    nombre: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!orden) {
      return sendError(res, "Orden de compra no encontrada", 404);
    }

    return sendSuccess(res, { orden });
  } catch (error) {
    console.error("Error al obtener orden de compra:", error);
    return sendError(res, "Error al obtener la orden de compra", 500);
  }
};

/**
 * Crear una nueva orden de compra
 * POST /ordenes-compra
 * Body: { id_proveedor, id_creado_por, fecha_entrega_estimada, notas, detalles: [{ id_producto, cantidad, precio_unitario }] }
 */
const CrearOrden = async (req, res) => {
  try {
    const {
      id_proveedor,
      id_creado_por,
      fecha_entrega_estimada,
      notas,
      detalles,
    } = req.body;

    // Validaciones básicas
    if (!id_proveedor || !id_creado_por) {
      return sendError(
        res,
        "El proveedor y el usuario creador son requeridos",
        400
      );
    }

    if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
      return sendError(
        res,
        "Debe incluir al menos un producto en la orden",
        400
      );
    }

    // Validar que todos los detalles tengan los campos requeridos
    for (const detalle of detalles) {
      if (
        !detalle.id_producto ||
        !detalle.cantidad ||
        !detalle.precio_unitario
      ) {
        return sendError(
          res,
          "Cada detalle debe incluir id_producto, cantidad y precio_unitario",
          400
        );
      }
      if (detalle.cantidad <= 0 || detalle.precio_unitario <= 0) {
        return sendError(
          res,
          "La cantidad y precio unitario deben ser mayores a cero",
          400
        );
      }
    }

    // Verificar que el proveedor existe
    const proveedor = await prisma.proveedor.findUnique({
      where: { id_proveedor: parseInt(id_proveedor) },
    });

    if (!proveedor) {
      return sendError(res, "Proveedor no encontrado", 404);
    }

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: parseInt(id_creado_por) },
    });

    if (!usuario) {
      return sendError(res, "Usuario no encontrado", 404);
    }

    // Verificar que todos los productos existen
    const productosIds = detalles.map((d) => parseInt(d.id_producto));
    const productos = await prisma.producto.findMany({
      where: {
        id_producto: { in: productosIds },
      },
    });

    if (productos.length !== productosIds.length) {
      return sendError(
        res,
        "Uno o más productos no fueron encontrados",
        404
      );
    }

    // Calcular totales
    let subtotal = 0;
    const detallesConSubtotal = detalles.map((detalle) => {
      const subtotalDetalle =
        parseFloat(detalle.cantidad) * parseFloat(detalle.precio_unitario);
      subtotal += subtotalDetalle;
      return {
        id_producto: parseInt(detalle.id_producto),
        cantidad: parseInt(detalle.cantidad),
        precio_unitario: parseFloat(detalle.precio_unitario),
        subtotal: subtotalDetalle,
      };
    });

    // Calcular impuestos (IVA promedio de los productos)
    const productosConIva = await prisma.producto.findMany({
      where: {
        id_producto: { in: productosIds },
      },
      select: {
        id_producto: true,
        iva: true,
      },
    });

    let impuestos = 0;
    detallesConSubtotal.forEach((detalle) => {
      const producto = productosConIva.find(
        (p) => p.id_producto === detalle.id_producto
      );
      if (producto) {
        impuestos += detalle.subtotal * (parseFloat(producto.iva) / 100);
      }
    });

    const total = subtotal + impuestos;

    // Generar número de orden
    const numero_orden = await generarNumeroOrden();

    // Crear la orden con sus detalles
    const orden = await prisma.ordenCompra.create({
      data: {
        numero_orden,
        id_proveedor: parseInt(id_proveedor),
        id_creado_por: parseInt(id_creado_por),
        fecha_entrega_estimada: fecha_entrega_estimada
          ? new Date(fecha_entrega_estimada)
          : null,
        subtotal,
        impuestos,
        total,
        notas: notas || null,
        estado: "pendiente",
        detalles: {
          create: detallesConSubtotal,
        },
      },
      include: {
        proveedor: true,
        creado_por: {
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

    return sendSuccess(
      res,
      { orden },
      201,
      "Orden de compra creada exitosamente"
    );
  } catch (error) {
    console.error("Error al crear orden de compra:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al crear la orden de compra", 500);
  }
};

/**
 * Actualizar una orden de compra (solo si está en estado pendiente)
 * PUT /ordenes-compra/:id_orden_compra
 * Body: { fecha_entrega_estimada, notas, detalles }
 */
const EditarOrden = async (req, res) => {
  try {
    const { id_orden_compra } = req.params;
    const { fecha_entrega_estimada, notas, detalles } = req.body;

    if (!isValidId(id_orden_compra)) {
      return sendError(res, "ID de orden inválido", 400);
    }

    // Verificar que la orden existe
    const ordenExistente = await prisma.ordenCompra.findUnique({
      where: { id_orden_compra: parseInt(id_orden_compra) },
    });

    if (!ordenExistente) {
      return sendError(res, "Orden de compra no encontrada", 404);
    }

    // Solo se puede editar si está pendiente
    if (ordenExistente.estado !== "pendiente") {
      return sendError(
        res,
        `No se puede editar una orden en estado ${ordenExistente.estado}`,
        400
      );
    }

    const dataToUpdate = {};

    if (fecha_entrega_estimada !== undefined) {
      dataToUpdate.fecha_entrega_estimada = fecha_entrega_estimada
        ? new Date(fecha_entrega_estimada)
        : null;
    }

    if (notas !== undefined) {
      dataToUpdate.notas = notas;
    }

    // Si se proporcionan detalles, recalcular totales
    if (detalles && Array.isArray(detalles) && detalles.length > 0) {
      // Validar detalles
      for (const detalle of detalles) {
        if (
          !detalle.id_producto ||
          !detalle.cantidad ||
          !detalle.precio_unitario
        ) {
          return sendError(
            res,
            "Cada detalle debe incluir id_producto, cantidad y precio_unitario",
            400
          );
        }
        if (detalle.cantidad <= 0 || detalle.precio_unitario <= 0) {
          return sendError(
            res,
            "La cantidad y precio unitario deben ser mayores a cero",
            400
          );
        }
      }

      // Calcular nuevos totales
      let subtotal = 0;
      const detallesConSubtotal = detalles.map((detalle) => {
        const subtotalDetalle =
          parseFloat(detalle.cantidad) * parseFloat(detalle.precio_unitario);
        subtotal += subtotalDetalle;
        return {
          id_producto: parseInt(detalle.id_producto),
          cantidad: parseInt(detalle.cantidad),
          precio_unitario: parseFloat(detalle.precio_unitario),
          subtotal: subtotalDetalle,
        };
      });

      // Calcular impuestos
      const productosIds = detalles.map((d) => parseInt(d.id_producto));
      const productosConIva = await prisma.producto.findMany({
        where: {
          id_producto: { in: productosIds },
        },
        select: {
          id_producto: true,
          iva: true,
        },
      });

      let impuestos = 0;
      detallesConSubtotal.forEach((detalle) => {
        const producto = productosConIva.find(
          (p) => p.id_producto === detalle.id_producto
        );
        if (producto) {
          impuestos += detalle.subtotal * (parseFloat(producto.iva) / 100);
        }
      });

      const total = subtotal + impuestos;

      dataToUpdate.subtotal = subtotal;
      dataToUpdate.impuestos = impuestos;
      dataToUpdate.total = total;

      // Eliminar detalles antiguos y crear nuevos
      await prisma.detalleOrdenCompra.deleteMany({
        where: { id_orden_compra: parseInt(id_orden_compra) },
      });

      dataToUpdate.detalles = {
        create: detallesConSubtotal,
      };
    }

    const ordenActualizada = await prisma.ordenCompra.update({
      where: { id_orden_compra: parseInt(id_orden_compra) },
      data: dataToUpdate,
      include: {
        proveedor: true,
        creado_por: {
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

    return sendSuccess(
      res,
      { orden: ordenActualizada },
      200,
      "Orden de compra actualizada exitosamente"
    );
  } catch (error) {
    console.error("Error al actualizar orden de compra:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al actualizar la orden de compra", 500);
  }
};

/**
 * Eliminar una orden de compra (solo si está pendiente)
 * DELETE /ordenes-compra/:id_orden_compra
 */
const EliminarOrden = async (req, res) => {
  try {
    const { id_orden_compra } = req.params;

    if (!isValidId(id_orden_compra)) {
      return sendError(res, "ID de orden inválido", 400);
    }

    const orden = await prisma.ordenCompra.findUnique({
      where: { id_orden_compra: parseInt(id_orden_compra) },
    });

    if (!orden) {
      return sendError(res, "Orden de compra no encontrada", 404);
    }

    // Solo se puede eliminar si está pendiente
    if (orden.estado !== "pendiente") {
      return sendError(
        res,
        `No se puede eliminar una orden en estado ${orden.estado}`,
        400
      );
    }

    await prisma.ordenCompra.delete({
      where: { id_orden_compra: parseInt(id_orden_compra) },
    });

    return sendSuccess(res, null, 200, "Orden de compra eliminada exitosamente");
  } catch (error) {
    console.error("Error al eliminar orden de compra:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al eliminar la orden de compra", 500);
  }
};

/**
 * Aprobar una orden de compra
 * PUT /ordenes-compra/:id_orden_compra/aprobar
 * Body: { id_usuario }
 */
const AprobarOrden = async (req, res) => {
  try {
    const { id_orden_compra } = req.params;
    const { id_usuario } = req.body;

    if (!isValidId(id_orden_compra)) {
      return sendError(res, "ID de orden inválido", 400);
    }

    if (!id_usuario) {
      return sendError(res, "El ID del usuario aprobador es requerido", 400);
    }

    const orden = await prisma.ordenCompra.findUnique({
      where: { id_orden_compra: parseInt(id_orden_compra) },
    });

    if (!orden) {
      return sendError(res, "Orden de compra no encontrada", 404);
    }

    if (orden.estado !== "pendiente") {
      return sendError(
        res,
        `No se puede aprobar una orden en estado ${orden.estado}`,
        400
      );
    }

    const ordenAprobada = await prisma.ordenCompra.update({
      where: { id_orden_compra: parseInt(id_orden_compra) },
      data: {
        estado: "aprobada",
        id_aprobado_por: parseInt(id_usuario),
        fecha_aprobacion: new Date(),
        motivo_rechazo: null,
      },
      include: {
        proveedor: true,
        creado_por: {
          select: {
            id_usuario: true,
            username: true,
            email: true,
          },
        },
        aprobado_por: {
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

    return sendSuccess(
      res,
      { orden: ordenAprobada },
      200,
      "Orden de compra aprobada exitosamente"
    );
  } catch (error) {
    console.error("Error al aprobar orden de compra:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al aprobar la orden de compra", 500);
  }
};

/**
 * Rechazar una orden de compra
 * PUT /ordenes-compra/:id_orden_compra/rechazar
 * Body: { id_usuario, motivo_rechazo }
 */
const RechazarOrden = async (req, res) => {
  try {
    const { id_orden_compra } = req.params;
    const { id_usuario, motivo_rechazo } = req.body;

    if (!isValidId(id_orden_compra)) {
      return sendError(res, "ID de orden inválido", 400);
    }

    if (!id_usuario) {
      return sendError(res, "El ID del usuario es requerido", 400);
    }

    if (!motivo_rechazo || motivo_rechazo.trim() === "") {
      return sendError(res, "El motivo de rechazo es requerido", 400);
    }

    const orden = await prisma.ordenCompra.findUnique({
      where: { id_orden_compra: parseInt(id_orden_compra) },
    });

    if (!orden) {
      return sendError(res, "Orden de compra no encontrada", 404);
    }

    if (orden.estado !== "pendiente") {
      return sendError(
        res,
        `No se puede rechazar una orden en estado ${orden.estado}`,
        400
      );
    }

    const ordenRechazada = await prisma.ordenCompra.update({
      where: { id_orden_compra: parseInt(id_orden_compra) },
      data: {
        estado: "rechazada",
        id_aprobado_por: parseInt(id_usuario),
        fecha_aprobacion: new Date(),
        motivo_rechazo: motivo_rechazo.trim(),
      },
      include: {
        proveedor: true,
        creado_por: {
          select: {
            id_usuario: true,
            username: true,
            email: true,
          },
        },
        aprobado_por: {
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

    return sendSuccess(
      res,
      { orden: ordenRechazada },
      200,
      "Orden de compra rechazada exitosamente"
    );
  } catch (error) {
    console.error("Error al rechazar orden de compra:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al rechazar la orden de compra", 500);
  }
};

/**
 * Completar una orden de compra (marcar como recibida)
 * PUT /ordenes-compra/:id_orden_compra/completar
 */
const CompletarOrden = async (req, res) => {
  try {
    const { id_orden_compra } = req.params;

    if (!isValidId(id_orden_compra)) {
      return sendError(res, "ID de orden inválido", 400);
    }

    const orden = await prisma.ordenCompra.findUnique({
      where: { id_orden_compra: parseInt(id_orden_compra) },
    });

    if (!orden) {
      return sendError(res, "Orden de compra no encontrada", 404);
    }

    if (orden.estado !== "aprobada") {
      return sendError(
        res,
        `Solo se pueden completar órdenes aprobadas`,
        400
      );
    }

    const ordenCompletada = await prisma.ordenCompra.update({
      where: { id_orden_compra: parseInt(id_orden_compra) },
      data: {
        estado: "completada",
      },
      include: {
        proveedor: true,
        creado_por: {
          select: {
            id_usuario: true,
            username: true,
            email: true,
          },
        },
        aprobado_por: {
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

    return sendSuccess(
      res,
      { orden: ordenCompletada },
      200,
      "Orden de compra completada exitosamente"
    );
  } catch (error) {
    console.error("Error al completar orden de compra:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al completar la orden de compra", 500);
  }
};

/**
 * Obtener estadísticas de órdenes de compra
 * GET /ordenes-compra/estadisticas
 */
const ObtenerEstadisticas = async (req, res) => {
  try {
    const [
      totalOrdenes,
      ordenesPendientes,
      ordenesAprobadas,
      ordenesRechazadas,
      ordenesCompletadas,
      montoTotal,
    ] = await Promise.all([
      prisma.ordenCompra.count(),
      prisma.ordenCompra.count({ where: { estado: "pendiente" } }),
      prisma.ordenCompra.count({ where: { estado: "aprobada" } }),
      prisma.ordenCompra.count({ where: { estado: "rechazada" } }),
      prisma.ordenCompra.count({ where: { estado: "completada" } }),
      prisma.ordenCompra.aggregate({
        _sum: {
          total: true,
        },
        where: {
          estado: {
            in: ["aprobada", "completada"],
          },
        },
      }),
    ]);

    const estadisticas = {
      totalOrdenes,
      ordenesPendientes,
      ordenesAprobadas,
      ordenesRechazadas,
      ordenesCompletadas,
      montoTotal: montoTotal._sum.total || 0,
    };

    return sendSuccess(res, { estadisticas });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return sendError(res, "Error al obtener las estadísticas", 500);
  }
};

module.exports = {
  MostrarOrdenes,
  MostrarOrden,
  CrearOrden,
  EditarOrden,
  EliminarOrden,
  AprobarOrden,
  RechazarOrden,
  CompletarOrden,
  ObtenerEstadisticas,
};
