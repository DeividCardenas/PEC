import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PaginationProps } from '../types';

/**
 * Componente de paginación moderno y reutilizable
 * @param currentPage - Página actual
 * @param totalPages - Total de páginas disponibles
 * @param onPageChange - Callback cuando cambia la página
 * @param className - Clases CSS adicionales (opcional)
 */
const Pagination: React.FC<PaginationProps & { showFirstLast?: boolean }> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  showFirstLast = true
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

  const handleFirst = () => {
    if (currentPage !== 1) {
      onPageChange(1);
    }
  };

  const handleLast = () => {
    if (currentPage !== totalPages) {
      onPageChange(totalPages);
    }
  };

  // Generar números de página visibles
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`flex items-center justify-center gap-2 mb-4 ${className}`}>
      {/* First page */}
      {showFirstLast && (
        <button
          onClick={handleFirst}
          disabled={currentPage === 1}
          className="p-2 rounded-lg bg-white text-primary-700 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
          aria-label="Primera página"
        >
          <ChevronsLeft size={18} />
        </button>
      )}

      {/* Previous */}
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="p-2 rounded-lg bg-white text-primary-700 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
        aria-label="Página anterior"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Page numbers */}
      <div className="hidden sm:flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`dots-${index}`} className="px-3 py-2 text-gray-500">
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`min-w-[40px] px-3 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 ${
                isActive
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* Mobile page indicator */}
      <div className="sm:hidden px-4 py-2 bg-white rounded-lg shadow-sm text-sm font-medium text-gray-700">
        {currentPage} / {totalPages}
      </div>

      {/* Next */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg bg-white text-primary-700 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
        aria-label="Página siguiente"
      >
        <ChevronRight size={18} />
      </button>

      {/* Last page */}
      {showFirstLast && (
        <button
          onClick={handleLast}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg bg-white text-primary-700 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
          aria-label="Última página"
        >
          <ChevronsRight size={18} />
        </button>
      )}
    </div>
  );
};

export default Pagination;
