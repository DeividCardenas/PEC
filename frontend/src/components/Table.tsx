import React from 'react';

export interface Column<T> {
  key: string;
  title: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
}

/**
 * Componente Table moderno y responsive
 * Tabla profesional con soporte para striped, hoverable, bordered
 */
function Table<T>({
  columns,
  data,
  keyExtractor,
  className = '',
  striped = false,
  hoverable = true,
  bordered = true,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  onRowClick,
}: TableProps<T>) {
  const borderStyles = bordered ? 'border border-gray-200' : '';

  return (
    <div className={`overflow-x-auto rounded-xl shadow-soft ${className}`}>
      <table className={`min-w-full divide-y divide-gray-200 ${borderStyles}`}>
        {/* Header */}
        <thead className="bg-gradient-to-r from-primary-600 to-primary-700">
          <tr>
            {columns.map((column, idx) => (
              <th
                key={`header-${column.key}-${idx}`}
                className={`px-4 py-3 text-${column.align || 'left'} text-xs font-semibold text-white uppercase tracking-wider ${column.className || ''}`}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                  <p className="text-gray-500">Cargando datos...</p>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const key = keyExtractor(row, rowIndex);
              const isEven = rowIndex % 2 === 0;
              const stripedClass = striped && !isEven ? 'bg-gray-50' : '';
              const hoverClass = hoverable ? 'hover:bg-primary-50 transition-colors duration-150' : '';
              const clickableClass = onRowClick ? 'cursor-pointer' : '';

              return (
                <tr
                  key={key}
                  className={`${stripedClass} ${hoverClass} ${clickableClass}`}
                  onClick={() => onRowClick && onRowClick(row, rowIndex)}
                >
                  {columns.map((column, colIndex) => {
                    const value = (row as any)[column.key];
                    const content = column.render
                      ? column.render(value, row, rowIndex)
                      : value?.toString() || '-';

                    return (
                      <td
                        key={`cell-${key}-${column.key}-${colIndex}`}
                        className={`px-4 py-3 text-${column.align || 'left'} text-sm text-gray-900 ${column.className || ''}`}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;

/**
 * Componente TableActions - Contenedor de acciones de tabla
 */
export const TableActions: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Componente TableFilters - Contenedor de filtros de tabla
 */
export const TableFilters: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-4 mb-4 ${className}`}>
      {children}
    </div>
  );
};
