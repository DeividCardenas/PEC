/**
 * Hook personalizado para gestión de permisos (RF006)
 * Proporciona funciones útiles para verificar permisos en componentes
 */

import { useAuth } from "../context/useAuth";

export interface PermisosUsuario {
  permisos: string[];
  rol: string;
}

/**
 * Hook para verificar permisos del usuario actual
 */
export const usePermissions = () => {
  const { user } = useAuth();

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  const tienePermiso = (nombrePermiso: string): boolean => {
    if (!user) return false;
    if (user.rol === "Administrador") return true;
    return user.permisos?.includes(nombrePermiso) || false;
  };

  /**
   * Verifica si el usuario tiene AL MENOS UNO de los permisos especificados
   */
  const tieneAlgunPermiso = (permisos: string[]): boolean => {
    if (!user) return false;
    if (user.rol === "Administrador") return true;
    return permisos.some((permiso) => user.permisos?.includes(permiso));
  };

  /**
   * Verifica si el usuario tiene TODOS los permisos especificados
   */
  const tieneTodosPermisos = (permisos: string[]): boolean => {
    if (!user) return false;
    if (user.rol === "Administrador") return true;
    return permisos.every((permiso) => user.permisos?.includes(permiso));
  };

  /**
   * Verifica si el usuario tiene un rol específico
   */
  const tieneRol = (nombreRol: string): boolean => {
    if (!user) return false;
    return user.rol === nombreRol;
  };

  /**
   * Verifica si el usuario tiene AL MENOS UNO de los roles especificados
   */
  const tieneAlgunRol = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.rol);
  };

  /**
   * Verifica si el usuario es Administrador
   */
  const esAdmin = (): boolean => {
    return tieneRol("Administrador");
  };

  /**
   * Obtiene todos los permisos del usuario
   */
  const obtenerPermisos = (): string[] => {
    return user?.permisos || [];
  };

  /**
   * Obtiene el rol del usuario
   */
  const obtenerRol = (): string => {
    return user?.rol || "";
  };

  return {
    // Verificación de permisos
    tienePermiso,
    tieneAlgunPermiso,
    tieneTodosPermisos,

    // Verificación de roles
    tieneRol,
    tieneAlgunRol,
    esAdmin,

    // Obtención de información
    obtenerPermisos,
    obtenerRol,

    // Información directa del usuario
    rol: user?.rol || "",
    permisos: user?.permisos || [],
    estaAutenticado: !!user,
  };
};

/**
 * Hook para mostrar/ocultar elementos según permisos
 * Uso: const { mostrar } = useShowWithPermission('crear_productos');
 */
export const useShowWithPermission = (permiso: string) => {
  const { tienePermiso } = usePermissions();

  return {
    mostrar: tienePermiso(permiso),
  };
};

/**
 * Hook para mostrar/ocultar elementos según rol
 * Uso: const { mostrar } = useShowWithRole('Comprador');
 */
export const useShowWithRole = (rol: string) => {
  const { tieneRol } = usePermissions();

  return {
    mostrar: tieneRol(rol),
  };
};
