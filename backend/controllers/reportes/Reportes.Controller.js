/**
 * Controlador de Reportes de Compras (RF005)
 * Genera reportes de compras por período, proveedor, laboratorio y otros criterios
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { sendSuccess, sendError } = require("../../helpers/response.helper");

/**
 * Obtener reporte general de compras con filtros
 * GET /reportes/compras
 * Query params: fecha_desde, fecha_hasta, id_proveedor, id_laboratorio, estado, agrupar_por
 */
const ObtenerReporteCompras = async (req, res) => {
  try {
    const {
      fecha_desde,
      fecha_hasta,
      id_proveedor,
      id_laboratorio,
      estado,
      agrupar_por, // 'proveedor', 'laboratorio', 'mes', 'estado'
      page = 1,
      limit = 50,
    } = req.query;

    // Construir filtros
    const filtros = {};

    // Filtro por rango de fechas
    if (fecha_desde || fecha_hasta) {
      filtros.fecha_orden = {};
      if (fecha_desde) {
        filtros.fecha_orden.gte = new Date(fecha_desde);
      }
      if (fecha_hasta) {
        // Incluir todo el día
        const fechaHastaFin = new Date(fecha_hasta);
        fechaHastaFin.setHours(23, 59, 59, 999);
        filtros.fecha_orden.lte = fechaHastaFin;
      }
    }

    // Filtro por proveedor
    if (id_proveedor) {
      filtros.id_proveedor = parseInt(id_proveedor);
    }

    // Filtro por estado
    if (estado) {
      filtros.estado = estado;
    }

    // Filtro por laboratorio (requiere join con productos)
    let filtroLaboratorio = {};
    if (id_laboratorio) {
      filtroLaboratorio = {
        detalles: {
          some: {
            producto: {
              id_laboratorio: parseInt(id_laboratorio),
            },
          },
        },
      };
    }

    // Combinar filtros
    const whereClause = { ...filtros, ...filtroLaboratorio };

    // Obtener órdenes con paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [ordenes, totalOrdenes] = await Promise.all([
      prisma.ordenCompra.findMany({
        where: whereClause,
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
                  laboratorio: true,
                },
              },
            },
          },
        },
        orderBy: {
          fecha_orden: "desc",
        },
        skip,
        take: parseInt(limit),
      }),
      prisma.ordenCompra.count({ where: whereClause }),
    ]);

    // Calcular estadísticas generales
    const estadisticas = await calcularEstadisticas(whereClause);

    // Si se requiere agrupación
    let datosAgrupados = null;
    if (agrupar_por) {
      datosAgrupados = await agruparDatos(whereClause, agrupar_por);
    }

    return sendSuccess(res, {
      ordenes,
      paginacion: {
        total: totalOrdenes,
        pagina: parseInt(page),
        limite: parseInt(limit),
        totalPaginas: Math.ceil(totalOrdenes / parseInt(limit)),
      },
      estadisticas,
      datosAgrupados,
      filtrosAplicados: {
        fecha_desde,
        fecha_hasta,
        id_proveedor,
        id_laboratorio,
        estado,
        agrupar_por,
      },
    });
  } catch (error) {
    console.error("Error al obtener reporte de compras:", error);
    return sendError(res, "Error al generar el reporte de compras", 500);
  }
};

/**
 * Calcular estadísticas generales del reporte
 */
const calcularEstadisticas = async (whereClause) => {
  const [totalOrdenes, totales, distribucionEstados] = await Promise.all([
    prisma.ordenCompra.count({ where: whereClause }),
    prisma.ordenCompra.aggregate({
      where: whereClause,
      _sum: {
        subtotal: true,
        impuestos: true,
        total: true,
      },
      _avg: {
        total: true,
      },
    }),
    prisma.ordenCompra.groupBy({
      by: ["estado"],
      where: whereClause,
      _count: {
        estado: true,
      },
      _sum: {
        total: true,
      },
    }),
  ]);

  return {
    totalOrdenes,
    montoTotal: totales._sum.total || 0,
    subtotalTotal: totales._sum.subtotal || 0,
    impuestosTotal: totales._sum.impuestos || 0,
    promedioOrden: totales._avg.total || 0,
    distribucionEstados: distribucionEstados.map((d) => ({
      estado: d.estado,
      cantidad: d._count.estado,
      monto: d._sum.total || 0,
    })),
  };
};

