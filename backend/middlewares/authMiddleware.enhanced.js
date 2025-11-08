/**
 * Middleware de Autenticación y Autorización Mejorado (RF006)
 * Versión mejorada con caché, logging, y funciones adicionales
 */

const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ============================================================================
// CACHÉ DE PERMISOS (para mejorar performance)
// ============================================================================
const cachePermisos = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Limpiar entradas expiradas del caché periódicamente
 */
setInterval(() => {
  const ahora = Date.now();
  for (const [key, value] of cachePermisos.entries()) {
    if (ahora - value.timestamp > CACHE_TTL) {
      cachePermisos.delete(key);
    }
  }
}, 60 * 1000); // Cada minuto

// ============================================================================
// MIDDLEWARE PRINCIPAL: VerificarAcceso (versión mejorada)
// ============================================================================

/**
 * Middleware principal para verificar autenticación y autorización
 *
 * @param {Object} opciones - Opciones de control de acceso
 * @param {Array<string>} [opciones.rolesPermitidos=[]] - Lista de roles autorizados
 * @param {Array<string>} [opciones.permisosRequeridos=[]] - Permisos específicos requeridos
 * @param {boolean} [opciones.requiereTodosLosPermisos=false] - Si true, requiere TODOS los permisos; si false, requiere AL MENOS UNO
 * @param {boolean} [opciones.verificarTarifario=false] - Si se debe validar acceso a tarifario
 * @param {boolean} [opciones.logging=true] - Si se debe registrar accesos
 * @returns {Function} Middleware Express
 */
const VerificarAcceso = ({
  rolesPermitidos = [],
  permisosRequeridos = [],
  requiereTodosLosPermisos = false,
  verificarTarifario = false,
  logging = true,
}) => {
  return async (req, res, next) => {
    const tiempoInicio = Date.now();

    try {
      // 1. Extraer y verificar token
      const token = extraerToken(req);
      if (!token) {
        return responderNoAutorizado(res, "Token no proporcionado");
      }

      // 2. Verificar y decodificar token
      const decoded = jwt.verify(token, process.env.AUTH_JW_SECRET_KEY);
      req.usuario = decoded;

      // 3. Buscar usuario con permisos (con caché)
      const usuario = await buscarUsuarioConRolCacheado(decoded.id_usuario);
      if (!usuario) {
        return responderNoAutorizado(res, "Usuario no encontrado o inactivo");
      }

      // Agregar información completa del usuario al request
      req.usuarioCompleto = usuario;

      // 4. Verificar rol
      if (!verificarRol(usuario, rolesPermitidos)) {
        logAccesoDenegado(req, usuario, "Rol no autorizado", logging);
        return responderProhibido(res, "No tienes el rol adecuado para acceder a esta ruta", {
          rolRequerido: rolesPermitidos,
          rolActual: usuario.rol.nombre,
        });
      }

      // 5. Verificar permisos
      if (!verificarPermisos(usuario, permisosRequeridos, requiereTodosLosPermisos)) {
        const permisosUsuario = usuario.rol.permisos.map((p) => p.permiso.nombre);
        logAccesoDenegado(req, usuario, "Permisos insuficientes", logging);
        return responderProhibido(res, "No tienes los permisos necesarios para acceder a esta ruta", {
          permisosRequeridos,
          permisosActuales: permisosUsuario,
          requiereTodos: requiereTodosLosPermisos,
        });
      }

      // 6. Verificar acceso a tarifario (si es necesario)
      if (verificarTarifario && !(await verificarAccesoTarifario(req, usuario))) {
        logAccesoDenegado(req, usuario, "Sin acceso a tarifario", logging);
        return responderProhibido(res, "No tienes acceso a este tarifario");
      }

      // 7. Logging de acceso exitoso
      if (logging) {
        const tiempoTotal = Date.now() - tiempoInicio;
        logAccesoExitoso(req, usuario, tiempoTotal);
      }

      // 8. Continuar con la siguiente función
      next();
    } catch (err) {
      manejarError(err, res, logging);
    }
  };
};

