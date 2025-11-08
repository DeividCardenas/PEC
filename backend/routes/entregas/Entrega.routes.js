/**
 * Rutas para Gestión de Entregas (RF008)
 */

const express = require("express");
const router = express.Router();

// Middleware de autenticación
const { VerificarAcceso } = require("../../middlewares/authMiddleware.enhanced");

// Controladores
const {
  ObtenerEntregas,
  ObtenerEntrega,
  CrearEntrega,
  ActualizarEntrega,
  CambiarEstadoEntrega,
  CancelarEntrega,
  ObtenerEstadisticasEntregas,
  ObtenerEntregasPorPaciente,
} = require("../../controllers/entregas/Entrega.Controller");

// Rutas especiales (deben ir antes de las rutas con :id)
router.get(
  "/estadisticas",
  VerificarAcceso({ permisosRequeridos: ["ver_entregas"] }),
  ObtenerEstadisticasEntregas
);

router.get(
  "/paciente/:id_paciente",
  VerificarAcceso({ permisosRequeridos: ["ver_entregas"] }),
  ObtenerEntregasPorPaciente
);

// Rutas CRUD
router.get(
  "/",
  VerificarAcceso({ permisosRequeridos: ["ver_entregas"] }),
  ObtenerEntregas
);

router.get(
  "/:id",
  VerificarAcceso({ permisosRequeridos: ["ver_entregas"] }),
  ObtenerEntrega
);

router.post(
  "/",
  VerificarAcceso({ permisosRequeridos: ["crear_entregas"] }),
  CrearEntrega
);

router.put(
  "/:id",
  VerificarAcceso({ permisosRequeridos: ["editar_entregas"] }),
  ActualizarEntrega
);

router.put(
  "/:id/estado",
  VerificarAcceso({ permisosRequeridos: ["despachar_entregas"] }),
  CambiarEstadoEntrega
);

router.put(
  "/:id/cancelar",
  VerificarAcceso({ permisosRequeridos: ["cancelar_entregas"] }),
  CancelarEntrega
);

module.exports = router;
