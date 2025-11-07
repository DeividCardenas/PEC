// Importación de módulos necesarios
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Clase principal del servidor
class Server {
  constructor() {
    // Inicialización de la aplicación Express
    this.app = express();

    // Definición del puerto desde variables de entorno o valor por defecto
    this.port = process.env.PORT || 2000;

    // Prefijo base para todas las rutas del servidor
    this.path = "/pec/";

    // Llamado a métodos de configuración
    this.middlewares();   // Configuración de middlewares
    this.routes();        // Definición de rutas
    this.errorHandler();  // Manejo de errores
  }

  /**
   * Configura los middlewares globales del servidor.
   */
  middlewares() {
    // ===== SEGURIDAD =====

    // Helmet: Configura headers HTTP seguros
    this.app.use(helmet({
      contentSecurityPolicy: false, // Desactivado para permitir carga de recursos externos si es necesario
      crossOriginEmbedderPolicy: false,
    }));

    // CORS: Configuración más restrictiva
    const corsOptions = {
      origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : '*', // En desarrollo permite todas las origins, en producción usar lista específica
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      optionsSuccessStatus: 200
    };
    this.app.use(cors(corsOptions));

    // Rate Limiting Global: Limita requests generales
    const generalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 1000, // Límite de 1000 requests por ventana por IP
      message: { msg: 'Demasiadas peticiones desde esta IP, intente de nuevo más tarde.' },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(generalLimiter);

    // Rate Limiting para Autenticación: Más restrictivo
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 10, // Límite de 10 intentos de login por IP en 15 min
      message: { msg: 'Demasiados intentos de inicio de sesión, intente de nuevo en 15 minutos.' },
      skipSuccessfulRequests: true, // No contar requests exitosos
    });

    // Aplicar rate limiting específico a rutas de autenticación
    this.app.use(this.path + "usuario/login", authLimiter);
    this.app.use(this.path + "token", authLimiter);

    // ===== PARSERS =====
    this.app.use(express.json()); // Permite recibir y procesar JSON en las solicitudes
    this.app.use(express.urlencoded({ extended: true })); // Permite form data
  }

  /**
   * Define todas las rutas del servidor agrupadas por módulo.
   */
  routes() {
    // Rutas de autenticación y usuarios
    this.app.use(this.path + "usuario", require("../routes/auth/Usuario.Routes"));
    this.app.use(this.path + "token", require("../routes/auth/token.Routes"));

    // Rutas relacionadas con roles y permisos
    this.app.use(this.path + "rol", require("../routes/roles/Rol.routes"));
    this.app.use(this.path + "permiso", require("../routes/roles/Permiso.routes"));
    this.app.use(this.path + "permiso-rol", require("../routes/roles/PermisoOnRol.routes"));

    // Rutas de productos
    this.app.use(this.path + "producto", require("../routes/productos/Producto.routes"));
    this.app.use(this.path + "tarifario-producto", require("../routes/productos/TarifarioOnProducto.routes"));

    // Rutas de empresas y laboratorios
    this.app.use(this.path + "empresa", require("../routes/empresas/Empresa.routes"));
    this.app.use(this.path + "laboratorio", require("../routes/empresas/Laboratorio.routes"));
    this.app.use(this.path + "empresa-laboratorio", require("../routes/empresas/EmpresaOnLaboratorio.routes"));
  // Rutas de proveedores
  this.app.use(this.path + "proveedores", require("../routes/proveedores/Proveedor.routes"));

    // Rutas de órdenes de compra
    this.app.use(this.path + "ordenes-compra", require("../routes/ordenes/OrdenCompra.routes"));

    // Rutas de inventario (RF003)
    this.app.use(this.path + "inventario", require("../routes/inventario/Inventario.routes"));

    // Rutas de reportes (RF005)
    this.app.use(this.path + "reportes", require("../routes/reportes/Reportes.routes"));

    // Rutas para EPS y tarifarios
    this.app.use(this.path + "eps", require("../routes/eps/EPS.routes"));
    this.app.use(this.path + "tarifario", require("../routes/eps/Tarifario.routes"));
    this.app.use(this.path + "permiso-tarifario", require("../routes/roles/PermisoOnTarifario.routes"));
    // Ruta para comparador
    this.app.use(this.path + "compare", require("../routes/compare/Compare.routes"));
    // Ruta para debug (diagnóstico)
    this.app.use(this.path + "debug", require("../routes/debug/Debug.routes"));
  }

  /**
   * Middleware de manejo global de errores.
   */
  errorHandler() {
    // Middleware para rutas no encontradas (404)
    this.app.use((req, res, next) => {
      res.status(404).json({
        msg: "Ruta no encontrada",
        path: req.originalUrl
      });
    });

    // Middleware global de manejo de errores
    this.app.use((err, req, res, next) => {
      // Log del error en servidor (solo en desarrollo mostrar stack completo)
      if (process.env.NODE_ENV === 'development') {
        console.error('Error completo:', err);
      } else {
        console.error('Error:', err.message);
      }

      // Status code del error o 500 por defecto
      const statusCode = err.statusCode || 500;

      // Respuesta al cliente
      res.status(statusCode).json({
        msg: err.message || "Ocurrió un error en el servidor.",
        // Solo en desarrollo enviar stack trace
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });
  }

  /**
   * Inicia el servidor y escucha en el puerto configurado.
   */
  listen() {
    this.app.listen(this.port, '0.0.0.0', () => {
      console.log(`Servidor funcionando en el puerto: ${this.port}`);
    });
  }
}

// Exportación de la clase para su uso en otros archivos
module.exports = Server;