// ============================================================================
// MIDDLEWARE SIMPLE: Solo Autenticación (sin verificar permisos)
// ============================================================================

/**
 * Middleware simplificado que solo verifica que el usuario esté autenticado
 * No verifica roles ni permisos específicos
 */
const SoloAutenticado = async (req, res, next) => {
  try {
    const token = extraerToken(req);
    if (!token) {
      return responderNoAutorizado(res, "Token no proporcionado");
    }

    const decoded = jwt.verify(token, process.env.AUTH_JW_SECRET_KEY);
    req.usuario = decoded;

    const usuario = await buscarUsuarioBasico(decoded.id_usuario);
    if (!usuario) {
      return responderNoAutorizado(res, "Usuario no encontrado");
    }

    req.usuarioCompleto = usuario;
    next();
  } catch (err) {
    manejarError(err, res, false);
  }
};

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Extrae el token JWT del encabezado Authorization
 */
const extraerToken = (req) => {
  let token = req.header("Authorization");
  return token?.startsWith("Bearer ") ? token.slice(7) : token;
};

/**
 * Busca usuario con rol y permisos (versión con caché)
 */
const buscarUsuarioConRolCacheado = async (id_usuario) => {
  const cacheKey = `usuario_${id_usuario}`;
  const cacheEntry = cachePermisos.get(cacheKey);

  // Si existe en caché y no ha expirado, usar caché
  if (cacheEntry && Date.now() - cacheEntry.timestamp < CACHE_TTL) {
    return cacheEntry.data;
  }

  // Si no, buscar en base de datos
  const usuario = await prisma.usuario.findUnique({
    where: { id_usuario },
    include: {
      rol: {
        include: {
          permisos: {
            include: { permiso: true },
          },
        },
      },
    },
  });

  // Guardar en caché
  if (usuario) {
    cachePermisos.set(cacheKey, {
      data: usuario,
      timestamp: Date.now(),
    });
  }

  return usuario;
};

/**
 * Busca usuario sin cargar permisos (más rápido)
 */
const buscarUsuarioBasico = async (id_usuario) => {
  return await prisma.usuario.findUnique({
    where: { id_usuario },
    include: {
      rol: true,
    },
  });
};

/**
 * Verifica si el rol del usuario está autorizado
 */
const verificarRol = (usuario, rolesPermitidos) => {
  // Si no se especifican roles, permitir cualquier rol
  if (rolesPermitidos.length === 0) return true;

  // Permitir siempre a Administrador
  if (usuario.rol.nombre === "Administrador") return true;

  return rolesPermitidos.includes(usuario.rol.nombre);
};

/**
 * Verifica permisos del usuario
 *
 * @param {Object} usuario - Usuario con permisos
 * @param {Array<string>} permisosRequeridos - Lista de permisos requeridos
 * @param {boolean} requiereTodos - Si true, requiere TODOS; si false, AL MENOS UNO
 */
const verificarPermisos = (usuario, permisosRequeridos, requiereTodos = false) => {
  // Si no se requieren permisos, permitir
  if (permisosRequeridos.length === 0) return true;

  // Administrador siempre tiene acceso
  if (usuario.rol.nombre === "Administrador") return true;

  const permisosUsuario = usuario.rol.permisos.map((p) => p.permiso.nombre);

  if (requiereTodos) {
    // Requiere TODOS los permisos
    return permisosRequeridos.every((permiso) => permisosUsuario.includes(permiso));
  } else {
    // Requiere AL MENOS UNO de los permisos
    return permisosRequeridos.some((permiso) => permisosUsuario.includes(permiso));
  }
};

/**
 * Verifica acceso a tarifario específico
 */
const verificarAccesoTarifario = async (req, usuario) => {
  const { id_tarifario } = req.params;
  if (!id_tarifario) return false;

  // Administrador siempre tiene acceso
  if (usuario.rol.nombre === "Administrador") return true;

  return await prisma.permisoOnTarifario.findFirst({
    where: {
      id_tarifario: parseInt(id_tarifario),
      id_permiso: {
        in: usuario.rol.permisos.map((p) => p.permiso.id_permiso),
      },
    },
  });
};

