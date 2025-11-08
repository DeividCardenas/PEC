/**
 * Controller de Prueba de Entrega Digital (RF010)
 *
 * Funcionalidades:
 * - Registrar prueba de entrega (firma digital y/o foto)
 * - Obtener prueba de entrega
 * - Confirmar entrega completa
 */

const prisma = require("../../config/database");
const fs = require("fs");
const path = require("path");

/**
 * Registrar prueba de entrega con firma y/o foto
 * @route POST /api/prueba-entrega/:id
 * @access Privado (permisos: registrar_prueba_entrega)
 */
const RegistrarPruebaEntrega = async (req, res) => {
  const { id } = req.params;
  const {
    nombre_receptor,
    identificacion_receptor,
    observaciones_entrega,
  } = req.body;

  try {
    // Verificar que la entrega exista
    const entrega = await prisma.entrega.findUnique({
      where: { id_entrega: parseInt(id) },
      include: {
        paciente: true,
      },
    });

    if (!entrega) {
      return res.status(404).json({
        success: false,
        message: "Entrega no encontrada",
      });
    }

    // Verificar que la entrega esté en estado "Despachado"
    if (entrega.estado !== "Despachado") {
      return res.status(400).json({
        success: false,
        message: `La entrega debe estar en estado "Despachado" para registrar prueba. Estado actual: ${entrega.estado}`,
      });
    }

    // Validar datos mínimos
    if (!nombre_receptor || !identificacion_receptor) {
      return res.status(400).json({
        success: false,
        message: "Nombre e identificación del receptor son requeridos",
      });
    }

    // Procesar archivos subidos (si existen)
    let firma_path = null;
    let foto_path = null;

    if (req.files) {
      if (req.files.firma) {
        firma_path = req.files.firma[0].filename;
      }
      if (req.files.foto) {
        foto_path = req.files.foto[0].filename;
      }
    }

    // Si no hay ni firma ni foto, advertir
    if (!firma_path && !foto_path) {
      return res.status(400).json({
        success: false,
        message: "Debe proporcionar al menos una firma digital o una foto de evidencia",
      });
    }

    // Actualizar la entrega con la prueba de entrega
    const entregaActualizada = await prisma.entrega.update({
      where: { id_entrega: parseInt(id) },
      data: {
        firma_entrega: firma_path,
        foto_entrega: foto_path,
        nombre_receptor,
        identificacion_receptor,
        observaciones_entrega,
        fecha_confirmacion_entrega: new Date(),
        estado: "Entregado",
        fecha_entrega_real: new Date(),
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
    });

    res.status(200).json({
      success: true,
      message: "Prueba de entrega registrada correctamente",
      data: {
        entrega: entregaActualizada,
      },
    });
  } catch (error) {
    console.error("Error al registrar prueba de entrega:", error);

    // Si hay error, eliminar archivos subidos
    if (req.files) {
      if (req.files.firma) {
        const firmaPath = path.join(__dirname, "../../uploads/entregas", req.files.firma[0].filename);
        if (fs.existsSync(firmaPath)) {
          fs.unlinkSync(firmaPath);
        }
      }
      if (req.files.foto) {
        const fotoPath = path.join(__dirname, "../../uploads/entregas", req.files.foto[0].filename);
        if (fs.existsSync(fotoPath)) {
          fs.unlinkSync(fotoPath);
        }
      }
    }

    res.status(500).json({
      success: false,
      message: "Error al registrar prueba de entrega",
      error: error.message,
    });
  }
};

/**
 * Obtener prueba de entrega de una entrega específica
 * @route GET /api/prueba-entrega/:id
 * @access Privado (permisos: ver_entregas)
 */
const ObtenerPruebaEntrega = async (req, res) => {
  const { id } = req.params;

  try {
    const entrega = await prisma.entrega.findUnique({
      where: { id_entrega: parseInt(id) },
      select: {
        id_entrega: true,
        numero_pedido: true,
        estado: true,
        firma_entrega: true,
        foto_entrega: true,
        nombre_receptor: true,
        identificacion_receptor: true,
        observaciones_entrega: true,
        fecha_confirmacion_entrega: true,
        fecha_entrega_real: true,
        paciente: {
          select: {
            nombres: true,
            apellidos: true,
            numero_identificacion: true,
          },
        },
      },
    });

    if (!entrega) {
      return res.status(404).json({
        success: false,
        message: "Entrega no encontrada",
      });
    }

    // Verificar si tiene prueba de entrega
    const tienePrueba = entrega.firma_entrega || entrega.foto_entrega;

    res.status(200).json({
      success: true,
      data: {
        entrega,
        tiene_prueba: tienePrueba,
      },
    });
  } catch (error) {
    console.error("Error al obtener prueba de entrega:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener prueba de entrega",
      error: error.message,
    });
  }
};

/**
 * Confirmar entrega sin prueba digital (para casos especiales)
 * @route POST /api/prueba-entrega/:id/confirmar-sin-prueba
 * @access Privado (permisos: gestionar_entregas)
 */
