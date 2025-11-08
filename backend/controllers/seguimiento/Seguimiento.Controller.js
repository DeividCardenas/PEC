/**
 * Controller de Seguimiento en Tiempo Real (RF010)
 *
 * Funcionalidades:
 * - Actualizar ubicación de domiciliario
 * - Obtener ubicación actual de domiciliario
 * - Obtener ubicaciones de ruta activa
 * - Simular movimiento de domiciliario
 */

const prisma = require("../../config/database");

/**
 * Actualizar la ubicación actual de un domiciliario
 * @route PUT /api/seguimiento/domiciliario/:id/ubicacion
 * @access Privado (permisos: actualizar_ubicacion)
 */
const ActualizarUbicacion = async (req, res) => {
  const { id } = req.params;
  const { latitud, longitud } = req.body;

  try {
    // Validar datos requeridos
    if (latitud === undefined || longitud === undefined) {
      return res.status(400).json({
        success: false,
        message: "Latitud y longitud son requeridos",
      });
    }

    // Validar rangos de coordenadas
    if (latitud < -90 || latitud > 90) {
      return res.status(400).json({
        success: false,
        message: "La latitud debe estar entre -90 y 90",
      });
    }

    if (longitud < -180 || longitud > 180) {
      return res.status(400).json({
        success: false,
        message: "La longitud debe estar entre -180 y 180",
      });
    }

    // Verificar que el domiciliario exista
    const domiciliario = await prisma.domiciliario.findUnique({
      where: { id_domiciliario: parseInt(id) },
    });

    if (!domiciliario) {
      return res.status(404).json({
        success: false,
        message: "Domiciliario no encontrado",
      });
    }

    if (!domiciliario.activo) {
      return res.status(400).json({
        success: false,
        message: "El domiciliario no está activo",
      });
    }

    // Actualizar ubicación
    const domiciliarioActualizado = await prisma.domiciliario.update({
      where: { id_domiciliario: parseInt(id) },
      data: {
        latitud_actual: latitud,
        longitud_actual: longitud,
        ultima_actualizacion_ubicacion: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: "Ubicación actualizada correctamente",
      data: {
        id_domiciliario: domiciliarioActualizado.id_domiciliario,
        latitud: domiciliarioActualizado.latitud_actual,
        longitud: domiciliarioActualizado.longitud_actual,
        ultima_actualizacion: domiciliarioActualizado.ultima_actualizacion_ubicacion,
      },
    });
  } catch (error) {
    console.error("Error al actualizar ubicación:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar ubicación",
      error: error.message,
    });
  }
};

/**
 * Obtener la ubicación actual de un domiciliario
 * @route GET /api/seguimiento/domiciliario/:id/ubicacion
 * @access Privado (permisos: ver_seguimiento)
 */
const ObtenerUbicacionDomiciliario = async (req, res) => {
  const { id } = req.params;

  try {
    const domiciliario = await prisma.domiciliario.findUnique({
      where: { id_domiciliario: parseInt(id) },
      select: {
        id_domiciliario: true,
        nombres: true,
        apellidos: true,
        tipo_vehiculo: true,
        latitud_actual: true,
        longitud_actual: true,
        ultima_actualizacion_ubicacion: true,
        disponible: true,
        activo: true,
      },
    });

    if (!domiciliario) {
      return res.status(404).json({
        success: false,
        message: "Domiciliario no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        domiciliario,
      },
    });
  } catch (error) {
    console.error("Error al obtener ubicación del domiciliario:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener ubicación del domiciliario",
      error: error.message,
    });
  }
};

/**
 * Obtener ubicaciones de todos los domiciliarios activos
 * @route GET /api/seguimiento/domiciliarios
 * @access Privado (permisos: ver_seguimiento)
 */
const ObtenerUbicacionesDomiciliarios = async (req, res) => {
  try {
    const { activos_solo } = req.query;

    const whereClause = {
      activo: true,
    };

    if (activos_solo === "true") {
      whereClause.disponible = false; // Solo los que están en ruta
    }

    const domiciliarios = await prisma.domiciliario.findMany({
      where: whereClause,
      select: {
        id_domiciliario: true,
        nombres: true,
        apellidos: true,
        tipo_vehiculo: true,
        latitud_actual: true,
        longitud_actual: true,
        ultima_actualizacion_ubicacion: true,
        disponible: true,
        _count: {
          select: {
            rutas: {
              where: {
                estado: "En Curso",
              },
            },
          },
        },
      },
      orderBy: {
        ultima_actualizacion_ubicacion: "desc",
      },
    });

    res.status(200).json({
      success: true,
      data: {
        domiciliarios,
        total: domiciliarios.length,
      },
    });
  } catch (error) {
    console.error("Error al obtener ubicaciones de domiciliarios:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener ubicaciones de domiciliarios",
      error: error.message,
    });
  }
};

/**
 * Obtener información de seguimiento de una ruta activa
 * @route GET /api/seguimiento/ruta/:id
 * @access Privado (permisos: ver_seguimiento)
 */
