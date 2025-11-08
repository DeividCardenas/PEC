/**
 * Controlador de Inventario - RF003
 * Gestión de inventario y control de stock
 */

const { PrismaClient } = require("@prisma/client");
const {
  sendSuccess,
  sendError,
  handlePrismaError,
} = require("../../helpers/responseHandler");
const prisma = new PrismaClient();

/**
 * Validar que un ID sea un número positivo
 */
const isValidId = (id) => {
  const num = parseInt(id);
  return !isNaN(num) && num > 0;
};

/**
 * Obtener productos con stock bajo (alertas)
 * GET /inventario/alertas
 * RF003: Alertar sobre productos con stock mínimo
 */
const ObtenerAlertasStockBajo = async (req, res) => {
  try {
    const {
      pagina = 1,
      limite = 20,
      ordenar_por = "stock_actual",
      orden = "asc",
    } = req.query;

    const paginaNum = Math.max(1, parseInt(pagina));
    const limiteNum = Math.max(1, Math.min(100, parseInt(limite)));
    const skip = (paginaNum - 1) * limiteNum;

    // Usar queryRaw para comparar dos columnas (stock_actual <= stock_minimo)
    const productos = await prisma.$queryRaw`
      SELECT
        p.id_producto,
        p.cum,
        p.descripcion,
        p.concentracion,
        p.presentacion,
        p.stock_actual,
        p.stock_minimo,
        p.stock_maximo,
        p.unidad_medida,
        p.precio_unidad,
        p.id_laboratorio,
        l.nombre as laboratorio_nombre
      FROM producto p
      LEFT JOIN laboratorio l ON p.id_laboratorio = l.id_laboratorio
      WHERE p.stock_actual <= p.stock_minimo
      ORDER BY p.${prisma.raw(ordenar_por)} ${prisma.raw(orden)}
      LIMIT ${limiteNum} OFFSET ${skip}
    `;

    const totalResult = await prisma.$queryRaw`
      SELECT COUNT(*) as total
      FROM producto
      WHERE stock_actual <= stock_minimo
    `;
    const total = Number(totalResult[0]?.total || 0);

    // Calcular déficit para cada producto y formatear
    const productosConDeficit = productos.map((producto) => ({
      ...producto,
      id_producto: Number(producto.id_producto),
      stock_actual: Number(producto.stock_actual) || 0,
      stock_minimo: Number(producto.stock_minimo) || 0,
      stock_maximo: Number(producto.stock_maximo) || 0,
      laboratorio: producto.laboratorio_nombre ? {
        id_laboratorio: Number(producto.id_laboratorio),
        nombre: producto.laboratorio_nombre
      } : null,
      deficit: Math.max(0, Number(producto.stock_minimo) - Number(producto.stock_actual)),
      porcentaje_stock:
        Number(producto.stock_minimo) > 0
          ? Math.round((Number(producto.stock_actual) / Number(producto.stock_minimo)) * 100)
          : 0,
    }));

    return sendSuccess(
      res,
      {
        productos: productosConDeficit,
        total,
        pagina: paginaNum,
        limite: limiteNum,
        total_paginas: Math.ceil(total / limiteNum),
      },
      200,
      "Alertas de stock bajo obtenidas exitosamente"
    );
  } catch (error) {
    console.error("Error al obtener alertas de stock bajo:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al obtener alertas de stock bajo", 500);
  }
};

/**
 * Obtener todos los movimientos de inventario
 * GET /inventario/movimientos
 */
const ObtenerMovimientosInventario = async (req, res) => {
  try {
    const {
      pagina = 1,
      limite = 50,
      tipo_movimiento,
      id_producto,
      fecha_inicio,
      fecha_fin,
    } = req.query;

    const paginaNum = Math.max(1, parseInt(pagina));
    const limiteNum = Math.max(1, Math.min(100, parseInt(limite)));
    const skip = (paginaNum - 1) * limiteNum;

    // Construir filtros
    const where = {};

    if (tipo_movimiento) {
      where.tipo_movimiento = tipo_movimiento;
    }

    if (id_producto && isValidId(id_producto)) {
      where.id_producto = parseInt(id_producto);
    }

    if (fecha_inicio || fecha_fin) {
      where.creado_en = {};
      if (fecha_inicio) {
        where.creado_en.gte = new Date(fecha_inicio);
      }
      if (fecha_fin) {
        where.creado_en.lte = new Date(fecha_fin);
      }
    }

    const [movimientos, total] = await Promise.all([
      prisma.movimientoInventario.findMany({
        where,
        include: {
          producto: {
            select: {
              id_producto: true,
              descripcion: true,
              cum: true,
              unidad_medida: true,
            },
          },
          usuario: {
            select: {
              id_usuario: true,
              username: true,
              email: true,
            },
          },
          orden_compra: {
            select: {
              id_orden_compra: true,
              numero_orden: true,
            },
          },
        },
        orderBy: {
          creado_en: "desc",
        },
        skip,
        take: limiteNum,
      }),
      prisma.movimientoInventario.count({ where }),
    ]);

    return sendSuccess(
      res,
      {
        movimientos,
        total,
        pagina: paginaNum,
        limite: limiteNum,
        total_paginas: Math.ceil(total / limiteNum),
      },
      200,
      "Movimientos de inventario obtenidos exitosamente"
    );
  } catch (error) {
    console.error("Error al obtener movimientos de inventario:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al obtener movimientos de inventario", 500);
  }
};