const ConfirmarEntregaSinPrueba = async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;

  try {
    const entrega = await prisma.entrega.findUnique({
      where: { id_entrega: parseInt(id) },
    });

    if (!entrega) {
      return res.status(404).json({
        success: false,
        message: "Entrega no encontrada",
      });
    }

    if (entrega.estado !== "Despachado") {
      return res.status(400).json({
        success: false,
        message: `La entrega debe estar en estado "Despachado". Estado actual: ${entrega.estado}`,
      });
    }

    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: "Debe proporcionar un motivo para confirmar sin prueba",
      });
    }

    const entregaActualizada = await prisma.entrega.update({
      where: { id_entrega: parseInt(id) },
      data: {
        estado: "Entregado",
        fecha_entrega_real: new Date(),
        observaciones_entrega: `Confirmado sin prueba digital. Motivo: ${motivo}`,
      },
    });

    res.status(200).json({
      success: true,
      message: "Entrega confirmada sin prueba digital",
      data: {
        entrega: entregaActualizada,
      },
    });
  } catch (error) {
    console.error("Error al confirmar entrega sin prueba:", error);
    res.status(500).json({
      success: false,
      message: "Error al confirmar entrega sin prueba",
      error: error.message,
    });
  }
};

/**
 * Obtener archivo de firma
 * @route GET /api/prueba-entrega/:id/firma
 * @access Privado (permisos: ver_entregas)
 */
const ObtenerFirma = async (req, res) => {
  const { id } = req.params;

  try {
    const entrega = await prisma.entrega.findUnique({
      where: { id_entrega: parseInt(id) },
      select: {
        firma_entrega: true,
      },
    });

    if (!entrega) {
      return res.status(404).json({
        success: false,
        message: "Entrega no encontrada",
      });
    }

    if (!entrega.firma_entrega) {
      return res.status(404).json({
        success: false,
        message: "Esta entrega no tiene firma registrada",
      });
    }

    const firmaPath = path.join(__dirname, "../../uploads/entregas", entrega.firma_entrega);

    if (!fs.existsSync(firmaPath)) {
      return res.status(404).json({
        success: false,
        message: "Archivo de firma no encontrado",
      });
    }

    res.sendFile(firmaPath);
  } catch (error) {
    console.error("Error al obtener firma:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener firma",
      error: error.message,
    });
  }
};

/**
 * Obtener archivo de foto
 * @route GET /api/prueba-entrega/:id/foto
 * @access Privado (permisos: ver_entregas)
 */
const ObtenerFoto = async (req, res) => {
  const { id } = req.params;

  try {
    const entrega = await prisma.entrega.findUnique({
      where: { id_entrega: parseInt(id) },
      select: {
        foto_entrega: true,
      },
    });

    if (!entrega) {
      return res.status(404).json({
        success: false,
        message: "Entrega no encontrada",
      });
    }

    if (!entrega.foto_entrega) {
      return res.status(404).json({
        success: false,
        message: "Esta entrega no tiene foto registrada",
      });
    }

    const fotoPath = path.join(__dirname, "../../uploads/entregas", entrega.foto_entrega);

    if (!fs.existsSync(fotoPath)) {
      return res.status(404).json({
        success: false,
        message: "Archivo de foto no encontrado",
      });
    }

    res.sendFile(fotoPath);
  } catch (error) {
    console.error("Error al obtener foto:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener foto",
      error: error.message,
    });
  }
};

/**
 * Obtener estadísticas de pruebas de entrega
 * @route GET /api/prueba-entrega/estadisticas
 * @access Privado (permisos: ver_entregas)
 */
const ObtenerEstadisticas = async (req, res) => {
  try {
    const totalEntregadas = await prisma.entrega.count({
      where: {
        estado: "Entregado",
        activo: true,
      },
    });

    const conFirma = await prisma.entrega.count({
      where: {
        estado: "Entregado",
        activo: true,
        firma_entrega: {
          not: null,
        },
      },
    });

    const conFoto = await prisma.entrega.count({
      where: {
        estado: "Entregado",
        activo: true,
        foto_entrega: {
          not: null,
        },
      },
    });

    const conAmbas = await prisma.entrega.count({
      where: {
        estado: "Entregado",
        activo: true,
        firma_entrega: {
          not: null,
        },
        foto_entrega: {
          not: null,
        },
      },
    });

    const sinPrueba = totalEntregadas - conFirma - conFoto + conAmbas;

    const porcentajeConPrueba = totalEntregadas > 0
      ? ((totalEntregadas - sinPrueba) / totalEntregadas) * 100
      : 0;

    res.status(200).json({
      success: true,
      data: {
        estadisticas: {
          total_entregadas: totalEntregadas,
          con_firma: conFirma,
          con_foto: conFoto,
          con_ambas: conAmbas,
          sin_prueba: sinPrueba,
          porcentaje_con_prueba: porcentajeConPrueba.toFixed(2),
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas",
      error: error.message,
    });
  }
};

module.exports = {
  RegistrarPruebaEntrega,
  ObtenerPruebaEntrega,
  ConfirmarEntregaSinPrueba,
  ObtenerFirma,
  ObtenerFoto,
  ObtenerEstadisticas,
};
