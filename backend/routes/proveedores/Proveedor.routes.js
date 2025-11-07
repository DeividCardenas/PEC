/**
 * Rutas de Proveedores y Transacciones
 * Define las rutas para la gestión completa de proveedores e historial de transacciones
 */

const { Router } = require("express");
const router = Router();

const {
  // Proveedores
  MostrarProveedores,
  MostrarProveedor,
  CrearProveedor,
  EditarProveedor,
  EliminarProveedor,
  // Transacciones
  MostrarTransacciones,
  CrearTransaccion,
  EditarTransaccion,
  EliminarTransaccion
} = require("../../controllers/proveedores/Proveedor.Controller");

/* ========================== PROVEEDORES ========================== */

// Obtener todos los proveedores (con paginación y búsqueda)
router.get("/", MostrarProveedores);

// Obtener un proveedor específico por ID (con estadísticas)
router.get("/:id_proveedor", MostrarProveedor);

// Crear un nuevo proveedor
router.post("/", CrearProveedor);

// Editar un proveedor por ID
router.put("/:id_proveedor", EditarProveedor);

// Eliminar un proveedor por ID
router.delete("/:id_proveedor", EliminarProveedor);

/* ========================== TRANSACCIONES ========================== */

// Obtener historial de transacciones de un proveedor
router.get("/:id_proveedor/transacciones", MostrarTransacciones);

// Crear una nueva transacción para un proveedor
router.post("/:id_proveedor/transacciones", CrearTransaccion);

// Editar una transacción
router.put("/transacciones/:id_transaccion", EditarTransaccion);

// Eliminar una transacción
router.delete("/transacciones/:id_transaccion", EliminarTransaccion);

module.exports = router;