/**
 * Obtener movimientos de un producto específico
 * GET /inventario/productos/:id_producto/movimientos
 */
const ObtenerMovimientosProducto = async (req, res) => {
  try {
    const { id_producto } = req.params;
    const { limite = 20 } = req.query;

    if (!isValidId(id_producto)) {
      return sendError(res, "ID de producto inválido", 400);
    }

    const limiteNum = Math.max(1, Math.min(100, parseInt(limite)));

    const [producto, movimientos] = await Promise.all([
      prisma.producto.findUnique({
        where: { id_producto: parseInt(id_producto) },
        select: {
          id_producto: true,
          descripcion: true,
          cum: true,
          stock_actual: true,
          stock_minimo: true,
          stock_maximo: true,
          unidad_medida: true,
        },
      }),
      prisma.movimientoInventario.findMany({
        where: { id_producto: parseInt(id_producto) },
        include: {
          usuario: {
            select: {
              id_usuario: true,
              username: true,
            },
          },
          orden_compra: {
            select: {
              id_orden_compra: true,
              numero_orden: true,
            },
          },
        },
        orderBy: {
          creado_en: "desc",
        },
        take: limiteNum,
      }),
    ]);

    if (!producto) {
      return sendError(res, "Producto no encontrado", 404);
    }

    return sendSuccess(
      res,
      {
        producto,
        movimientos,
        total_movimientos: movimientos.length,
      },
      200,
      "Movimientos del producto obtenidos exitosamente"
    );
  } catch (error) {
    console.error("Error al obtener movimientos del producto:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al obtener movimientos del producto", 500);
  }
};

/**
 * Ajustar stock de un producto manualmente
 * POST /inventario/ajustar
 */
const AjustarStock = async (req, res) => {
  try {
    const { id_producto, cantidad, motivo, tipo_ajuste = "ajuste" } = req.body;
    const id_usuario = req.usuario?.id_usuario;

    // Validaciones
    if (!isValidId(id_producto)) {
      return sendError(res, "ID de producto inválido", 400);
    }

    if (!cantidad || isNaN(cantidad)) {
      return sendError(res, "Cantidad inválida", 400);
    }

    const cantidadNum = parseInt(cantidad);

    if (!motivo || motivo.trim() === "") {
      return sendError(res, "Debe proporcionar un motivo para el ajuste", 400);
    }

    const tiposValidos = ["ajuste", "salida", "devolucion"];
    if (!tiposValidos.includes(tipo_ajuste)) {
      return sendError(
        res,
        `Tipo de ajuste inválido. Debe ser: ${tiposValidos.join(", ")}`,
        400
      );
    }

    // Obtener producto actual
    const producto = await prisma.producto.findUnique({
      where: { id_producto: parseInt(id_producto) },
    });

    if (!producto) {
      return sendError(res, "Producto no encontrado", 404);
    }

    const stockAnterior = producto.stock_actual;
    let stockNuevo;

    // Calcular nuevo stock según tipo de ajuste
    if (tipo_ajuste === "salida") {
      // Para salidas, restar la cantidad
      stockNuevo = stockAnterior - Math.abs(cantidadNum);
      if (stockNuevo < 0) {
        return sendError(
          res,
          `Stock insuficiente. Stock actual: ${stockAnterior}, cantidad solicitada: ${Math.abs(
            cantidadNum
          )}`,
          400
        );
      }
    } else {
      // Para ajustes y devoluciones, sumar
      stockNuevo = stockAnterior + cantidadNum;
    }

    // Usar transacción para actualizar stock y crear movimiento
    const resultado = await prisma.$transaction(async (tx) => {
      // Actualizar stock del producto
      const productoActualizado = await tx.producto.update({
        where: { id_producto: parseInt(id_producto) },
        data: {
          stock_actual: stockNuevo,
        },
      });

      // Crear movimiento de inventario
      const movimiento = await tx.movimientoInventario.create({
        data: {
          id_producto: parseInt(id_producto),
          tipo_movimiento: tipo_ajuste,
          cantidad: tipo_ajuste === "salida" ? -Math.abs(cantidadNum) : cantidadNum,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          id_usuario: id_usuario || null,
          motivo: motivo,
        },
        include: {
          producto: {
            select: {
              id_producto: true,
              descripcion: true,
              cum: true,
              stock_actual: true,
              stock_minimo: true,
              unidad_medida: true,
            },
          },
          usuario: {
            select: {
              id_usuario: true,
              username: true,
            },
          },
        },
      });

      return { producto: productoActualizado, movimiento };
    });

    return sendSuccess(
      res,
      resultado,
      200,
      "Stock ajustado exitosamente"
    );
  } catch (error) {
    console.error("Error al ajustar stock:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al ajustar stock", 500);
  }
};

