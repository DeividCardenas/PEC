import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'soft' | 'medium' | 'strong';
}

/**
 * Componente Card moderno y reutilizable
 * Card contenedor con sombra y bordes redondeados
 */
const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  onClick,
  padding = 'md',
  shadow = 'medium',
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const shadowStyles = {
    none: '',
    soft: 'shadow-soft',
    medium: 'shadow-medium',
    strong: 'shadow-strong',
  };

  const hoverStyles = hoverable
    ? 'transition-all duration-200 hover:shadow-strong hover:-translate-y-0.5 cursor-pointer'
    : '';

  const combinedClassName = `bg-white rounded-xl ${paddingStyles[padding]} ${shadowStyles[shadow]} ${hoverStyles} ${className}`;

  if (onClick) {
    return (
      <div className={combinedClassName} onClick={onClick} role="button" tabIndex={0}>
        {children}
      </div>
    );
  }

  return <div className={combinedClassName}>{children}</div>;
};

export default Card;

/**
 * Componente CardHeader - Cabecera de tarjeta
 */
export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`border-b border-gray-200 pb-3 mb-4 ${className}`}>{children}</div>;
};

/**
 * Componente CardTitle - Título de tarjeta
 */
export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>;
};

/**
 * Componente CardContent - Contenido de tarjeta
 */
export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={className}>{children}</div>;
};

/**
 * Componente CardFooter - Pie de tarjeta
 */
export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`border-t border-gray-200 pt-3 mt-4 ${className}`}>{children}</div>;
};