/**
 * Agrupar datos según criterio
 */
const agruparDatos = async (whereClause, criterio) => {
  switch (criterio) {
    case "proveedor":
      return await agruparPorProveedor(whereClause);
    case "laboratorio":
      return await agruparPorLaboratorio(whereClause);
    case "mes":
      return await agruparPorMes(whereClause);
    case "estado":
      return await agruparPorEstado(whereClause);
    default:
      return null;
  }
};

/**
 * Agrupar por proveedor
 */
const agruparPorProveedor = async (whereClause) => {
  const ordenes = await prisma.ordenCompra.findMany({
    where: whereClause,
    include: {
      proveedor: true,
    },
  });

  const agrupado = {};
  ordenes.forEach((orden) => {
    const proveedorId = orden.id_proveedor;
    if (!agrupado[proveedorId]) {
      agrupado[proveedorId] = {
        proveedor: orden.proveedor,
        cantidadOrdenes: 0,
        montoTotal: 0,
        ordenes: [],
      };
    }
    agrupado[proveedorId].cantidadOrdenes++;
    agrupado[proveedorId].montoTotal += parseFloat(orden.total);
    agrupado[proveedorId].ordenes.push({
      numero_orden: orden.numero_orden,
      fecha_orden: orden.fecha_orden,
      estado: orden.estado,
      total: orden.total,
    });
  });

  return Object.values(agrupado).sort(
    (a, b) => b.montoTotal - a.montoTotal
  );
};

/**
 * Agrupar por laboratorio
 */
const agruparPorLaboratorio = async (whereClause) => {
  const ordenes = await prisma.ordenCompra.findMany({
    where: whereClause,
    include: {
      detalles: {
        include: {
          producto: {
            include: {
              laboratorio: true,
            },
          },
        },
      },
    },
  });

  const agrupado = {};
  ordenes.forEach((orden) => {
    orden.detalles.forEach((detalle) => {
      const labId = detalle.producto.id_laboratorio;
      if (!agrupado[labId]) {
        agrupado[labId] = {
          laboratorio: detalle.producto.laboratorio,
          cantidadProductos: 0,
          cantidadUnidades: 0,
          montoTotal: 0,
        };
      }
      agrupado[labId].cantidadProductos++;
      agrupado[labId].cantidadUnidades += detalle.cantidad;
      agrupado[labId].montoTotal += parseFloat(detalle.subtotal);
    });
  });

  return Object.values(agrupado).sort(
    (a, b) => b.montoTotal - a.montoTotal
  );
};

/**
 * Agrupar por mes
 */
