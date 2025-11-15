/**
 * Configuración de roles y permisos del sistema
 */

export const ROLES = {
  ADMINISTRADOR: 'Administrador',
  FARMACEUTICO: 'Farmacéutico',
  FARMACEUTICO_SIN_ACENTO: 'Farmaceutico',
  AUXILIAR: 'Auxiliar',
  CONTADOR: 'Contador'
} as const;

export type RoleName = typeof ROLES[keyof typeof ROLES];

// Permisos base para cada rol
const PERMISOS_ADMINISTRADOR = [
  // Acceso total a todo el sistema
  '/Menu',
  '/Productos',
  '/Laboratorio',
  '/Empresas',
  '/EPS',
  '/Tarifario',
  '/Proveedores',
  '/Ordenes',
  '/Inventario',
  '/Reportes',
  '/Pacientes',
  '/Entregas',
  '/Rutas',
  '/Seguimiento',
  '/comparar',
  '/Admin'
];

const PERMISOS_FARMACEUTICO = [
  // Módulo de Compras completo + Inventario + Consultas
  '/Menu',
  '/Productos',
  '/Laboratorio',
  '/Proveedores',
  '/Ordenes',
  '/Inventario',
  '/Reportes',
  '/comparar',
  '/Tarifario',
  '/EPS'
];

const PERMISOS_AUXILIAR = [
  // Módulo de Entregas completo + Consultas básicas
  '/Menu',
  '/Pacientes',
  '/Entregas',
  '/Rutas',
  '/Seguimiento',
  '/Productos',
  '/Inventario'
];

const PERMISOS_CONTADOR = [
  // Solo reportes y consultas
  '/Menu',
  '/Reportes',
  '/Ordenes',
  '/Inventario',
  '/Proveedores',
  '/comparar',
  '/Productos'
];

/**
 * Define qué módulos puede acceder cada rol
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.ADMINISTRADOR]: PERMISOS_ADMINISTRADOR,
  [ROLES.FARMACEUTICO]: PERMISOS_FARMACEUTICO,
  [ROLES.FARMACEUTICO_SIN_ACENTO]: PERMISOS_FARMACEUTICO, // Mismo permiso con y sin acento
  [ROLES.AUXILIAR]: PERMISOS_AUXILIAR,
  [ROLES.CONTADOR]: PERMISOS_CONTADOR
};

/**
 * Normaliza el nombre del rol para manejar variaciones
 */
const normalizeRole = (role: string | null): string | null => {
  if (!role) return null;

  // Convertir a lowercase para comparación
  const roleLower = role.toLowerCase();

  // Mapear variaciones comunes
  if (roleLower === 'administrador') return ROLES.ADMINISTRADOR;
  if (roleLower === 'farmacéutico' || roleLower === 'farmaceutico') return ROLES.FARMACEUTICO;
  if (roleLower === 'auxiliar') return ROLES.AUXILIAR;
  if (roleLower === 'contador') return ROLES.CONTADOR;

  // Si no coincide con ninguna variación, devolver el rol original
  return role;
};

/**
 * Verifica si un rol tiene permiso para acceder a una ruta
 */
export const hasPermission = (userRole: string | null, route: string): boolean => {
  if (!userRole) {
    return false;
  }

  // Normalizar el rol
  const normalizedRole = normalizeRole(userRole);

  const permissions = ROLE_PERMISSIONS[normalizedRole || ''];
  if (!permissions) {
    return false;
  }

  // Verificar si tiene acceso exacto a la ruta
  if (permissions.includes(route)) {
    return true;
  }

  // Verificar rutas dinámicas (ej: /laboratorio/:id, /Empresa/:id, etc.)
  const hasMatch = permissions.some(permission => {
    const routeBase = route.split('/')[1];
    const permissionBase = permission.split('/')[1];
    return routeBase && permissionBase && routeBase.toLowerCase() === permissionBase.toLowerCase();
  });

  return hasMatch;
};

/**
 * Obtiene las rutas permitidas para un rol específico
 */
export const getAllowedRoutes = (userRole: string | null): string[] => {
  if (!userRole) return [];
  const normalizedRole = normalizeRole(userRole);
  return ROLE_PERMISSIONS[normalizedRole || ''] || [];
};
