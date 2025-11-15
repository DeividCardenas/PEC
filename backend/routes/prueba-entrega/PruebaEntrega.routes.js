/**
 * Rutas de Prueba de Entrega Digital (RF010)
 */

const express = require("express");
const router = express.Router();
const {
  RegistrarPruebaEntrega,
  ObtenerPruebaEntrega,
  ConfirmarEntregaSinPrueba,
  ObtenerFirma,
  ObtenerFoto,
  ObtenerEstadisticas,
} = require("../../controllers/prueba-entrega/PruebaEntrega.Controller");

const { VerificarAcceso } = require("../../middlewares/authMiddleware.enhanced");
const { uploadPruebaEntrega } = require("../../middleware/uploadConfig");

/**
 * @route   POST /api/prueba-entrega/:id
 * @desc    Registrar prueba de entrega con firma y/o foto
 * @access  Privado (registrar_prueba_entrega)
 */
router.post(
  "/:id",
  VerificarAcceso({ permisosRequeridos: ["registrar_prueba_entrega"] }),
  uploadPruebaEntrega,
  RegistrarPruebaEntrega
);

/**
 * @route   GET /api/prueba-entrega/:id
 * @desc    Obtener prueba de entrega
 * @access  Privado (ver_entregas)
 */
router.get(
  "/:id",
  VerificarAcceso({ permisosRequeridos: ["ver_entregas"] }),
  ObtenerPruebaEntrega
);

/**
 * @route   POST /api/prueba-entrega/:id/confirmar-sin-prueba
 * @desc    Confirmar entrega sin prueba digital
 * @access  Privado (gestionar_entregas)
 */
router.post(
  "/:id/confirmar-sin-prueba",
  VerificarAcceso({ permisosRequeridos: ["gestionar_entregas"] }),
  ConfirmarEntregaSinPrueba
);

/**
 * @route   GET /api/prueba-entrega/:id/firma
 * @desc    Obtener archivo de firma
 * @access  Privado (ver_entregas)
 */
router.get(
  "/:id/firma",
  VerificarAcceso({ permisosRequeridos: ["ver_entregas"] }),
  ObtenerFirma
);

/**
 * @route   GET /api/prueba-entrega/:id/foto
 * @desc    Obtener archivo de foto
 * @access  Privado (ver_entregas)
 */
router.get(
  "/:id/foto",
  VerificarAcceso({ permisosRequeridos: ["ver_entregas"] }),
  ObtenerFoto
);

/**
 * @route   GET /api/prueba-entrega/estadisticas
 * @desc    Obtener estadísticas de pruebas de entrega
 * @access  Privado (ver_entregas)
 */
router.get(
  "/estadisticas",
  VerificarAcceso({ permisosRequeridos: ["ver_entregas"] }),
  ObtenerEstadisticas
);

module.exports = router;