const agruparPorMes = async (whereClause) => {
  const ordenes = await prisma.ordenCompra.findMany({
    where: whereClause,
    orderBy: {
      fecha_orden: "asc",
    },
  });

  const agrupado = {};
  ordenes.forEach((orden) => {
    const fecha = new Date(orden.fecha_orden);
    const mesAnio = `${fecha.getFullYear()}-${String(
      fecha.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!agrupado[mesAnio]) {
      agrupado[mesAnio] = {
        periodo: mesAnio,
        mes: fecha.getMonth() + 1,
        anio: fecha.getFullYear(),
        cantidadOrdenes: 0,
        montoTotal: 0,
        ordenes: [],
      };
    }
    agrupado[mesAnio].cantidadOrdenes++;
    agrupado[mesAnio].montoTotal += parseFloat(orden.total);
    agrupado[mesAnio].ordenes.push({
      numero_orden: orden.numero_orden,
      fecha_orden: orden.fecha_orden,
      estado: orden.estado,
      total: orden.total,
    });
  });

  return Object.values(agrupado).sort((a, b) => {
    return a.periodo.localeCompare(b.periodo);
  });
};

/**
 * Agrupar por estado
 */
const agruparPorEstado = async (whereClause) => {
  const resultado = await prisma.ordenCompra.groupBy({
    by: ["estado"],
    where: whereClause,
    _count: {
      estado: true,
    },
    _sum: {
      total: true,
      subtotal: true,
      impuestos: true,
    },
  });

  return resultado.map((r) => ({
    estado: r.estado,
    cantidadOrdenes: r._count.estado,
    montoTotal: r._sum.total || 0,
    subtotal: r._sum.subtotal || 0,
    impuestos: r._sum.impuestos || 0,
  }));
};

/**
 * Obtener top proveedores por volumen de compras
 * GET /reportes/top-proveedores
 */
const ObtenerTopProveedores = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, limite = 10 } = req.query;

    const filtros = {};
    if (fecha_desde || fecha_hasta) {
      filtros.fecha_orden = {};
      if (fecha_desde) filtros.fecha_orden.gte = new Date(fecha_desde);
      if (fecha_hasta) {
        const fechaHastaFin = new Date(fecha_hasta);
        fechaHastaFin.setHours(23, 59, 59, 999);
        filtros.fecha_orden.lte = fechaHastaFin;
      }
    }

    const ordenes = await prisma.ordenCompra.findMany({
      where: {
        ...filtros,
        estado: {
          in: ["aprobada", "en_proceso", "completada"],
        },
      },
      include: {
        proveedor: true,
      },
    });

    const proveedoresMap = {};
    ordenes.forEach((orden) => {
      const provId = orden.id_proveedor;
      if (!proveedoresMap[provId]) {
        proveedoresMap[provId] = {
          proveedor: orden.proveedor,
          cantidadOrdenes: 0,
          montoTotal: 0,
        };
      }
      proveedoresMap[provId].cantidadOrdenes++;
      proveedoresMap[provId].montoTotal += parseFloat(orden.total);
    });

    const topProveedores = Object.values(proveedoresMap)
      .sort((a, b) => b.montoTotal - a.montoTotal)
      .slice(0, parseInt(limite));

    return sendSuccess(res, { topProveedores });
  } catch (error) {
    console.error("Error al obtener top proveedores:", error);
    return sendError(res, "Error al obtener top proveedores", 500);
  }
};

/**
 * Obtener tendencias de compras (por mes)
 * GET /reportes/tendencias
 */
const ObtenerTendencias = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, id_proveedor } = req.query;

    const filtros = {};
    if (fecha_desde || fecha_hasta) {
      filtros.fecha_orden = {};
      if (fecha_desde) filtros.fecha_orden.gte = new Date(fecha_desde);
      if (fecha_hasta) {
        const fechaHastaFin = new Date(fecha_hasta);
        fechaHastaFin.setHours(23, 59, 59, 999);
        filtros.fecha_orden.lte = fechaHastaFin;
      }
    }
    if (id_proveedor) {
      filtros.id_proveedor = parseInt(id_proveedor);
    }

    const ordenes = await prisma.ordenCompra.findMany({
      where: filtros,
      orderBy: {
        fecha_orden: "asc",
      },
    });

    // Agrupar por mes
    const tendenciasPorMes = {};
    ordenes.forEach((orden) => {
      const fecha = new Date(orden.fecha_orden);
      const mesAnio = `${fecha.getFullYear()}-${String(
        fecha.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!tendenciasPorMes[mesAnio]) {
        tendenciasPorMes[mesAnio] = {
          periodo: mesAnio,
          mes: fecha.getMonth() + 1,
          anio: fecha.getFullYear(),
          cantidadOrdenes: 0,
          montoTotal: 0,
          ordenesCompletadas: 0,
          ordenesRechazadas: 0,
          ordenesPendientes: 0,
        };
      }

      tendenciasPorMes[mesAnio].cantidadOrdenes++;
      tendenciasPorMes[mesAnio].montoTotal += parseFloat(orden.total);

      if (orden.estado === "completada") {
        tendenciasPorMes[mesAnio].ordenesCompletadas++;
      } else if (orden.estado === "rechazada") {
        tendenciasPorMes[mesAnio].ordenesRechazadas++;
      } else if (orden.estado === "pendiente") {
        tendenciasPorMes[mesAnio].ordenesPendientes++;
      }
    });

    const tendencias = Object.values(tendenciasPorMes).sort((a, b) =>
      a.periodo.localeCompare(b.periodo)
    );

    return sendSuccess(res, { tendencias });
  } catch (error) {
    console.error("Error al obtener tendencias:", error);
    return sendError(res, "Error al obtener tendencias", 500);
  }
};

