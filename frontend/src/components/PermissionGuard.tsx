/**
 * Componentes de Protección basados en Permisos y Roles (RF006)
 * Permiten mostrar/ocultar elementos según permisos del usuario
 */

import React from "react";
import { usePermissions } from "../hooks/usePermissions";
import { Navigate } from "react-router-dom";

// ============================================================================
// COMPONENTE: PermissionGuard
// ============================================================================

interface PermissionGuardProps {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
}

/**
 * Componente que muestra children solo si el usuario tiene el permiso especificado
 *
 * Uso:
 * <PermissionGuard permission="crear_productos">
 *   <button>Crear Producto</button>
 * </PermissionGuard>
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  fallback = null,
}) => {
  const { tienePermiso } = usePermissions();

  if (!tienePermiso(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// ============================================================================
// COMPONENTE: PermissionGuardAny
// ============================================================================

interface PermissionGuardAnyProps {
  children: React.ReactNode;
  permissions: string[];
  fallback?: React.ReactNode;
}

/**
 * Componente que muestra children si el usuario tiene AL MENOS UNO de los permisos
 *
 * Uso:
 * <PermissionGuardAny permissions={["crear_productos", "editar_productos"]}>
 *   <button>Gestionar Productos</button>
 * </PermissionGuardAny>
 */
export const PermissionGuardAny: React.FC<PermissionGuardAnyProps> = ({
  children,
  permissions,
  fallback = null,
}) => {
  const { tieneAlgunPermiso } = usePermissions();

  if (!tieneAlgunPermiso(permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// ============================================================================
// COMPONENTE: PermissionGuardAll
// ============================================================================

interface PermissionGuardAllProps {
  children: React.ReactNode;
  permissions: string[];
  fallback?: React.ReactNode;
}

/**
 * Componente que muestra children si el usuario tiene TODOS los permisos
 *
 * Uso:
 * <PermissionGuardAll permissions={["ver_productos", "editar_productos"]}>
 *   <button>Editar Producto</button>
 * </PermissionGuardAll>
 */
export const PermissionGuardAll: React.FC<PermissionGuardAllProps> = ({
  children,
  permissions,
  fallback = null,
}) => {
  const { tieneTodosPermisos } = usePermissions();

  if (!tieneTodosPermisos(permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// ============================================================================
// COMPONENTE: RoleGuard
// ============================================================================

interface RoleGuardProps {
  children: React.ReactNode;
  role: string;
  fallback?: React.ReactNode;
}

/**
 * Componente que muestra children solo si el usuario tiene el rol especificado
 *
 * Uso:
 * <RoleGuard role="Administrador">
 *   <button>Panel Admin</button>
 * </RoleGuard>
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ children, role, fallback = null }) => {
  const { tieneRol } = usePermissions();

  if (!tieneRol(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// ============================================================================
// COMPONENTE: RoleGuardAny
// ============================================================================

interface RoleGuardAnyProps {
  children: React.ReactNode;
  roles: string[];
  fallback?: React.ReactNode;
}

/**
 * Componente que muestra children si el usuario tiene AL MENOS UNO de los roles
 *
 * Uso:
 * <RoleGuardAny roles={["Comprador", "Administrador"]}>
 *   <button>Crear Orden</button>
 * </RoleGuardAny>
 */
export const RoleGuardAny: React.FC<RoleGuardAnyProps> = ({
  children,
  roles,
  fallback = null,
}) => {
  const { tieneAlgunRol } = usePermissions();

  if (!tieneAlgunRol(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// ============================================================================
// COMPONENTE: AdminOnly
// ============================================================================

interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Componente que muestra children solo para Administradores
 *
 * Uso:
 * <AdminOnly>
 *   <button>Configuración del Sistema</button>
 * </AdminOnly>
 */
export const AdminOnly: React.FC<AdminOnlyProps> = ({ children, fallback = null }) => {
  const { esAdmin } = usePermissions();

  if (!esAdmin()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// ============================================================================
// COMPONENTE: ProtectedRoute (mejorado)
// ============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  requireAll?: boolean; // Si true, requiere todos los permisos/roles; si false, al menos uno
  redirectTo?: string;
}

/**
 * Componente para proteger rutas completas basado en permisos o roles
 *
 * Uso:
 * <ProtectedRoute requiredPermission="ver_productos">
 *   <ProductosPage />
 * </ProtectedRoute>
 *
 * <ProtectedRoute requiredPermissions={["crear_productos", "editar_productos"]} requireAll={false}>
 *   <GestionProductosPage />
 * </ProtectedRoute>
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRole,
  requiredPermissions,
  requiredRoles,
  requireAll = false,
  redirectTo = "/acceso-denegado",
}) => {
  const { tienePermiso, tieneRol, tieneAlgunPermiso, tieneTodosPermisos, tieneAlgunRol } =
    usePermissions();

  // Verificar permiso único
  if (requiredPermission && !tienePermiso(requiredPermission)) {
    return <Navigate to={redirectTo} replace />;
  }

  // Verificar rol único
  if (requiredRole && !tieneRol(requiredRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  // Verificar múltiples permisos
  if (requiredPermissions) {
    const tieneAcceso = requireAll
      ? tieneTodosPermisos(requiredPermissions)
      : tieneAlgunPermiso(requiredPermissions);

    if (!tieneAcceso) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  // Verificar múltiples roles
  if (requiredRoles) {
    const tieneAcceso = tieneAlgunRol(requiredRoles);

    if (!tieneAcceso) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return <>{children}</>;
};

// ============================================================================
// COMPONENTE: AccessDeniedPage (nueva página de acceso denegado)
// ============================================================================

export const AccessDeniedPage: React.FC = () => {
  const { rol, permisos } = usePermissions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-pink-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
        <p className="text-gray-600 mb-6">
          No tienes los permisos necesarios para acceder a esta página.
        </p>

        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 mb-2">
            <strong>Tu rol actual:</strong> {rol || "Sin rol"}
          </p>
          {permisos.length > 0 && (
            <div className="text-left">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Tus permisos:</strong>
              </p>
              <div className="max-h-32 overflow-y-auto">
                <ul className="text-xs text-gray-600 space-y-1">
                  {permisos.map((permiso, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {permiso}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          Volver Atrás
        </button>
      </div>
    </div>
  );
};
