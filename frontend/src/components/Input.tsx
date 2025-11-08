import React, { forwardRef } from 'react';
import { AlertCircle, CheckCircle, Search, X } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'search';
  clearable?: boolean;
  onClear?: () => void;
  fullWidth?: boolean;
}

/**
 * Componente Input moderno y reutilizable
 * Soporta labels, errores, hints, iconos y estados
 */
const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  success,
  hint,
  leftIcon,
  rightIcon,
  variant = 'default',
  clearable = false,
  onClear,
  fullWidth = true,
  className = '',
  type = 'text',
  value,
  ...props
}, ref) => {
  const hasError = !!error;
  const hasSuccess = !!success;

  const baseInputStyles = 'px-4 py-2.5 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';

  const variantStyles = {
    default: 'bg-white',
    search: 'bg-gray-50 border-gray-200 focus:bg-white'
  };

  const stateStyles = hasError
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
    : hasSuccess
    ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500';

  const widthStyles = fullWidth ? 'w-full' : '';

  const paddingStyles = leftIcon ? 'pl-10' : '';
  const rightPaddingStyles = (rightIcon || clearable || hasError || hasSuccess) ? 'pr-10' : '';

  const inputClassName = `${baseInputStyles} ${variantStyles[variant]} ${stateStyles} ${widthStyles} ${paddingStyles} ${rightPaddingStyles} ${className}`;

  // Auto-add search icon for search variant
  const effectiveLeftIcon = variant === 'search' && !leftIcon ? <Search size={20} className="text-gray-400" /> : leftIcon;

  const handleClear = () => {
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {effectiveLeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {effectiveLeftIcon}
          </div>
        )}

        <input
          ref={ref}
          type={type}
          value={value}
          className={inputClassName}
          {...props}
        />

        {/* Right side icons */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
          {/* Error icon */}
          {hasError && (
            <AlertCircle size={20} className="text-red-500" />
          )}

          {/* Success icon */}
          {hasSuccess && (
            <CheckCircle size={20} className="text-green-500" />
          )}

          {/* Clear button */}
          {clearable && value && !hasError && !hasSuccess && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
            >
              <X size={20} />
            </button>
          )}

          {/* Custom right icon */}
          {rightIcon && !clearable && !hasError && !hasSuccess && rightIcon}
        </div>
      </div>

      {/* Helper text */}
      {(error || success || hint) && (
        <div className="mt-1.5">
          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              {error}
            </p>
          )}
          {success && !error && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              {success}
            </p>
          )}
          {hint && !error && !success && (
            <p className="text-sm text-gray-500">
              {hint}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