/**
 * Exportar reporte a CSV
 * GET /reportes/exportar-csv
 */
const ExportarReporteCSV = async (req, res) => {
  try {
    const {
      fecha_desde,
      fecha_hasta,
      id_proveedor,
      id_laboratorio,
      estado,
    } = req.query;

    // Construir filtros (similar a ObtenerReporteCompras)
    const filtros = {};
    if (fecha_desde || fecha_hasta) {
      filtros.fecha_orden = {};
      if (fecha_desde) filtros.fecha_orden.gte = new Date(fecha_desde);
      if (fecha_hasta) {
        const fechaHastaFin = new Date(fecha_hasta);
        fechaHastaFin.setHours(23, 59, 59, 999);
        filtros.fecha_orden.lte = fechaHastaFin;
      }
    }
    if (id_proveedor) filtros.id_proveedor = parseInt(id_proveedor);
    if (estado) filtros.estado = estado;

    let filtroLaboratorio = {};
    if (id_laboratorio) {
      filtroLaboratorio = {
        detalles: {
          some: {
            producto: {
              id_laboratorio: parseInt(id_laboratorio),
            },
          },
        },
      };
    }

    const whereClause = { ...filtros, ...filtroLaboratorio };

    const ordenes = await prisma.ordenCompra.findMany({
      where: whereClause,
      include: {
        proveedor: true,
        detalles: {
          include: {
            producto: {
              include: {
                laboratorio: true,
              },
            },
          },
        },
      },
      orderBy: {
        fecha_orden: "desc",
      },
    });

    // Generar CSV
    const csvHeaders = [
      "Número Orden",
      "Fecha Orden",
      "Proveedor",
      "Estado",
      "Subtotal",
      "Impuestos",
      "Total",
      "Cantidad Items",
    ];

    let csvContent = csvHeaders.join(",") + "\n";

    ordenes.forEach((orden) => {
      const fila = [
        orden.numero_orden,
        new Date(orden.fecha_orden).toLocaleDateString("es-CO"),
        `"${orden.proveedor.nombre}"`,
        orden.estado,
        orden.subtotal,
        orden.impuestos,
        orden.total,
        orden.detalles.length,
      ];
      csvContent += fila.join(",") + "\n";
    });

    // Configurar headers para descarga
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="reporte_compras_${new Date().getTime()}.csv"`
    );

    return res.send("\uFEFF" + csvContent); // BOM para UTF-8
  } catch (error) {
    console.error("Error al exportar reporte:", error);
    return sendError(res, "Error al exportar el reporte", 500);
  }
};

/**
 * Obtener resumen ejecutivo
 * GET /reportes/resumen-ejecutivo
 */
const ObtenerResumenEjecutivo = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;

    const filtros = {};
    if (fecha_desde || fecha_hasta) {
      filtros.fecha_orden = {};
      if (fecha_desde) filtros.fecha_orden.gte = new Date(fecha_desde);
      if (fecha_hasta) {
        const fechaHastaFin = new Date(fecha_hasta);
        fechaHastaFin.setHours(23, 59, 59, 999);
        filtros.fecha_orden.lte = fechaHastaFin;
      }
    }

    const [
      estadisticasGenerales,
      topProveedores,
      topLaboratorios,
      distribucionEstados,
    ] = await Promise.all([
      calcularEstadisticas(filtros),
      agruparPorProveedor(filtros),
      agruparPorLaboratorio(filtros),
      agruparPorEstado(filtros),
    ]);

    return sendSuccess(res, {
      periodo: {
        desde: fecha_desde || "Inicio",
        hasta: fecha_hasta || "Hoy",
      },
      estadisticasGenerales,
      topProveedores: topProveedores.slice(0, 5),
      topLaboratorios: topLaboratorios.slice(0, 5),
      distribucionEstados,
    });
  } catch (error) {
    console.error("Error al obtener resumen ejecutivo:", error);
    return sendError(res, "Error al obtener resumen ejecutivo", 500);
  }
};

module.exports = {
  ObtenerReporteCompras,
  ObtenerTopProveedores,
  ObtenerTendencias,
  ExportarReporteCSV,
  ObtenerResumenEjecutivo,
};