// ============================================================================
// FUNCIONES DE RESPUESTA
// ============================================================================

const responderNoAutorizado = (res, mensaje, detalles = {}) => {
  return res.status(401).json({
    ok: false,
    msg: mensaje,
    ...detalles,
  });
};

const responderProhibido = (res, mensaje, detalles = {}) => {
  return res.status(403).json({
    ok: false,
    msg: mensaje,
    ...detalles,
  });
};

// ============================================================================
// MANEJO DE ERRORES
// ============================================================================

const manejarError = (err, res, logging = true) => {
  if (logging) {
    console.error("❌ Error en autenticación:", {
      nombre: err.name,
      mensaje: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  if (err.name === "TokenExpiredError") {
    return responderNoAutorizado(res, "Token expirado, por favor inicia sesión nuevamente", {
      expiredAt: err.expiredAt,
    });
  }

  if (err.name === "JsonWebTokenError") {
    return responderNoAutorizado(res, "Token inválido");
  }

  return responderNoAutorizado(res, "Error de autenticación");
};

// ============================================================================
// FUNCIONES DE LOGGING
// ============================================================================

const logAccesoExitoso = (req, usuario, tiempoMs) => {
  console.log(`✅ Acceso autorizado: ${usuario.username} (${usuario.rol.nombre}) -> ${req.method} ${req.originalUrl} [${tiempoMs}ms]`);
};

const logAccesoDenegado = (req, usuario, razon, logging) => {
  if (logging) {
    console.warn(`⛔ Acceso denegado: ${usuario.username} (${usuario.rol.nombre}) -> ${req.method} ${req.originalUrl} - Razón: ${razon}`);
  }
};

// ============================================================================
// FUNCIONES HELPER PARA USAR EN CONTROLADORES
// ============================================================================

/**
 * Verifica si el usuario actual tiene un permiso específico
 * Usar en controladores: if (tienePermiso(req, 'crear_productos')) { ... }
 */
const tienePermiso = (req, nombrePermiso) => {
  if (!req.usuarioCompleto) return false;
  if (req.usuarioCompleto.rol.nombre === "Administrador") return true;

  const permisosUsuario = req.usuarioCompleto.rol.permisos.map((p) => p.permiso.nombre);
  return permisosUsuario.includes(nombrePermiso);
};

/**
 * Verifica si el usuario actual tiene un rol específico
 * Usar en controladores: if (tieneRol(req, 'Comprador')) { ... }
 */
const tieneRol = (req, nombreRol) => {
  if (!req.usuarioCompleto) return false;
  return req.usuarioCompleto.rol.nombre === nombreRol;
};

/**
 * Verifica si el usuario es Administrador
 */
const esAdmin = (req) => {
  return tieneRol(req, "Administrador");
};

/**
 * Obtiene todos los permisos del usuario actual
 */
const obtenerPermisos = (req) => {
  if (!req.usuarioCompleto) return [];
  return req.usuarioCompleto.rol.permisos.map((p) => p.permiso.nombre);
};

/**
 * Invalida el caché de permisos de un usuario (llamar cuando se actualizan permisos)
 */
const invalidarCacheUsuario = (id_usuario) => {
  const cacheKey = `usuario_${id_usuario}`;
  cachePermisos.delete(cacheKey);
};

/**
 * Limpia todo el caché de permisos (llamar cuando se actualizan roles/permisos globalmente)
 */
const limpiarCacheCompleto = () => {
  cachePermisos.clear();
  console.log("🗑️  Caché de permisos limpiado completamente");
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Middlewares principales
  VerificarAcceso,
  SoloAutenticado,

  // Funciones helper para controladores
  tienePermiso,
  tieneRol,
  esAdmin,
  obtenerPermisos,

  // Gestión de caché
  invalidarCacheUsuario,
  limpiarCacheCompleto,
};