const ObtenerSeguimientoRuta = async (req, res) => {
  const { id } = req.params;

  try {
    const ruta = await prisma.ruta.findUnique({
      where: { id_ruta: parseInt(id) },
      include: {
        domiciliario: {
          select: {
            id_domiciliario: true,
            nombres: true,
            apellidos: true,
            telefono: true,
            tipo_vehiculo: true,
            placa_vehiculo: true,
            latitud_actual: true,
            longitud_actual: true,
            ultima_actualizacion_ubicacion: true,
          },
        },
        entregas: {
          where: {
            activo: true,
          },
          orderBy: {
            orden_en_ruta: "asc",
          },
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
        },
      },
    });

    if (!ruta) {
      return res.status(404).json({
        success: false,
        message: "Ruta no encontrada",
      });
    }

    // Calcular progreso
    const totalEntregas = ruta.entregas.length;
    const entregasCompletadas = ruta.entregas.filter(
      (e) => e.estado === "Entregado"
    ).length;
    const progreso = totalEntregas > 0 ? (entregasCompletadas / totalEntregas) * 100 : 0;

    // Obtener siguiente entrega
    const siguienteEntrega = ruta.entregas.find(
      (e) => e.estado !== "Entregado" && e.estado !== "Cancelado"
    );

    res.status(200).json({
      success: true,
      data: {
        ruta: {
          ...ruta,
          progreso,
          totalEntregas,
          entregasCompletadas,
          entregasPendientes: totalEntregas - entregasCompletadas,
          siguienteEntrega,
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener seguimiento de ruta:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener seguimiento de ruta",
      error: error.message,
    });
  }
};

/**
 * Obtener todas las rutas activas (En Curso) con ubicaciones
 * @route GET /api/seguimiento/rutas-activas
 * @access Privado (permisos: ver_seguimiento)
 */
const ObtenerRutasActivas = async (req, res) => {
  try {
    const rutasActivas = await prisma.ruta.findMany({
      where: {
        estado: "En Curso",
        activo: true,
      },
      include: {
        domiciliario: {
          select: {
            id_domiciliario: true,
            nombres: true,
            apellidos: true,
            telefono: true,
            tipo_vehiculo: true,
            latitud_actual: true,
            longitud_actual: true,
            ultima_actualizacion_ubicacion: true,
          },
        },
        entregas: {
          where: {
            activo: true,
          },
          select: {
            id_entrega: true,
            numero_pedido: true,
            estado: true,
            orden_en_ruta: true,
            direccion_entrega: true,
            ciudad_entrega: true,
            departamento_entrega: true,
            barrio_entrega: true,
            paciente: {
              select: {
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
          select: {
            entregas: true,
          },
        },
      },
      orderBy: {
        fecha_inicio: "desc",
      },
    });

    // Agregar estadísticas de progreso a cada ruta
    const rutasConProgreso = rutasActivas.map((ruta) => {
      const totalEntregas = ruta.entregas.length;
      const entregasCompletadas = ruta.entregas.filter(
        (e) => e.estado === "Entregado"
      ).length;
      const progreso = totalEntregas > 0 ? (entregasCompletadas / totalEntregas) * 100 : 0;

      return {
        ...ruta,
        progreso,
        totalEntregas,
        entregasCompletadas,
        entregasPendientes: totalEntregas - entregasCompletadas,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        rutas: rutasConProgreso,
        total: rutasConProgreso.length,
      },
    });
  } catch (error) {
    console.error("Error al obtener rutas activas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener rutas activas",
      error: error.message,
    });
  }
};

/**
 * Simular movimiento de un domiciliario (para desarrollo/testing)
 * @route POST /api/seguimiento/domiciliario/:id/simular-movimiento
 * @access Privado (permisos: actualizar_ubicacion)
 */
const SimularMovimiento = async (req, res) => {
  const { id } = req.params;

  try {
    const domiciliario = await prisma.domiciliario.findUnique({
      where: { id_domiciliario: parseInt(id) },
    });

    if (!domiciliario) {
      return res.status(404).json({
        success: false,
        message: "Domiciliario no encontrado",
      });
    }

    // Coordenadas de ejemplo en Colombia (Bogotá)
    // Si ya tiene ubicación, moverlo ligeramente
    let nuevaLatitud, nuevaLongitud;

    if (domiciliario.latitud_actual && domiciliario.longitud_actual) {
      // Mover aleatoriamente en un radio pequeño (aproximadamente 500m)
      const deltaLat = (Math.random() - 0.5) * 0.01; // ~0.5km
      const deltaLon = (Math.random() - 0.5) * 0.01;
      nuevaLatitud = parseFloat(domiciliario.latitud_actual) + deltaLat;
      nuevaLongitud = parseFloat(domiciliario.longitud_actual) + deltaLon;
    } else {
      // Coordenadas iniciales en Bogotá
      nuevaLatitud = 4.60971 + (Math.random() - 0.5) * 0.1;
      nuevaLongitud = -74.08175 + (Math.random() - 0.5) * 0.1;
    }

    const domiciliarioActualizado = await prisma.domiciliario.update({
      where: { id_domiciliario: parseInt(id) },
      data: {
        latitud_actual: nuevaLatitud,
        longitud_actual: nuevaLongitud,
        ultima_actualizacion_ubicacion: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: "Movimiento simulado correctamente",
      data: {
        id_domiciliario: domiciliarioActualizado.id_domiciliario,
        latitud: domiciliarioActualizado.latitud_actual,
        longitud: domiciliarioActualizado.longitud_actual,
        ultima_actualizacion: domiciliarioActualizado.ultima_actualizacion_ubicacion,
      },
    });
  } catch (error) {
    console.error("Error al simular movimiento:", error);
    res.status(500).json({
      success: false,
      message: "Error al simular movimiento",
      error: error.message,
    });
  }
};

module.exports = {
  ActualizarUbicacion,
  ObtenerUbicacionDomiciliario,
  ObtenerUbicacionesDomiciliarios,
  ObtenerSeguimientoRuta,
  ObtenerRutasActivas,
  SimularMovimiento,
};
