import React from 'react';
import { PaginationProps } from '../types';

/**
 * Componente de paginación reutilizable
 * @param currentPage - Página actual
 * @param totalPages - Total de páginas disponibles
 * @param onPageChange - Callback cuando cambia la página
 * @param className - Clases CSS adicionales (opcional)
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = ''
}) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleGoToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className={`flex justify-between items-center mb-4 text-sm w-full ${className}`}>
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={`py-2 px-3 bg-blue-950 hover:bg-gray-400 text-white rounded-md transition-colors ${
          currentPage === 1 ? 'invisible' : ''
        }`}
        style={{ width: '100px' }}
      >
        Anterior
      </button>

      <div className="flex-grow text-center text-white">
        Página {currentPage} de {totalPages}
      </div>

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={`py-2 px-3 bg-blue-950 hover:bg-gray-400 text-white rounded-md transition-colors ${
          currentPage === totalPages ? 'invisible' : ''
        }`}
        style={{ width: '100px' }}
      >
        Siguiente
      </button>
    </div>
  );
};

export default Pagination;