/**
 * Obtener estadísticas de inventario
 * GET /inventario/estadisticas
 */
const ObtenerEstadisticasInventario = async (req, res) => {
  try {
    const [
      totalProductos,
      productosConStock,
      productosSinStock,
      valorTotalInventario,
      movimientosHoy,
    ] = await Promise.all([
      prisma.producto.count(),
      prisma.producto.count({
        where: {
          stock_actual: {
            gt: 0,
          },
        },
      }),
      prisma.producto.count({
        where: {
          stock_actual: 0,
        },
      }),
      prisma.producto.aggregate({
        _sum: {
          stock_actual: true,
        },
      }),
      prisma.movimientoInventario.count({
        where: {
          creado_en: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    // Obtener productos con stock bajo usando queryRaw
    const productosStockBajoResult = await prisma.$queryRaw`
      SELECT COUNT(*) as total
      FROM producto
      WHERE stock_actual <= stock_minimo
    `;
    const productosStockBajo = Number(productosStockBajoResult[0]?.total || 0);

    // Obtener productos más movidos (últimos 30 días)
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - 30);

    const productosMasMovidos = await prisma.movimientoInventario.groupBy({
      by: ["id_producto"],
      _count: {
        id_movimiento: true,
      },
      where: {
        creado_en: {
          gte: fechaInicio,
        },
      },
      orderBy: {
        _count: {
          id_movimiento: "desc",
        },
      },
      take: 5,
    });

    // Obtener detalles de productos más movidos
    const idsProductosMasMovidos = productosMasMovidos.map(
      (p) => p.id_producto
    );
    const detallesProductos = await prisma.producto.findMany({
      where: {
        id_producto: {
          in: idsProductosMasMovidos,
        },
      },
      select: {
        id_producto: true,
        descripcion: true,
        stock_actual: true,
        unidad_medida: true,
      },
    });

    const productosMasMovidosConDetalles = productosMasMovidos.map((pm) => {
      const detalle = detallesProductos.find(
        (dp) => dp.id_producto === pm.id_producto
      );
      return {
        ...detalle,
        total_movimientos: pm._count.id_movimiento,
      };
    });

    return sendSuccess(
      res,
      {
        total_productos: totalProductos,
        productos_con_stock: productosConStock,
        productos_sin_stock: productosSinStock,
        productos_stock_bajo: productosStockBajo,
        unidades_totales_stock: valorTotalInventario._sum.stock_actual || 0,
        movimientos_hoy: movimientosHoy,
        productos_mas_movidos: productosMasMovidosConDetalles,
      },
      200,
      "Estadísticas de inventario obtenidas exitosamente"
    );
  } catch (error) {
    console.error("Error al obtener estadísticas de inventario:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al obtener estadísticas de inventario", 500);
  }
};

/**
 * Actualizar stock mínimo de un producto
 * PUT /inventario/productos/:id_producto/stock-minimo
 */
const ActualizarStockMinimo = async (req, res) => {
  try {
    const { id_producto } = req.params;
    const { stock_minimo, stock_maximo } = req.body;

    if (!isValidId(id_producto)) {
      return sendError(res, "ID de producto inválido", 400);
    }

    if (stock_minimo === undefined || stock_minimo < 0) {
      return sendError(res, "Stock mínimo inválido", 400);
    }

    const data = {
      stock_minimo: parseInt(stock_minimo),
    };

    if (stock_maximo !== undefined) {
      if (stock_maximo < 0) {
        return sendError(res, "Stock máximo inválido", 400);
      }
      data.stock_maximo = parseInt(stock_maximo);

      if (data.stock_maximo < data.stock_minimo) {
        return sendError(
          res,
          "El stock máximo no puede ser menor que el stock mínimo",
          400
        );
      }
    }

    const productoActualizado = await prisma.producto.update({
      where: { id_producto: parseInt(id_producto) },
      data,
      select: {
        id_producto: true,
        descripcion: true,
        cum: true,
        stock_actual: true,
        stock_minimo: true,
        stock_maximo: true,
        unidad_medida: true,
      },
    });

    return sendSuccess(
      res,
      { producto: productoActualizado },
      200,
      "Stock mínimo actualizado exitosamente"
    );
  } catch (error) {
    console.error("Error al actualizar stock mínimo:", error);
    if (error.code) {
      return handlePrismaError(res, error);
    }
    return sendError(res, "Error al actualizar stock mínimo", 500);
  }
};

module.exports = {
  ObtenerAlertasStockBajo,
  ObtenerMovimientosInventario,
  ObtenerMovimientosProducto,
  AjustarStock,
  ObtenerEstadisticasInventario,
  ActualizarStockMinimo,
};
