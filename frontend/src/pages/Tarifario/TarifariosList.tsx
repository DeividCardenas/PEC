import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTarifarios } from "../../services/Tarifario/tarifariosListService";
import { toast } from "react-toastify";

interface Tarifario {
  id_tarifario: number;
  nombre: string;
  id_eps?: number;
  id_empresa?: number;
}

const TarifariosList: React.FC = () => {
  const [tarifarios, setTarifarios] = useState<Tarifario[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const loadTarifarios = async () => {
      setLoading(true);
      try {
        const response = await fetchTarifarios(page, itemsPerPage);
        setTarifarios(response.tarifarios);
        setTotalPages(Math.ceil(response.total / itemsPerPage));
      } catch (error) {
        toast.error("Error al cargar los tarifarios");
      } finally {
        setLoading(false);
      }
    };
    loadTarifarios();
  }, [page]);

  return (
    <div className="p-6 bg-dark-bg min-h-screen flex flex-col items-center">
      <button
        onClick={() => navigate("/Menu")}
        className="self-start mb-4 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-700 hover:to-primary-900 text-white rounded-lg shadow-md transition-all duration-300"
      >
        Volver al Menú Principal
      </button>
      <h1 className="text-4xl font-bold text-white mb-6">Lista de Tarifarios</h1>
      {loading ? (
        <p className="text-white">Cargando tarifarios...</p>
      ) : (
        <>
          <ul className="space-y-4 w-full max-w-4xl">
            {tarifarios.map((tarifario) => (
              <li
                key={tarifario.id_tarifario}
                className="bg-dark-card rounded-lg p-4 shadow-lg hover:shadow-xl border border-primary-500/30 hover:border-primary-500 transition-all duration-300 cursor-pointer hover:bg-primary-900/20"
                onClick={() => navigate(`/tarifario/${tarifario.id_tarifario}`)}
              >
                <h3 className="text-xl font-semibold text-white">{tarifario.nombre}</h3>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-between items-center w-full max-w-4xl text-white">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-700 hover:to-primary-900 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span>
              Página {page} de {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-700 hover:to-primary-900 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TarifariosList;
