import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Building2, Loader2, ArrowLeft } from "lucide-react";
import { EPS, fetchEPS } from "../../services/EPS/epsService";

const EPSPage = () => {
  const [epsList, setEpsList] = useState<EPS[]>([]);
  const [search, setSearch] = useState("");
  const [selectedEPS, setSelectedEPS] = useState<EPS | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchEpsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedEps = await fetchEPS({ nombre: search || undefined });
      const uniqueEPS = fetchedEps.eps?.filter((eps, index, self) => eps.id_eps && index === self.findIndex((e) => e.id_eps === eps.id_eps)) || [];
      setEpsList(uniqueEPS);
    } catch {
      setError("No se pudo cargar la información de las EPS. Intente más tarde.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchEpsData();
  }, [fetchEpsData]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setSelectedEPS(null);
      }
    }
    if (selectedEPS) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedEPS]);

  return (

    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm p-4 flex items-center">
        <button
          onClick={() => navigate('/Menu')}
          className="flex items-center text-gray-700 hover:text-gray-900 transition-colors px-4 py-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft size={24} className="mr-2" />
          <span className="font-medium">Volver al Menú</span>
        </button>
      </header>
      <div className="flex-1 p-6 flex flex-col items-center">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-2xl mb-6 relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar EPS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 pl-12 rounded-lg bg-white shadow-sm border border-gray-300 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                <X />
              </button>
            )}
          </div>
        </motion.div>

        {/* Mensaje de error */}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
        {loading ? (
          <Loader2 className="animate-spin text-primary-600" size={32} />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
            {epsList.length > 0 ? (
              epsList.map((eps) =>
                eps.id_eps ? (
                  <motion.button
                    key={eps.id_eps}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-6 bg-white border border-gray-200 shadow-sm hover:shadow-md rounded-xl flex flex-col items-center cursor-pointer transition-all"
                    onClick={() => setSelectedEPS(eps)}
                  >
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                      <Building2 size={28} className="text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{eps.nombre}</h3>
                  </motion.button>
                ) : null
              )
            ) : (
              <div className="text-gray-500 col-span-2 text-center py-8">No hay EPS disponibles</div>
            )}
          </motion.div>
        )}
      </div>

      {/* Modal de tarifarios */}
      <AnimatePresence>
        {selectedEPS && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4"
          >
            <motion.div
              ref={modalRef}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full border border-gray-200"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Tarifarios de {selectedEPS.nombre}</h2>
              <p className="text-sm text-gray-600 mb-4">Selecciona un tarifario para ver los detalles</p>
              <ul className="mt-4 space-y-3">
                {selectedEPS.tarifarios.length > 0 ? (
                  selectedEPS.tarifarios.map((tarifario) =>
                    tarifario.id_tarifario ? (
                      <li
                        key={tarifario.id_tarifario}
                        className="bg-gray-50 border border-gray-200 p-4 rounded-lg hover:bg-gray-100 hover:border-primary-300 transition cursor-pointer"
                      >
                        <Link to={`/tarifario/${tarifario.id_tarifario}`} className="block">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {tarifario.nombre}
                          </h3>
                        </Link>
                      </li>
                    ) : null
                  )
                ) : (
                  <li className="text-gray-500 text-center py-4">Sin tarifarios asociados</li>
                )}
              </ul>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedEPS(null)}
                className="mt-6 w-full bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EPSPage;
