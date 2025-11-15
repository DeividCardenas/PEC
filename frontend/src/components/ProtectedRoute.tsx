import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { hasPermission } from '../config/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
  requirePermission?: boolean; // Nueva prop para verificar permisos por ruta
}

/**
 * Componente para proteger rutas que requieren autenticación
 * @param children - Componente hijo a renderizar si el usuario está autenticado
 * @param allowedRoles - Array de roles permitidos (opcional)
 * @param redirectTo - Ruta a la que redirigir si no está autorizado (default: '/access-denied')
 * @param requirePermission - Si es true, verifica permisos basados en la ruta actual
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/access-denied',
  requirePermission = true
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Si no hay usuario autenticado, redirigir al login
    if (!user || !user.id) {
      navigate('/');
      return;
    }

    // Verificar permisos basados en la ruta actual
    if (requirePermission) {
      const currentPath = location.pathname;
      const hasAccess = hasPermission(user.rol, currentPath);

      if (!hasAccess) {
        navigate('/access-denied');
        return;
      }
    }

    // Si hay roles específicos requeridos, validar
    if (allowedRoles && allowedRoles.length > 0) {
      if (!user.rol || !allowedRoles.includes(user.rol)) {
        // Usuario no tiene el rol necesario, redirigir a acceso denegado
        navigate(redirectTo);
        return;
      }
    }

    setIsChecking(false);
  }, [user, allowedRoles, navigate, redirectTo, location.pathname, requirePermission]);

  // Si no hay usuario, no renderizar nada (ya se está redirigiendo)
  if (!user || !user.id) {
    return null;
  }

  // Mientras se verifica, mostrar un loading
  if (isChecking) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-dark-text text-xl">Verificando permisos...</div>
      </div>
    );
  }

  // Verificar permisos basados en la ruta actual
  if (requirePermission) {
    const currentPath = location.pathname;
    const hasAccess = hasPermission(user.rol, currentPath);

    if (!hasAccess) {
      return null;
    }
  }

  // Si hay roles específicos y el usuario no tiene el rol, no renderizar
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user.rol || !allowedRoles.includes(user.rol)) {
      return null;
    }
  }

  // Usuario autenticado y autorizado, renderizar children
  return <>{children}</>;
};

export default ProtectedRoute;
