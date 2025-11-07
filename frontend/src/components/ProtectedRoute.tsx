import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

/**
 * Componente para proteger rutas que requieren autenticación
 * @param children - Componente hijo a renderizar si el usuario está autenticado
 * @param allowedRoles - Array de roles permitidos (opcional)
 * @param redirectTo - Ruta a la que redirigir si no está autorizado (default: '/')
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/'
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Si no hay usuario autenticado, redirigir al login
    if (!user || !user.id) {
      navigate('/');
      return;
    }

    // Si hay roles específicos requeridos, validar
    if (allowedRoles && allowedRoles.length > 0) {
      if (!user.rol || !allowedRoles.includes(user.rol)) {
        // Usuario no tiene el rol necesario, redirigir
        navigate(redirectTo);
        return;
      }
    }
  }, [user, allowedRoles, navigate, redirectTo]);

  // Si no hay usuario, no renderizar nada (ya se está redirigiendo)
  if (!user || !user.id) {
    return null;
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
